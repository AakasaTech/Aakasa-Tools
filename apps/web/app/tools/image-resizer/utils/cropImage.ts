import type { ExportOptions } from './resizeImage';
import type { CropRect } from './cropMath';

function canvasToBlob(canvas: HTMLCanvasElement, options: ExportOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob produced no data'));
      },
      options.mimeType,
      options.mimeType === 'image/png' ? undefined : options.quality,
    );
  });
}

/** Extracts `cropRect` (in the source image's own pixel coordinates) from
 * `image` and returns the encoded result at exactly that rect's size.
 * Same JPEG transparency handling as resizeImage.ts — flattens onto white
 * rather than leaving transparent pixels to an unpredictable encoder
 * default. */
export async function cropToCanvas(image: ImageBitmap, cropRect: CropRect, exportOptions: ExportOptions): Promise<Blob> {
  const width = Math.max(1, Math.round(cropRect.width));
  const height = Math.max(1, Math.round(cropRect.height));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  if (exportOptions.mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(image, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, width, height);

  return canvasToBlob(canvas, exportOptions);
}
