/**
 * Pure SVG pattern-tile generation — no DOM, no React. Each function
 * returns the shapes for exactly ONE tile (no outer `<svg>` wrapper) plus
 * that tile's pixel size; `tileToFlatSvg`/`tileToPatternSvg` below wrap
 * that into the two SVG string forms the rest of the tool needs (a flat
 * image for live preview/CSS export, and a self-contained `<pattern>`-
 * based file for the standalone SVG download).
 *
 * The one rule every generator follows to guarantee genuinely seamless
 * tiling: draw shapes so the tile's own content is periodic with period
 * exactly (tileWidth, tileHeight) — i.e. shifting by a whole tile in x or
 * y reproduces the identical shape layout — then let anything that would
 * cross a tile edge get drawn generously past that edge and clipped by
 * the tile's own viewBox. Two adjacent tiles then reconstruct exactly
 * what an unclipped drawing would have looked like, with no seam.
 */

export interface TileSize {
  width: number;
  height: number;
}

export interface GeneratedPattern {
  /** Shapes only — no <svg> wrapper. */
  innerMarkup: string;
  tileSize: TileSize;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function tileToFlatSvg(pattern: GeneratedPattern): string {
  const { width, height } = pattern.tileSize;
  return `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${pattern.innerMarkup}</svg>`;
}

/** A self-contained file that defines the tile as a real `<pattern>`
 * element and fills its own canvas with it — so the markup itself is
 * genuinely reusable as a pattern definition if pulled into another SVG,
 * not just a flat image. */
export function tileToPatternSvg(pattern: GeneratedPattern, patternId = 'tile'): string {
  const { width, height } = pattern.tileSize;
  return `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><pattern id="${patternId}" width="${width}" height="${height}" patternUnits="userSpaceOnUse">${pattern.innerMarkup}</pattern></defs><rect width="${width}" height="${height}" fill="url(#${patternId})"/></svg>`;
}

// --- Dots ---

export interface DotsOptions {
  color: string;
  backgroundColor: string;
  radius: number;
  spacing: number;
}

export function generateDotsPattern(options: DotsOptions): GeneratedPattern {
  const { color, backgroundColor, radius, spacing } = options;
  const cx = spacing / 2;
  const cy = spacing / 2;
  const innerMarkup = [
    `<rect width="${spacing}" height="${spacing}" fill="${backgroundColor}"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`,
  ].join('');
  return { innerMarkup, tileSize: { width: spacing, height: spacing } };
}

// --- Stripes ---

export type StripeOrientation = 'horizontal' | 'vertical' | 'diagonal-right' | 'diagonal-left';

export interface StripesOptions {
  color: string;
  backgroundColor: string;
  stripeWidth: number;
  orientation: StripeOrientation;
}

/**
 * Orientation is a fixed set of angles (0°/90°/±45°) rather than an
 * arbitrary free angle. A truly seamless tile needs the stripe angle's
 * tangent to divide evenly into the tile grid — true for these four
 * angles with a simple square tile, not true in general for an arbitrary
 * angle without a much larger (or non-rectangular) tile. Offering an
 * angle that can't actually tile cleanly would be worse than not
 * offering it.
 */
export function generateStripesPattern(options: StripesOptions): GeneratedPattern {
  const { color, backgroundColor, stripeWidth, orientation } = options;
  const period = stripeWidth * 2;

  if (orientation === 'horizontal' || orientation === 'vertical') {
    const bg = `<rect width="${period}" height="${period}" fill="${backgroundColor}"/>`;
    const stripe =
      orientation === 'horizontal'
        ? `<rect x="0" y="0" width="${period}" height="${stripeWidth}" fill="${color}"/>`
        : `<rect x="0" y="0" width="${stripeWidth}" height="${period}" fill="${color}"/>`;
    return { innerMarkup: bg + stripe, tileSize: { width: period, height: period } };
  }

  // Diagonal: draw a generous field of parallel bands at 45°, wide enough
  // to fully cover a period×period tile plus margin, then let the tile's
  // own viewBox clip it — the classic "draw past the edge, clip to tile"
  // approach applied at an angle instead of axis-aligned.
  const size = period;
  const sign = orientation === 'diagonal-right' ? 1 : -1;
  const bands: string[] = [];
  // Enough bands (offset by `period` along the diagonal's normal) to
  // cover a size×size tile from well outside one edge to well past the
  // other, regardless of stripeWidth.
  const bandCount = 6;
  for (let i = -bandCount; i <= bandCount; i += 1) {
    const offset = i * period;
    const x1 = sign === 1 ? -size + offset : size * 2 - offset;
    const y1 = -size;
    const x2 = sign === 1 ? size * 2 + offset : -size - offset;
    const y2 = size * 2;
    bands.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${stripeWidth}"/>`);
  }
  const innerMarkup = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>` + bands.join('');
  return { innerMarkup, tileSize: { width: size, height: size } };
}

// --- Grid / graph paper ---

export interface GridOptions {
  color: string;
  backgroundColor: string;
  spacing: number;
  lineWidth: number;
}

export function generateGridPattern(options: GridOptions): GeneratedPattern {
  const { color, backgroundColor, spacing, lineWidth } = options;
  const half = lineWidth / 2;
  const innerMarkup = [
    `<rect width="${spacing}" height="${spacing}" fill="${backgroundColor}"/>`,
    // Each tile carries a HALF-width sliver at its top edge and a
    // half-width sliver at its bottom edge — together, two vertically
    // adjacent tiles reconstruct one full-width line centered exactly on
    // the shared edge, rather than the line simply being clipped away.
    `<rect x="0" y="${-half}" width="${spacing}" height="${lineWidth}" fill="${color}"/>`,
    `<rect x="0" y="${spacing - half}" width="${spacing}" height="${lineWidth}" fill="${color}"/>`,
    `<rect x="${-half}" y="0" width="${lineWidth}" height="${spacing}" fill="${color}"/>`,
    `<rect x="${spacing - half}" y="0" width="${lineWidth}" height="${spacing}" fill="${color}"/>`,
  ].join('');
  return { innerMarkup, tileSize: { width: spacing, height: spacing } };
}

// --- Checkerboard ---

export interface CheckerboardOptions {
  colorA: string;
  colorB: string;
  squareSize: number;
}

export function generateCheckerboardPattern(options: CheckerboardOptions): GeneratedPattern {
  const { colorA, colorB, squareSize } = options;
  const tile = squareSize * 2;
  const innerMarkup = [
    `<rect x="0" y="0" width="${squareSize}" height="${squareSize}" fill="${colorA}"/>`,
    `<rect x="${squareSize}" y="0" width="${squareSize}" height="${squareSize}" fill="${colorB}"/>`,
    `<rect x="0" y="${squareSize}" width="${squareSize}" height="${squareSize}" fill="${colorB}"/>`,
    `<rect x="${squareSize}" y="${squareSize}" width="${squareSize}" height="${squareSize}" fill="${colorA}"/>`,
  ].join('');
  return { innerMarkup, tileSize: { width: tile, height: tile } };
}

// --- Waves ---

export interface WavesOptions {
  color: string;
  backgroundColor: string;
  amplitude: number;
  wavelength: number;
  rowSpacing: number;
  strokeWidth: number;
}

/**
 * One horizontal sine-like period per tile row, built from two quadratic
 * Béziers (`M 0,y0 Q w/4,y0-A w/2,y0 Q 3w/4,y0+A w,y0`). This isn't a
 * mathematically exact sine curve, but it IS exactly periodic with period
 * `wavelength` and C1-continuous (matching position AND tangent) both at
 * its own midpoint and at the x=0/x=wavelength seam — the two properties
 * that actually matter for a seamless tile, verified by hand: the
 * incoming tangent direction at each join point (control-point-to-anchor
 * vector) is identical on both sides of every join.
 */
export function generateWavesPattern(options: WavesOptions): GeneratedPattern {
  const { color, backgroundColor, amplitude, wavelength, rowSpacing, strokeWidth } = options;
  const y0 = rowSpacing / 2;
  const w = wavelength;
  const path = `M 0,${y0} Q ${w / 4},${y0 - amplitude} ${w / 2},${y0} Q ${(3 * w) / 4},${y0 + amplitude} ${w},${y0}`;
  const innerMarkup = [
    `<rect width="${wavelength}" height="${rowSpacing}" fill="${backgroundColor}"/>`,
    `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`,
  ].join('');
  return { innerMarkup, tileSize: { width: wavelength, height: rowSpacing } };
}

// --- Triangles ---

export type TriangleDiagonal = 'tl-br' | 'tr-bl';

export interface TrianglesOptions {
  colorA: string;
  colorB: string;
  size: number;
  diagonal: TriangleDiagonal;
}

export function generateTrianglesPattern(options: TrianglesOptions): GeneratedPattern {
  const { colorA, colorB, size, diagonal } = options;
  const points =
    diagonal === 'tl-br'
      ? { a: `0,0 ${size},0 0,${size}`, b: `${size},0 ${size},${size} 0,${size}` }
      : { a: `0,0 ${size},0 ${size},${size}`, b: `0,0 ${size},${size} 0,${size}` };
  const innerMarkup = [`<polygon points="${points.a}" fill="${colorA}"/>`, `<polygon points="${points.b}" fill="${colorB}"/>`].join('');
  return { innerMarkup, tileSize: { width: size, height: size } };
}

// --- Hexagons ---

export interface HexagonsOptions {
  color: string;
  backgroundColor: string;
  size: number;
  strokeWidth: number;
}

/**
 * Flat-top hexagon grid, size `s` = center-to-corner distance. The grid's
 * own translational symmetry vectors are (3s, 0) and (0, √3·s) — the
 * standard result for this hex orientation — so that's the tile size
 * used here. Hex centers are laid out on a generous super-grid (columns
 * -1..3, rows -1..2, well past the tile's own bounds in every direction)
 * and every hexagon is drawn in full; the tile's viewBox clips whatever
 * falls outside [0,tileWidth]×[0,tileHeight]. Because the super-grid
 * already covers a full margin beyond the tile on all four sides, every
 * hex that would contribute so much as a sliver to the tile is included,
 * and adjacent tiles clip the SAME infinite hex field at the SAME
 * relative offset, so nothing is missing or duplicated at the seam.
 */
export function generateHexagonPattern(options: HexagonsOptions): GeneratedPattern {
  const { color, backgroundColor, size: s, strokeWidth } = options;
  const tileWidth = 3 * s;
  const tileHeight = Math.sqrt(3) * s;

  function hexPoints(cx: number, cy: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const angleDeg = 60 * i;
      const angleRad = (Math.PI / 180) * angleDeg;
      const x = cx + s * Math.cos(angleRad);
      const y = cy + s * Math.sin(angleRad);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }

  const hexes: string[] = [];
  for (let col = -1; col <= 3; col += 1) {
    for (let row = -1; row <= 2; row += 1) {
      const x = col * 1.5 * s;
      const colParity = ((col % 2) + 2) % 2;
      const y = row * Math.sqrt(3) * s + (colParity === 1 ? (Math.sqrt(3) / 2) * s : 0);
      const strokeAttr = strokeWidth > 0 ? ` stroke="${backgroundColor}" stroke-width="${strokeWidth}"` : '';
      hexes.push(`<polygon points="${hexPoints(x, y)}" fill="${color}"${strokeAttr}/>`);
    }
  }

  const innerMarkup = [`<rect width="${tileWidth}" height="${tileHeight}" fill="${backgroundColor}"/>`, ...hexes].join('');
  return { innerMarkup, tileSize: { width: tileWidth, height: tileHeight } };
}
