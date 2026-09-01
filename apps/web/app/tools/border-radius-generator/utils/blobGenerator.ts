import type { CornerValues } from './borderRadiusCss';

const BASE = 50;
/** Absolute safe bounds regardless of complexity — corners never get close
 * enough to 0% (a sharp spike) or 100% (the two adjacent corners fully
 * merging into a flat point) to read as broken rather than organic. Fully
 * independent 0-100% values per corner were tried first and consistently
 * produced spiky or nearly-rectangular results; keeping every value
 * anchored near the 50% midpoint and only varying the spread is what
 * actually reads as a smooth, organic blob. */
const MIN_BOUND = 20;
const MAX_BOUND = 80;

function randomOffset(range: number): number {
  return (Math.random() * 2 - 1) * range;
}

function clampToSafeRange(value: number): number {
  return Math.min(MAX_BOUND, Math.max(MIN_BOUND, value));
}

/**
 * Generates a random-but-bounded set of elliptical corner percentages for
 * an organic blob shape. `complexity` (0-100) controls how far values are
 * allowed to spread from the 50% midpoint — low complexity stays close to
 * a gently rounded, near-uniform shape, high complexity allows much more
 * pronounced, wavy asymmetry — while every value still stays clamped to
 * the safe 20-80% range regardless of complexity, so even a max-complexity
 * blob never degenerates into a spiky or broken-looking shape.
 */
export function generateRandomBlob(complexity: number): CornerValues {
  const clampedComplexity = Math.min(100, Math.max(0, complexity));
  const range = 10 + (clampedComplexity / 100) * 30; // 10 at complexity 0, up to 40 at complexity 100

  function randomValue(): number {
    return clampToSafeRange(BASE + randomOffset(range));
  }

  return {
    unit: '%',
    topLeft: { h: randomValue(), v: randomValue() },
    topRight: { h: randomValue(), v: randomValue() },
    bottomRight: { h: randomValue(), v: randomValue() },
    bottomLeft: { h: randomValue(), v: randomValue() },
  };
}
