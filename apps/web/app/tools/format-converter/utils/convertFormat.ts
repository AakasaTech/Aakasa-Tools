export type TargetFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

const PROBE_SIZE = 64;

/** Cheap alpha-channel probe: downsamples onto a small offscreen canvas
 * and checks whether any sampled pixel is non-opaque. Only PNG/WebP source
 * files can carry transparency in the first place. */
export async function detectHasAlpha(file: File): Promise<boolean> {
  if (file.type !== 'image/png' && file.type !== 'image/webp') return false;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = PROBE_SIZE;
    canvas.height = PROBE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(bitmap, 0, 0, PROBE_SIZE, PROBE_SIZE);
    const { data } = ctx.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE);
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 255) < 255) return true;
    }
    return false;
  } finally {
    bitmap.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: TargetFormat, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Could not encode as ${mimeType}`));
      },
      mimeType,
      quality,
    );
  });
}

/** Converts `file` to `targetFormat` via Canvas (drawImage + toBlob).
 * When converting to JPEG (no alpha channel) and `backgroundColor` is
 * given, transparent areas are flattened onto that color first rather
 * than left to whatever default the browser's JPEG encoder falls back to
 * for transparent pixels. */
export async function convertImageFormat(file: File, targetFormat: TargetFormat, quality: number, backgroundColor?: string): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    if (targetFormat === 'image/jpeg' && backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);

    return await canvasToBlob(canvas, targetFormat, targetFormat === 'image/png' ? undefined : quality);
  } finally {
    bitmap.close();
  }
}
