export interface ExportOptions {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  /** 0-1, ignored for PNG (lossless). */
  quality?: number;
}

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

function drawScaled(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fillBackground?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  if (fillBackground) {
    ctx.fillStyle = fillBackground;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Downscales by progressively halving dimensions rather than one drastic
 * single-step draw, when shrinking by more than 2x in either dimension —
 * each halving step gives the browser's own scaling filter a gentle ~2x
 * ratio to work with per step, which is the standard technique for
 * avoiding the extra softness/aliasing a single huge-ratio downscale
 * produces (conceptually the same idea as mipmapping). Checked visually
 * against a single-pass draw on a large real downscale before relying on
 * this — see the tool's build summary for what was actually compared.
 */
function steppedDownscale(bitmap: ImageBitmap, targetWidth: number, targetHeight: number, fillBackground?: string): HTMLCanvasElement {
  let source: CanvasImageSource = bitmap;
  let width = bitmap.width;
  let height = bitmap.height;

  while (width > targetWidth * 2 && height > targetHeight * 2) {
    const nextWidth = Math.max(targetWidth, Math.round(width / 2));
    const nextHeight = Math.max(targetHeight, Math.round(height / 2));
    // Intermediate steps stay transparent — only the final draw flattens,
    // so an alpha channel survives all the way through the downscale
    // chain right up until it actually needs to be gone.
    source = drawScaled(source, width, height, nextWidth, nextHeight);
    width = nextWidth;
    height = nextHeight;
  }

  return drawScaled(source, width, height, targetWidth, targetHeight, fillBackground);
}

/** Resizes `image` to exactly `targetWidth`x`targetHeight` and returns the
 * encoded result. Uses the stepped downscale above whenever
 * `useSteppedDownscale` is true and the target is meaningfully smaller
 * than the source; otherwise (upscaling, or a modest reduction) a single
 * draw call is just as good and cheaper. JPEG has no alpha channel, so
 * exporting to it flattens onto a plain white background rather than
 * leaving transparent pixels to whatever black-fill default the browser's
 * JPEG encoder happens to use. */
export async function resizeToCanvas(
  image: ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  useSteppedDownscale: boolean,
  exportOptions: ExportOptions,
): Promise<Blob> {
  const fillBackground = exportOptions.mimeType === 'image/jpeg' ? '#FFFFFF' : undefined;
  const isSignificantDownscale = targetWidth < image.width * 0.5 || targetHeight < image.height * 0.5;
  const canvas =
    useSteppedDownscale && isSignificantDownscale
      ? steppedDownscale(image, targetWidth, targetHeight, fillBackground)
      : drawScaled(image, image.width, image.height, targetWidth, targetHeight, fillBackground);

  return canvasToBlob(canvas, exportOptions);
}
