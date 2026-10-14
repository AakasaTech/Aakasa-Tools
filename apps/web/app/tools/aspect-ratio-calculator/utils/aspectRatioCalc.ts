/**
 * Pure aspect-ratio arithmetic — no React, no DOM.
 */

/** Standard Euclidean algorithm. Always returns a non-negative integer. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export interface SimplifiedRatio {
  ratioWidth: number;
  ratioHeight: number;
  decimal: number;
}

/**
 * Reduces width:height to its exact simplest integer form via GCD — a
 * genuine mathematical reduction, not a lookup against a fixed list of
 * "common" ratios, so a non-standard resolution (e.g. 2560×1600) still
 * simplifies to its true ratio (8:5) rather than being forced to the
 * nearest familiar one.
 */
export function simplifyRatio(width: number, height: number): SimplifiedRatio {
  if (width <= 0 || height <= 0) {
    return { ratioWidth: 0, ratioHeight: 0, decimal: 0 };
  }
  const divisor = gcd(width, height);
  return {
    ratioWidth: Math.round(width) / divisor,
    ratioHeight: Math.round(height) / divisor,
    decimal: width / height,
  };
}

/**
 * Given a ratio and one known dimension, computes the other so the pair
 * matches that ratio exactly, rounded to the nearest whole pixel when the
 * ratio doesn't divide evenly into the known dimension (dimensions are
 * always whole pixels in practice, so exact fractional results aren't
 * meaningful here — rounding is the sensible, stated behavior rather than
 * silently truncating or returning a non-integer).
 */
export function calculateDimensionFromRatio(
  ratioWidth: number,
  ratioHeight: number,
  knownDimension: number,
  knownIsWidth: boolean
): number {
  if (ratioWidth <= 0 || ratioHeight <= 0 || knownDimension <= 0) {
    return 0;
  }
  const result = knownIsWidth ? (knownDimension * ratioHeight) / ratioWidth : (knownDimension * ratioWidth) / ratioHeight;
  return Math.round(result);
}

const COMMON_RATIOS: { label: string; decimal: number }[] = [
  { label: '16:9', decimal: 16 / 9 },
  { label: '4:3', decimal: 4 / 3 },
  { label: '1:1', decimal: 1 },
  { label: '21:9', decimal: 21 / 9 },
  { label: '9:16', decimal: 9 / 16 },
  { label: '3:2', decimal: 3 / 2 },
  { label: '5:4', decimal: 5 / 4 },
];

export interface NearestCommonRatio {
  ratio: string;
  /** Absolute difference between the input's decimal ratio and the matched common ratio's decimal value. */
  difference: number;
}

/** Finds which well-known standard ratio (from the preset list) is numerically closest to a given decimal ratio. */
export function findNearestCommonRatio(decimal: number): NearestCommonRatio {
  let closest = COMMON_RATIOS[0]!;
  let smallestDiff = Math.abs(decimal - closest.decimal);

  for (const candidate of COMMON_RATIOS.slice(1)) {
    const diff = Math.abs(decimal - candidate.decimal);
    if (diff < smallestDiff) {
      closest = candidate;
      smallestDiff = diff;
    }
  }

  return { ratio: closest.label, difference: smallestDiff };
}
