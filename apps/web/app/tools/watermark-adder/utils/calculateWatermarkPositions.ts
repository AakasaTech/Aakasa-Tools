export type PlacementPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tiled';

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export const PLACEMENT_PRESETS: { value: PlacementPreset; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'center-left', label: 'Center left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'tiled', label: 'Tiled (repeated)' },
];

function singlePosition(canvasSize: Size, watermarkSize: Size, placement: Exclude<PlacementPreset, 'tiled'>, margin: number): Point {
  const { width: cw, height: ch } = canvasSize;
  const { width: ww, height: wh } = watermarkSize;
  const centerX = (cw - ww) / 2;
  const centerY = (ch - wh) / 2;

  switch (placement) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-center':
      return { x: centerX, y: margin };
    case 'top-right':
      return { x: cw - ww - margin, y: margin };
    case 'center-left':
      return { x: margin, y: centerY };
    case 'center':
      return { x: centerX, y: centerY };
    case 'center-right':
      return { x: cw - ww - margin, y: centerY };
    case 'bottom-left':
      return { x: margin, y: ch - wh - margin };
    case 'bottom-center':
      return { x: centerX, y: ch - wh - margin };
    case 'bottom-right':
      return { x: cw - ww - margin, y: ch - wh - margin };
  }
}

/**
 * Lays out a repeating grid of `watermarkSize`-sized tiles across the whole
 * canvas, `spacing` px apart both horizontally and vertically. The grid is
 * centered on the canvas (rather than anchored at 0,0) so that whatever
 * partial tiles get clipped at the edges are split evenly between opposite
 * edges instead of piling up on just the right/bottom side — the step
 * between every pair of adjacent tiles is identical everywhere, so there
 * are no visible gaps or overlaps anywhere in the interior of the grid.
 */
function tiledPositions(canvasSize: Size, watermarkSize: Size, spacing: number): Point[] {
  const stepX = watermarkSize.width + spacing;
  const stepY = watermarkSize.height + spacing;
  if (stepX <= 0 || stepY <= 0) return [];

  const cols = Math.ceil((canvasSize.width + spacing) / stepX) + 1;
  const rows = Math.ceil((canvasSize.height + spacing) / stepY) + 1;
  const totalWidth = cols * stepX - spacing;
  const totalHeight = rows * stepY - spacing;
  const offsetX = (canvasSize.width - totalWidth) / 2;
  const offsetY = (canvasSize.height - totalHeight) / 2;

  const positions: Point[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      positions.push({ x: offsetX + col * stepX, y: offsetY + row * stepY });
    }
  }
  return positions;
}

/**
 * Pure placement math shared by both the text and image watermark renderers
 * so a corner/edge/center/tiled position is computed identically regardless
 * of which watermark type is being drawn. Returns the top-left corner(s) at
 * which a `watermarkSize`-sized box should be drawn — a single position for
 * any of the 9-point presets, or many for `tiled`.
 */
export function calculateWatermarkPositions(
  canvasSize: Size,
  watermarkSize: Size,
  placement: PlacementPreset,
  margin = 0,
  spacing = 0,
): Point[] {
  if (placement === 'tiled') return tiledPositions(canvasSize, watermarkSize, spacing);
  return [singlePosition(canvasSize, watermarkSize, placement, margin)];
}
