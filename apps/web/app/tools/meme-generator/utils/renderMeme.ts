import { drawOutlinedText } from '../../watermark-adder/utils/drawOutlinedText';

export interface TextBoxConfig {
  id: string;
  text: string;
  /** Anchor position as a percentage of canvas width/height (0-100), so
   * layout survives the base image being swapped for one of a different
   * resolution. */
  xPercent: number;
  yPercent: number;
  fontFamily: string;
  /** The *maximum* size, in px at the canvas's native resolution — the
   * actual rendered size may be smaller when auto-fit shrinks it. */
  fontSize: number;
  autoFit: boolean;
  /** % of canvas width the text must not exceed when autoFit is on. */
  maxWidthPercent: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  align: CanvasTextAlign;
  uppercase: boolean;
}

export interface TextBoxBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_FONT_SIZE = 6;

/** Binary-searches the largest font size (bounded above by `maxSize`) at
 * which `text` measures no wider than `maxWidth`. Short text that already
 * fits at `maxSize` is returned unchanged on the first measurement — this
 * only ever shrinks, never grows, a box's configured size. */
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, fontFamily: string, maxSize: number, maxWidth: number): number {
  ctx.font = `${maxSize}px "${fontFamily}"`;
  if (ctx.measureText(text).width <= maxWidth) return maxSize;

  let lo = MIN_FONT_SIZE;
  let hi = maxSize;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    ctx.font = `${mid}px "${fontFamily}"`;
    if (ctx.measureText(text).width <= maxWidth) lo = mid;
    else hi = mid;
  }
  return Math.max(MIN_FONT_SIZE, Math.floor(lo));
}

interface ResolvedTextBox {
  displayText: string;
  fontSize: number;
  anchorX: number;
  anchorY: number;
  bounds: TextBoxBounds;
}

/** Computes the effective (post-auto-fit) font size, draw anchor point, and
 * axis-aligned bounding box for one text box — shared by the renderer
 * (which draws from this) and the interactive canvas overlay (which
 * hit-tests drags against this), so the two are never out of sync. */
function resolveTextBox(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, box: TextBoxConfig): ResolvedTextBox {
  const displayText = box.uppercase ? box.text.toUpperCase() : box.text;
  const anchorX = canvasWidth * (box.xPercent / 100);
  const anchorY = canvasHeight * (box.yPercent / 100);

  if (!displayText.trim()) {
    return { displayText, fontSize: box.fontSize, anchorX, anchorY, bounds: { x: anchorX, y: anchorY, width: 0, height: 0 } };
  }

  const maxWidth = box.autoFit ? canvasWidth * (box.maxWidthPercent / 100) : Infinity;
  const fontSize = fitFontSize(ctx, displayText, box.fontFamily, box.fontSize, maxWidth);

  ctx.font = `${fontSize}px "${box.fontFamily}"`;
  const metrics = ctx.measureText(displayText);
  const width = metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  const height = ascent + descent;

  let left: number;
  if (box.align === 'left') left = anchorX;
  else if (box.align === 'right') left = anchorX - width;
  else left = anchorX - width / 2;

  return { displayText, fontSize, anchorX, anchorY, bounds: { x: left, y: anchorY - height / 2, width, height } };
}

/** Draws `baseImage` onto `canvas` (sized to the image already) followed by
 * every text box, each auto-fit to `maxWidthPercent` of the canvas width
 * when `autoFit` is on and rendered with the shared outlined-text helper
 * from Watermark Adder — the classic thick-stroke meme caption look reuses
 * the exact same stroke-then-fill routine a watermark uses, just without
 * rotation or tiling. */
export function renderMemeToCanvas(canvas: HTMLCanvasElement, baseImage: ImageBitmap, textBoxes: TextBoxConfig[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  for (const box of textBoxes) {
    const resolved = resolveTextBox(ctx, canvas.width, canvas.height, box);
    if (!resolved.displayText.trim()) continue;

    ctx.font = `${resolved.fontSize}px "${box.fontFamily}"`;
    drawOutlinedText(ctx, resolved.displayText, resolved.anchorX, resolved.anchorY, {
      fillColor: box.color,
      strokeColor: box.strokeWidth > 0 ? box.strokeColor : undefined,
      strokeWidth: box.strokeWidth,
      textAlign: box.align,
      textBaseline: 'middle',
    });
  }
}

/** Same placement math `renderMemeToCanvas` draws from, exposed separately
 * so the interactive preview can hit-test drag gestures against exactly
 * what's on screen without duplicating the auto-fit sizing logic. */
export function getTextBoxBounds(canvas: HTMLCanvasElement, textBoxes: TextBoxConfig[]): Record<string, TextBoxBounds> {
  const ctx = canvas.getContext('2d');
  const bounds: Record<string, TextBoxBounds> = {};
  if (!ctx) return bounds;

  for (const box of textBoxes) {
    bounds[box.id] = resolveTextBox(ctx, canvas.width, canvas.height, box).bounds;
  }
  return bounds;
}
