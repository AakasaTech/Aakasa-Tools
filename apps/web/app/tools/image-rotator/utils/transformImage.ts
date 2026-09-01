export type RotatableSource = ImageBitmap | HTMLCanvasElement;

export type TransformStep = { type: 'rotate'; degrees: number } | { type: 'flip'; horizontal: boolean; vertical: boolean };

/**
 * Rotates `sourceImage` by `degrees` onto `canvas`, expanding the canvas to
 * the rotated rectangle's own bounding box so no corner is clipped —
 * `newWidth = |w·cosθ| + |h·sinθ|`, `newHeight = |w·sinθ| + |h·cosθ|`. For
 * any multiple of 90° this reduces to a plain width/height swap (or no
 * change, for 180°); for any other angle it's strictly larger than the
 * source in both dimensions. `backgroundColor`, when given, fills the
 * newly-exposed corners (needed for JPEG, which has no alpha channel);
 * omitted, they're left transparent.
 */
export function applyRotation(canvas: HTMLCanvasElement, sourceImage: RotatableSource, degrees: number, backgroundColor?: string): void {
  const srcWidth = sourceImage.width;
  const srcHeight = sourceImage.height;
  const radians = (degrees * Math.PI) / 180;
  const newWidth = Math.round(Math.abs(srcWidth * Math.cos(radians)) + Math.abs(srcHeight * Math.sin(radians)));
  const newHeight = Math.round(Math.abs(srcWidth * Math.sin(radians)) + Math.abs(srcHeight * Math.cos(radians)));

  canvas.width = Math.max(1, newWidth);
  canvas.height = Math.max(1, newHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(sourceImage, -srcWidth / 2, -srcHeight / 2, srcWidth, srcHeight);
  ctx.restore();
}

/** Mirrors `sourceImage` onto `canvas` — a flip never changes the
 * rectangle's bounding box, so the canvas is always sized to match the
 * source exactly. */
export function applyFlip(canvas: HTMLCanvasElement, sourceImage: RotatableSource, horizontal: boolean, vertical: boolean): void {
  const width = sourceImage.width;
  const height = sourceImage.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.translate(horizontal ? width : 0, vertical ? height : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(sourceImage, 0, 0, width, height);
  ctx.restore();
}

/**
 * Replays `steps` in order — each one's output becomes the next one's
 * input — onto `canvas`, via offscreen intermediate canvases. This is
 * what makes combined transforms click-order-faithful: "rotate, rotate,
 * flip" and "flip, rotate, rotate" fold through `applyRotation`/
 * `applyFlip` in the order given and land on different (correct) results,
 * rather than collapsing to some fixed rotate-then-flip convention.
 */
export function renderTransformSteps(canvas: HTMLCanvasElement, source: ImageBitmap, steps: TransformStep[], backgroundColor?: string): void {
  let current: RotatableSource = source;

  for (const step of steps) {
    const stage = document.createElement('canvas');
    if (step.type === 'rotate') applyRotation(stage, current, step.degrees, backgroundColor);
    else applyFlip(stage, current, step.horizontal, step.vertical);
    current = stage;
  }

  canvas.width = current.width;
  canvas.height = current.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (current === source && backgroundColor) {
    // No rotation ever ran, so no corners were ever exposed — still honor
    // a chosen background for a source with its own transparency (e.g. a
    // transparent PNG exported straight to JPEG with zero steps applied).
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(current, 0, 0);
}
