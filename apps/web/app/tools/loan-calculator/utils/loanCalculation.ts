/**
 * Pure loan amortization math — no DOM, no React.
 *
 * The monthly rate used throughout is simply `annualRate / 100 / 12` — the
 * conventional simple division used by essentially every standard EMI/loan
 * amortization calculator and by lenders themselves, NOT the compounded
 * monthly-equivalent rate `(1 + annualRate/100)^(1/12) - 1`. Both are
 * mathematically legitimate in different contexts (the compounded version
 * matters for comparing effective annual yields), but loan contracts quote
 * a nominal annual rate that gets divided evenly across the 12 monthly
 * payments — that's the rate this module reproduces.
 */

export interface ScheduleEntry {
  /** 1-indexed payment number. */
  month: number;
  /** Total amount paid this month (required payment + any extra). */
  payment: number;
  principalPortion: number;
  interestPortion: number;
  extraPayment: number;
  remainingBalance: number;
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * The standard fixed-payment amortization formula:
 * M = P × [r(1+r)^n] / [(1+r)^n - 1], where r is the MONTHLY rate.
 * Falls back to a plain equal split when the rate is 0 (the formula's
 * denominator would otherwise be 0/0).
 */
export function calculateMonthlyPayment(principal: number, annualRatePercent: number, termMonths: number): number {
  if (termMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) {
    return principal / termMonths;
  }
  const factor = (1 + monthlyRate) ** termMonths;
  return (principal * (monthlyRate * factor)) / (factor - 1);
}

/**
 * Builds the month-by-month amortization schedule iteratively: each month,
 * interest accrues on the current balance, the rest of the payment (plus
 * any optional recurring extra payment) reduces principal, and the new
 * balance carries forward. The required monthly payment itself is always
 * the one that amortizes the ORIGINAL principal over the original
 * `termMonths` at zero extra — adding `extraPayment` doesn't change that
 * required amount, it just pays additional principal each month, which is
 * exactly what shortens the real payoff time and cuts total interest.
 *
 * The loop keeps `balance` at full floating-point precision throughout (only
 * rounding when writing each schedule entry) and, on whichever month the
 * remaining balance would go negative, pays off exactly that balance
 * instead of the full scheduled principal portion — so the schedule always
 * ends at an exact 0 balance rather than a small rounding residual, and a
 * sufficient extra payment naturally ends the loop early.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
  extraPayment = 0
): ScheduleEntry[] {
  if (principal <= 0 || termMonths <= 0) return [];

  const monthlyRate = annualRatePercent / 100 / 12;
  const basePayment = calculateMonthlyPayment(principal, annualRatePercent, termMonths);
  const safeExtraPayment = Math.max(0, extraPayment);

  const schedule: ScheduleEntry[] = [];
  let balance = principal;
  // Extra payments can only shorten the payoff relative to termMonths, so
  // this is a generous safety cap against an infinite loop on bad input,
  // never the expected exit condition.
  const maxIterations = termMonths;

  for (let month = 1; month <= maxIterations && balance > 0; month += 1) {
    const interestPortion = balance * monthlyRate;
    let principalPortion = basePayment - interestPortion + safeExtraPayment;
    let actualExtraPayment = safeExtraPayment;

    if (principalPortion >= balance) {
      actualExtraPayment = Math.max(0, safeExtraPayment - (principalPortion - balance));
      principalPortion = balance;
    }

    balance -= principalPortion;

    schedule.push({
      month,
      payment: roundToCents(principalPortion + interestPortion),
      principalPortion: roundToCents(principalPortion),
      interestPortion: roundToCents(interestPortion),
      extraPayment: roundToCents(actualExtraPayment),
      remainingBalance: roundToCents(Math.max(0, balance)),
    });
  }

  return schedule;
}
