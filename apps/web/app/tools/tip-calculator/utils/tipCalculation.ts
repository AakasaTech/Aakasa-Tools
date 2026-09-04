export interface TipResult {
  tipAmount: number;
  totalAmount: number;
}

export interface SplitResult {
  /** One entry per person, in cents-exact currency units. Summing every
   * entry always equals the original `amount` passed in — see
   * `calculateSplit` for how the leftover cent(s) are distributed. */
  amounts: number[];
}

export interface SplitGroup {
  amount: number;
  count: number;
}

/** Rounds a currency amount to 2 decimal places, avoiding binary
 * floating-point artifacts like `19.99 * 0.18 → 3.5982000000000003`. */
export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Computes the tip amount from a bill and a tip percent (e.g. 18 for 18%). */
export function calculateTip(billAmount: number, tipPercent: number): TipResult {
  const tipAmount = roundToCents(billAmount * (tipPercent / 100));
  const totalAmount = roundToCents(billAmount + tipAmount);
  return { tipAmount, totalAmount };
}

/**
 * Splits `amount` evenly across `numberOfPeople`, working in whole cents so
 * the shares sum back EXACTLY to `amount` — a naive `amount / people`
 * rounded per-person can land short (e.g. $10.00 / 3 = $3.33 × 3 = $9.99,
 * one cent short of the real total). The base share is `amount` in cents
 * divided by `people`, floored; the leftover cent(s) from that division
 * (at most `people - 1` of them) are then handed out one each to the first
 * few people, so most people pay the base share and a few pay one cent
 * more — and the sum is exact by construction, not by rounding luck.
 */
export function calculateSplit(amount: number, numberOfPeople: number): SplitResult {
  const people = Math.max(1, Math.floor(numberOfPeople));
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / people);
  const remainderCents = totalCents - baseCents * people;

  const amounts: number[] = [];
  for (let i = 0; i < people; i += 1) {
    const cents = baseCents + (i < remainderCents ? 1 : 0);
    amounts.push(cents / 100);
  }
  return { amounts };
}

/** Groups a `calculateSplit` result's per-person amounts into distinct
 * (amount, count) pairs for display — in practice at most two groups,
 * since amounts differ from each other by exactly one cent. */
export function groupSplitAmounts(amounts: number[]): SplitGroup[] {
  const groups = new Map<number, number>();
  for (const amount of amounts) {
    groups.set(amount, (groups.get(amount) ?? 0) + 1);
  }
  return [...groups.entries()]
    .map(([amount, count]) => ({ amount, count }))
    .sort((a, b) => b.amount - a.amount);
}

/** Rounds a per-person amount up to the nearest whole currency unit (e.g.
 * $13.43 -> $14.00) — a common real-world practice for splitting a bill
 * without dealing in odd cents. Returns both the rounded figure and the
 * surplus it adds over the exact amount. The tiny epsilon subtraction
 * guards against a `perPersonAmount` that's already a whole number but
 * lands a hair above it due to floating-point summation (e.g.
 * `14.000000000000002`), which would otherwise round up to 15. */
export function roundUpPerPerson(perPersonAmount: number): { rounded: number; surplus: number } {
  const rounded = Math.ceil(perPersonAmount - 1e-9);
  // `|| 0` normalizes a `-0` result (exact whole-number input) to `0` so it
  // never renders as "-$0.00".
  const surplus = roundToCents(rounded - perPersonAmount) || 0;
  return { rounded, surplus };
}
