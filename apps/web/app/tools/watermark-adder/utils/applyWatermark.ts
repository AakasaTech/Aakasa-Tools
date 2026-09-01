import { calculateWatermarkPositions, type PlacementPreset } from './calculateWatermarkPositions';
import { drawOutlinedText } from './drawOutlinedText';

export interface TextWatermarkOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  outline: boolean;
  outlineColor: string;
  rotation: number;
  placement: PlacementPreset;
  margin: number;
  spacing: number;
}

export interface ImageWatermarkOptions {
  scale: number;
  opacity: number;
  placement: PlacementPreset;
  margin: number;
  spacing: number;
}

/** Axis-aligned bounding box of a `width`×`height` box after rotating it
 * `degrees` around its own center — used so a rotated watermark's *visual*
 * footprint (not its unrotated text box) is what placement/tiling math
 * positions and spaces, otherwise a diagonal watermark would sit
 * off-center near corners/edges and tiled copies could visually overlap
 * despite the configured spacing. */
function rotatedBoundingBox(width: number, height: number, degrees: number): { width: number; height: number } {
  const radians = (degrees * Math.PI) / 180;
  return {
    width: Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)),
    height: Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians)),
  };
}

/** Draws `options.text` onto `canvas` (which already has the source image
 * drawn on it) at every position `calculateWatermarkPositions` returns.
 * Rotation and the optional outline are both applied together, per
 * position, inside the same translated+rotated context — a rotated stroke
 * and a rotated fill of the same glyph outlines, not two independent
 * effects layered by luck. */
export function applyTextWatermark(canvas: HTMLCanvasElement, options: TextWatermarkOptions): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !options.text) return;

  const fontSpec = `${options.fontSize}px "${options.fontFamily}"`;
  ctx.font = fontSpec;
  const metrics = ctx.measureText(options.text);
  const textWidth = metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || options.fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || options.fontSize * 0.2;
  const textHeight = ascent + descent;

  const bbox = rotatedBoundingBox(textWidth, textHeight, options.rotation);
  const spacing = options.placement === 'tiled' ? options.spacing : 0;
  const positions = calculateWatermarkPositions({ width: canvas.width, height: canvas.height }, bbox, options.placement, options.margin, spacing);

  const outlineWidth = Math.max(1, options.fontSize * 0.06);

  for (const pos of positions) {
    const centerX = pos.x + bbox.width / 2;
    const centerY = pos.y + bbox.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((options.rotation * Math.PI) / 180);
    ctx.globalAlpha = options.opacity;
    ctx.font = fontSpec;

    drawOutlinedText(ctx, options.text, 0, 0, {
      fillColor: options.color,
      strokeColor: options.outline ? options.outlineColor : undefined,
      strokeWidth: options.outline ? outlineWidth : undefined,
      textAlign: 'center',
      textBaseline: 'middle',
    });
    ctx.restore();
  }
}

/** Draws `logoImage` onto `canvas` at every position
 * `calculateWatermarkPositions` returns, scaled to `options.scale` percent
 * of the canvas's own width with the logo's aspect ratio preserved. */
export function applyImageWatermark(canvas: HTMLCanvasElement, logoImage: ImageBitmap | HTMLImageElement, options: ImageWatermarkOptions): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const drawnWidth = canvas.width * (options.scale / 100);
  const logoWidth = logoImage.width;
  const logoHeight = logoImage.height;
  if (!logoWidth || !logoHeight || drawnWidth <= 0) return;
  const drawnHeight = drawnWidth * (logoHeight / logoWidth);

  const spacing = options.placement === 'tiled' ? options.spacing : 0;
  const positions = calculateWatermarkPositions(
    { width: canvas.width, height: canvas.height },
    { width: drawnWidth, height: drawnHeight },
    options.placement,
    options.margin,
    spacing,
  );

  ctx.save();
  ctx.globalAlpha = options.opacity;
  for (const pos of positions) {
    ctx.drawImage(logoImage, pos.x, pos.y, drawnWidth, drawnHeight);
  }
  ctx.restore();
}
