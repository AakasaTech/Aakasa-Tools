export type DimensionStrategy = 'first' | 'largest' | 'custom';

export interface SourceFrame {
  bitmap: ImageBitmap;
  delay: number;
}

export interface NormalizedFrame {
  canvas: HTMLCanvasElement;
  delay: number;
}

export interface CustomDimensions {
  width: number;
  height: number;
}

export function computeTargetDimensions(frames: SourceFrame[], strategy: DimensionStrategy, custom?: CustomDimensions): CustomDimensions {
  if (strategy === 'custom' && custom) return custom;
  if (frames.length === 0) return { width: 1, height: 1 };
  const first = frames[0];
  if (strategy === 'largest') {
    return {
      width: Math.max(...frames.map((f) => f.bitmap.width)),
      height: Math.max(...frames.map((f) => f.bitmap.height)),
    };
  }
  return { width: first?.bitmap.width ?? 1, height: first?.bitmap.height ?? 1 };
}

/** Draws `bitmap` into a `width`×`height` canvas by scaling it to fit
 * entirely within those bounds (preserving aspect ratio) and centering
 * it, filling any leftover space with `background` — a source frame
 * whose aspect ratio doesn't match the target is letterboxed, never
 * stretched or cropped into distortion. */
function drawLetterboxed(ctx: CanvasRenderingContext2D, bitmap: ImageBitmap, width: number, height: number, background: string) {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  ctx.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

/** Resizes/fits every frame in `frames` to one consistent output
 * dimension, per `strategy` — required because a GIF has a single
 * width/height shared by all frames, and source images commonly vary in
 * size. */
export function normalizeFrames(frames: SourceFrame[], strategy: DimensionStrategy, background = '#ffffff', custom?: CustomDimensions): NormalizedFrame[] {
  const { width, height } = computeTargetDimensions(frames, strategy, custom);
  return frames.map((frame) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) drawLetterboxed(ctx, frame.bitmap, width, height, background);
    return { canvas, delay: frame.delay };
  });
}
