import imageCompression from 'browser-image-compression';

export type OutputFormat = 'original' | 'jpeg' | 'webp' | 'png';

export interface CompressionOptions {
  /** 0-100, mapped to the underlying library's 0-1 scale. Ignored for PNG output — canvas re-encoding of PNG is lossless regardless of this value. */
  quality: number;
  outputFormat: OutputFormat;
  /** Cap the longest edge to this many pixels; omit to skip resizing. */
  maxDimension?: number;
  /** Percentage 0-100, forwarded from the underlying library's own progress reporting. */
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  /** True when the requested output format was overridden to avoid flattening transparency to a solid color. */
  transparencyFallback: boolean;
  /** Human-readable explanation to surface in the UI, set whenever the requested format was overridden. */
  note?: string;
}

const FORMAT_MIME: Record<Exclude<OutputFormat, 'original'>, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
};

function resolveMimeType(format: OutputFormat): string | undefined {
  return format === 'original' ? undefined : FORMAT_MIME[format];
}

const TRANSPARENCY_PROBE_SIZE = 64;

/**
 * Cheap alpha-channel probe: downsamples onto a small offscreen canvas and
 * checks whether any sampled pixel is non-opaque. A fixed small probe size
 * keeps this fast even on large source images since we only need a yes/no
 * answer, not exact per-pixel alpha.
 */
async function hasTransparency(file: File): Promise<boolean> {
  if (file.type !== 'image/png' && file.type !== 'image/webp') {
    return false;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = TRANSPARENCY_PROBE_SIZE;
    canvas.height = TRANSPARENCY_PROBE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }
    ctx.drawImage(bitmap, 0, 0, TRANSPARENCY_PROBE_SIZE, TRANSPARENCY_PROBE_SIZE);
    const { data } = ctx.getImageData(0, 0, TRANSPARENCY_PROBE_SIZE, TRANSPARENCY_PROBE_SIZE);
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 255) < 255) {
        return true;
      }
    }
    return false;
  } finally {
    bitmap.close();
  }
}

/**
 * Thin wrapper around `browser-image-compression`. Two responsibilities the
 * library doesn't handle on its own: mapping a 0-100 quality slider onto its
 * 0-1 scale without also triggering its target-file-size iteration loop
 * (achieved by leaving `maxSizeMB` at its Infinity default), and refusing to
 * silently flatten transparent PNG/WebP images to a solid color when the
 * user asks to convert to JPEG — JPEG has no alpha channel, so that
 * conversion is redirected to WebP instead, which keeps the requested
 * "smaller lossy format" intent while preserving transparency.
 */
export async function compressImage(file: File, options: CompressionOptions): Promise<CompressionResult> {
  const { quality, outputFormat, maxDimension, onProgress } = options;

  let effectiveFormat = outputFormat;
  let transparencyFallback = false;
  let note: string | undefined;

  if (outputFormat === 'jpeg' && (await hasTransparency(file))) {
    effectiveFormat = 'webp';
    transparencyFallback = true;
    note = 'Converted to WebP instead of JPEG to preserve transparency.';
  }

  const compressed = await imageCompression(file, {
    fileType: resolveMimeType(effectiveFormat),
    initialQuality: Math.min(1, Math.max(0, quality / 100)),
    maxWidthOrHeight: maxDimension,
    maxSizeMB: Number.POSITIVE_INFINITY,
    useWebWorker: true,
    onProgress,
  });

  return {
    file: compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    transparencyFallback,
    note,
  };
}
