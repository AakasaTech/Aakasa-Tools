/**
 * Pure CSS gradient string generation from color-stop data. No color math
 * lives here — that's all in @aakasa/color-utils, imported where needed
 * (randomGradient.ts for hue-relationship picking).
 */

export interface ColorStop {
  color: string;
  /** 0-100 */
  position: number;
}

export type RadialShape = 'circle' | 'ellipse';
export type RadialSize = 'closest-side' | 'farthest-side' | 'closest-corner' | 'farthest-corner';

export interface GradientPosition {
  /** 0-100 */
  x: number;
  /** 0-100 */
  y: number;
}

export type GradientType = 'linear' | 'radial' | 'conic';

/** Every field is always present regardless of the active type — simpler
 * for the component's state and for presets to specify a full snapshot,
 * and switching type tabs preserves the other types' settings instead of
 * discarding them. */
export interface GradientConfig {
  type: GradientType;
  stops: ColorStop[];
  /** Used by linear (direction) and conic (starting angle). */
  angle: number;
  /** Used by radial. */
  shape: RadialShape;
  /** Used by radial. */
  size: RadialSize;
  /** Used by radial and conic. */
  position: GradientPosition;
}

/** Stops must be emitted in ascending position order — CSS clamps an
 * out-of-order stop up to its predecessor's position instead of rendering
 * it where declared, so an unsorted list would silently misrender. */
function formatStops(stops: ColorStop[]): string {
  return [...stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${round(stop.position)}%`)
    .join(', ');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildLinearGradient(stops: ColorStop[], angleDeg: number): string {
  return `linear-gradient(${round(angleDeg)}deg, ${formatStops(stops)})`;
}

export function buildRadialGradient(stops: ColorStop[], shape: RadialShape, size: RadialSize, position: GradientPosition): string {
  return `radial-gradient(${shape} ${size} at ${round(position.x)}% ${round(position.y)}%, ${formatStops(stops)})`;
}

export function buildConicGradient(stops: ColorStop[], angleDeg: number, position: GradientPosition): string {
  return `conic-gradient(from ${round(angleDeg)}deg at ${round(position.x)}% ${round(position.y)}%, ${formatStops(stops)})`;
}

export function buildGradientCss(config: GradientConfig): string {
  if (config.type === 'linear') return buildLinearGradient(config.stops, config.angle);
  if (config.type === 'radial') return buildRadialGradient(config.stops, config.shape, config.size, config.position);
  return buildConicGradient(config.stops, config.angle, config.position);
}

/** Tailwind's arbitrary-value syntax needs literal spaces escaped as `_`
 * inside the brackets — the format we generate has no other characters
 * that need escaping (no quotes, no literal underscores). */
export function toTailwindArbitraryClass(cssGradientValue: string): string {
  return `bg-[${cssGradientValue.replace(/\s+/g, '_')}]`;
}
