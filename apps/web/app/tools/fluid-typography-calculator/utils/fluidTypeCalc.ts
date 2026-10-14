/**
 * Fluid typography math — pure, no DOM. Implements the standard
 * linear-interpolation-between-two-points technique documented by
 * utopia.fyi and widely used for CSS clamp()-based responsive type: the
 * font size is a straight line as a function of viewport width, pinned to
 * `minSize` at `minViewport` and `maxSize` at `maxViewport`, clamped at
 * both ends so it never goes below/above those bounds outside that range.
 *
 * All px→rem conversions assume a 16px root font size — the browser
 * default, and the standard assumption this entire technique is built on.
 * If a page sets a different root size, the vw-based portion of the
 * output still scales correctly relative to the viewport (since 1vw is a
 * viewport-relative unit, not a rem-relative one), but the rem-expressed
 * min/max bounds would then represent a different absolute pixel size
 * than intended.
 */

export const ASSUMED_ROOT_FONT_SIZE_PX = 16;

export interface ClampResult {
  css: string;
  /** The vw-multiplier's coefficient (slope of the linear function, in px per px of viewport width). */
  slope: number;
  /** The linear function's value at a (hypothetical) viewport width of 0, in px. */
  yIntercept: number;
}

function pxToRem(px: number): number {
  return px / ASSUMED_ROOT_FONT_SIZE_PX;
}

/** Rounds to `precision` decimal places and strips trailing zeros (and a trailing "."), so output stays compact. */
function formatNumber(value: number, precision = 4): string {
  const rounded = Number(value.toFixed(precision));
  return String(rounded);
}

/**
 * Computes the `clamp(MIN, PREFERRED, MAX)` CSS value that interpolates
 * linearly between `minSizePx` at `minViewportPx` and `maxSizePx` at
 * `maxViewportPx`. PREFERRED is expressed as `<rem offset> + <vw
 * coefficient>vw`, which is mathematically exact — not an approximation —
 * because 1vw always equals 1% of the current viewport width, so
 * `(slope * 100)vw` evaluates to `slope * currentViewportWidthPx` at any
 * width, matching the linear function's own `slope * VW` term exactly.
 */
export function calculateClamp(minSizePx: number, maxSizePx: number, minViewportPx: number, maxViewportPx: number): ClampResult {
  if (maxViewportPx <= minViewportPx) {
    throw new Error('maxViewportPx must be greater than minViewportPx');
  }

  const slope = (maxSizePx - minSizePx) / (maxViewportPx - minViewportPx);
  const yIntercept = minSizePx - slope * minViewportPx;

  // clamp()'s MIN/MAX arguments must satisfy MIN <= MAX; when the font
  // actually shrinks as the viewport grows (slope < 0), minSizePx and
  // maxSizePx swap which one is numerically smaller — sort them so the
  // generated clamp() stays valid CSS in both cases.
  const lowerBoundPx = Math.min(minSizePx, maxSizePx);
  const upperBoundPx = Math.max(minSizePx, maxSizePx);

  const lowerRem = formatNumber(pxToRem(lowerBoundPx));
  const upperRem = formatNumber(pxToRem(upperBoundPx));
  const yInterceptRem = pxToRem(yIntercept);
  const vwCoefficient = slope * 100;

  // Modern CSS's min()/max()/clamp() support inline addition/subtraction of
  // mixed units directly in an argument (no nested calc() needed), e.g.
  // `0.5rem + 2vw` — so the preferred value is just the two terms joined,
  // each with its own correct sign.
  const vwTerm = `${formatNumber(Math.abs(vwCoefficient))}vw`;
  const preferred =
    yInterceptRem === 0
      ? (vwCoefficient < 0 ? `-${vwTerm}` : vwTerm)
      : `${formatNumber(yInterceptRem)}rem ${vwCoefficient < 0 ? '-' : '+'} ${vwTerm}`;

  const css = `clamp(${lowerRem}rem, ${preferred}, ${upperRem}rem)`;

  return { css, slope, yIntercept };
}

/** The font size (in px) the fluid formula actually produces at a given viewport width — for the live preview slider. */
export function evaluateFluidSizePx(
  minSizePx: number,
  maxSizePx: number,
  minViewportPx: number,
  maxViewportPx: number,
  viewportPx: number
): number {
  const { slope, yIntercept } = calculateClamp(minSizePx, maxSizePx, minViewportPx, maxViewportPx);
  const preferred = yIntercept + slope * viewportPx;
  const lowerBound = Math.min(minSizePx, maxSizePx);
  const upperBound = Math.max(minSizePx, maxSizePx);
  return Math.min(Math.max(preferred, lowerBound), upperBound);
}

export interface ScaleEntry {
  name: string;
  /** Position relative to the base step (0 = base, negative = smaller, positive = larger). */
  step: number;
  minSizePx: number;
  maxSizePx: number;
  css: string;
}

export const DEFAULT_SCALE_STEP_NAMES = ['small', 'body', 'h3', 'h2', 'h1', 'display'] as const;

/**
 * Generates a full fluid type scale: each named step's min and max font
 * size is the base size multiplied by `ratio` raised to that step's
 * distance from the base step (so steps below the base shrink, steps
 * above it grow, by the same ratio applied to both viewport-width
 * endpoints) — then run through the same `calculateClamp` used for a
 * single size, so every entry in the scale is individually exact.
 */
export function generateTypeScale(
  baseMinSizePx: number,
  baseMaxSizePx: number,
  ratio: number,
  minViewportPx: number,
  maxViewportPx: number,
  stepNames: readonly string[] = DEFAULT_SCALE_STEP_NAMES,
  baseStepIndex = 1
): ScaleEntry[] {
  return stepNames.map((name, index) => {
    const step = index - baseStepIndex;
    const factor = Math.pow(ratio, step);
    const minSizePx = baseMinSizePx * factor;
    const maxSizePx = baseMaxSizePx * factor;
    const { css } = calculateClamp(minSizePx, maxSizePx, minViewportPx, maxViewportPx);
    return { name, step, minSizePx, maxSizePx, css };
  });
}
