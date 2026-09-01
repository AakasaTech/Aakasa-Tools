export type RadiusUnit = 'px' | '%';

export interface CornerRadius {
  /** Horizontal radius. */
  h: number;
  /** Vertical radius — only meaningful when elliptical mode is on. */
  v: number;
}

export interface CornerValues {
  unit: RadiusUnit;
  topLeft: CornerRadius;
  topRight: CornerRadius;
  bottomRight: CornerRadius;
  bottomLeft: CornerRadius;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formats a border-radius value. The plain 4-value form
 * (`top-left top-right bottom-right bottom-left`) covers simple uniform
 * corners. The elliptical 8-value form adds a second, independent
 * vertical-radius set after a `/` — `horizontal-radii / vertical-radii`,
 * each in the same top-left/top-right/bottom-right/bottom-left order —
 * which is what lets a single corner curve more in one direction than the
 * other. That second form is what makes the organic "blob" shapes in this
 * tool's Blob tab possible; plain border-radius can only produce
 * circular-arc corners.
 */
export function buildBorderRadiusCss(corners: CornerValues, elliptical: boolean): string {
  const { unit } = corners;
  const order = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];

  const horizontal = order.map((corner) => `${round(corner.h)}${unit}`).join(' ');
  if (!elliptical) return horizontal;

  const vertical = order.map((corner) => `${round(corner.v)}${unit}`).join(' ');
  return `${horizontal} / ${vertical}`;
}
