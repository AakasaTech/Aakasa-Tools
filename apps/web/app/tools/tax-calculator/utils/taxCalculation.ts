/**
 * Pure sales tax / VAT / GST arithmetic — no DOM, no React, and no
 * jurisdiction-specific rates baked in anywhere. The rate is always a
 * number the caller supplies; this module only does the math on it.
 */

export interface AddTaxResult {
  tax: number;
  total: number;
}

export interface ExtractTaxResult {
  preTaxPrice: number;
  tax: number;
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Given a pre-tax price, adds tax at `ratePercent`. */
export function addTax(preTaxPrice: number, ratePercent: number): AddTaxResult {
  const tax = roundToCents(preTaxPrice * (ratePercent / 100));
  const total = roundToCents(preTaxPrice + tax);
  return { tax, total };
}

/**
 * Given a tax-INCLUSIVE total, backs out the pre-tax price and the tax
 * portion. The pre-tax price is `totalAmount / (1 + ratePercent / 100)` —
 * NOT `totalAmount - totalAmount * ratePercent / 100`, which is the
 * common but incorrect shortcut (it subtracts the rate as a percentage of
 * the wrong base — the tax-inclusive total instead of the pre-tax price —
 * and always undershoots). e.g. a $107.50 total at 7.5% correctly extracts
 * to a $100.00 pre-tax price ($107.50 / 1.075), not the $99.44 the naive
 * subtraction would give ($107.50 - $107.50 × 0.075).
 */
export function extractTax(totalAmount: number, ratePercent: number): ExtractTaxResult {
  const preTaxPrice = roundToCents(totalAmount / (1 + ratePercent / 100));
  const tax = roundToCents(totalAmount - preTaxPrice);
  return { preTaxPrice, tax };
}
