/** "X% of Y" — e.g. percentOf(15, 200) === 30. */
export function percentOf(percent: number, base: number): number {
  return (percent / 100) * base;
}

/** "X is what % of Y" — e.g. whatPercent(50, 200) === 25. */
export function whatPercent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

/** Signed percentage change relative to `original` — positive is an
 * increase, negative a decrease. e.g. percentageChange(80, 100) === 25. */
export function percentageChange(original: number, newValue: number): number {
  if (original === 0) return 0;
  return ((newValue - original) / original) * 100;
}

/** Symmetric percentage difference — unlike `percentageChange`, neither
 * value is treated as the "original"; the difference is measured against
 * the average of the two, so swapping the arguments gives the same
 * result. Always non-negative. */
export function percentageDifference(valueA: number, valueB: number): number {
  const average = (valueA + valueB) / 2;
  if (average === 0) return 0;
  return (Math.abs(valueA - valueB) / average) * 100;
}

export function addPercentage(base: number, percent: number): number {
  return base * (1 + percent / 100);
}

export function subtractPercentage(base: number, percent: number): number {
  return base * (1 - percent / 100);
}

/**
 * Solves backward: given a `finalValue` that resulted from applying an
 * increase or decrease of `percent` to some original value, recovers that
 * original value. e.g. reversePercentage(80, 20, false) === 100 — a value
 * decreased by 20% down to 80 started at 100, *not* 96 (the wrong answer
 * you'd get by naively adding 20% back onto 80, since percentages of
 * different bases aren't interchangeable that way).
 */
export function reversePercentage(finalValue: number, percent: number, wasIncrease: boolean): number {
  const factor = wasIncrease ? 1 + percent / 100 : 1 - percent / 100;
  if (factor === 0) return 0;
  return finalValue / factor;
}
