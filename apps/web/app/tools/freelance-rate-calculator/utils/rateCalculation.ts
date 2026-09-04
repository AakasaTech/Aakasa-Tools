export interface RequiredRateResult {
  requiredRevenue: number;
  billableHoursPerYear: number;
  hourlyRate: number;
}

export interface ProjectRateExample {
  hours: number;
  rate: number;
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Works backward from a target take-home income to a required hourly rate.
 *
 * The tax gross-up step is the easy-to-get-backwards part: required revenue
 * is `(targetIncome + annualExpenses) / (1 - taxRate)`, NOT
 * `targetIncome + annualExpenses + targetIncome * taxRate`. The latter only
 * grosses up the target-income portion for tax and leaves the expense
 * portion untaxed, which under-covers the real obligation once you're
 * bringing in enough revenue to cover both. This formula instead applies
 * the flat tax rate to the whole combined figure — algebraically,
 * `requiredRevenue * (1 - taxRate) - annualExpenses === targetIncome`
 * exactly, so after paying tax on total revenue and then covering
 * expenses out of what's left, the target income is what remains.
 *
 * `taxRatePercent` is a single flat rate the user supplies for their own
 * estimate — this deliberately does not attempt real tax-bracket math,
 * which varies by jurisdiction and is out of scope for this tool.
 */
export function calculateRequiredRate(
  targetIncome: number,
  annualExpenses: number,
  taxRatePercent: number,
  weeksPerYear: number,
  hoursPerWeek: number,
  billablePercent: number,
): RequiredRateResult {
  const taxRate = taxRatePercent / 100;
  const requiredRevenue = (targetIncome + annualExpenses) / (1 - taxRate);
  const billableHoursPerYear = weeksPerYear * hoursPerWeek * (billablePercent / 100);
  const hourlyRate = billableHoursPerYear > 0 ? requiredRevenue / billableHoursPerYear : 0;

  return {
    requiredRevenue: roundToCents(requiredRevenue),
    billableHoursPerYear: roundToCents(billableHoursPerYear),
    hourlyRate: roundToCents(hourlyRate),
  };
}

/** Reference project-rate figures at a given hourly rate — practical
 * anchors for quoting fixed-price work (e.g. "what would a 40-hour
 * project cost at this rate?"). */
export function projectRateExamples(hourlyRate: number, hours: number[]): ProjectRateExample[] {
  return hours.map((h) => ({ hours: h, rate: roundToCents(hourlyRate * h) }));
}
