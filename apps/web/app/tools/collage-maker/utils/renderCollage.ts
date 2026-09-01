import type { CellRect, CollageTemplate } from './collageTemplates';

export interface CropOffset {
  x: number;
  y: number;
}

export interface PhotoAssignment {
  cellIndex: number;
  image: HTMLImageElement;
  cropOffset: CropOffset;
  /** >= 1. 1 = the photo exactly covers the cell (no room to pan); higher zooms in further, creating pan room. */
  zoom: number;
}

export interface RenderOptions {
  gap: number;
  borderColor: string;
  cornerRadius: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes the exact position/size to draw `image` at so it covers a
 * `cell`-sized area (cropped, never stretched) with the user's pan/zoom
 * applied. `zoom` scales up from the minimum "cover" scale; `cropOffset`
 * (each axis clamped to [-1, 1]) selects where within the resulting slack
 * — the extra width/height beyond the cell once scaled — the visible
 * window sits, 0 being centered. This is the single source of truth for
 * where a photo lands within its cell: both the interactive on-screen
 * cell (for drag-to-pan) and the final flattened export call this same
 * function, so they can never disagree with each other.
 */
export function computeDrawRect(cell: PixelRect, image: HTMLImageElement, cropOffset: CropOffset, zoom: number): PixelRect {
  const naturalWidth = image.naturalWidth || 1;
  const naturalHeight = image.naturalHeight || 1;
  const coverScale = Math.max(cell.width / naturalWidth, cell.height / naturalHeight);
  const scale = coverScale * Math.max(1, zoom);

  const drawWidth = naturalWidth * scale;
  const drawHeight = naturalHeight * scale;
  const slackX = Math.max(0, drawWidth - cell.width);
  const slackY = Math.max(0, drawHeight - cell.height);

  const offsetX = Math.max(-1, Math.min(1, cropOffset.x));
  const offsetY = Math.max(-1, Math.min(1, cropOffset.y));

  return {
    x: cell.x - slackX / 2 - offsetX * (slackX / 2),
    y: cell.y - slackY / 2 - offsetY * (slackY / 2),
    width: drawWidth,
    height: drawHeight,
  };
}

/** Converts a template's relative `cell` into pixel coordinates on a
 * `canvasWidth`×`canvasHeight` canvas, inset by half the gap on every
 * side — adjacent cells end up exactly `gap` px apart, and the outer
 * canvas edge gets a matching half-gap margin so the border color reads
 * as an intentional frame rather than an inconsistent edge case. */
export function cellToPixelRect(cell: CellRect, canvasWidth: number, canvasHeight: number, gap: number): PixelRect {
  const halfGap = gap / 2;
  return {
    x: cell.x * canvasWidth + halfGap,
    y: cell.y * canvasHeight + halfGap,
    width: cell.width * canvasWidth - gap,
    height: cell.height * canvasHeight - gap,
  };
}

function roundedRectPath(ctx: CanvasRenderingContext2D, rect: PixelRect, radius: number) {
  const r = Math.max(0, Math.min(radius, rect.width / 2, rect.height / 2));
  const { x, y, width: w, height: h } = rect;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Flattens `template` plus every assigned photo onto `canvas` (sized by
 * the caller beforehand) — the actual export path. Each cell is clipped
 * to a rounded-rect path *before* the photo is drawn, so corner rounding
 * is baked into the exported pixels themselves, not a CSS effect applied
 * only to an on-screen preview.
 */
export function renderCollageToCanvas(canvas: HTMLCanvasElement, template: CollageTemplate, photoAssignments: PhotoAssignment[], options: RenderOptions): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.borderColor;
  ctx.fillRect(0, 0, width, height);

  const byIndex = new Map(photoAssignments.map((a) => [a.cellIndex, a]));

  template.cells.forEach((relCell, index) => {
    const cellRect = cellToPixelRect(relCell, width, height, options.gap);
    if (cellRect.width <= 0 || cellRect.height <= 0) return;

    ctx.save();
    roundedRectPath(ctx, cellRect, options.cornerRadius);
    ctx.clip();

    const assignment = byIndex.get(index);
    if (assignment) {
      const drawRect = computeDrawRect(cellRect, assignment.image, assignment.cropOffset, assignment.zoom);
      ctx.drawImage(assignment.image, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
    }
    ctx.restore();
  });
}
