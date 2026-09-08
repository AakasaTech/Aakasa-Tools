/**
 * Pure currency math — no fetching, no state. The rate itself (how many
 * units of the target currency one unit of the source currency buys) is
 * resolved by the caller from already-fetched rate data; this just applies
 * it.
 */
export function convertCurrency(amount: number, rate: number): number {
  return amount * rate;
}

/**
 * Given rates keyed by currency code against a common base (e.g. USD),
 * returns the direct exchange rate from `from` to `to` — how many units of
 * `to` one unit of `from` is worth. Both currencies must be present in
 * `rates`; returns null otherwise (an unrecognized code, or the base
 * currency's own key is missing, which would make every rate undefined).
 */
export function getExchangeRate(rates: Record<string, number>, from: string, to: string): number | null {
  const fromRate = rates[from];
  const toRate = rates[to];
  if (fromRate === undefined || toRate === undefined || fromRate === 0) {
    return null;
  }
  return toRate / fromRate;
}
