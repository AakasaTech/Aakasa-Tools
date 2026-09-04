export type CompoundingFrequency = 'annually' | 'semiannually' | 'quarterly' | 'monthly' | 'daily';
export type ContributionFrequency = 'monthly' | 'annually';

export interface YearData {
  /** Whole for a full year (1, 2, 3...); fractional for a final partial year
   * (e.g. 10.5) when the time period doesn't divide evenly into years. */
  year: number;
  balance: number;
  contributionsThisPeriod: number;
  interestThisPeriod: number;
  cumulativeContributions: number;
  cumulativeInterest: number;
}

export interface CompoundGrowthResult {
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
  yearlyBreakdown: YearData[];
}

const COMPOUNDING_PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

const CONTRIBUTION_PERIODS_PER_YEAR: Record<ContributionFrequency, number> = {
  monthly: 12,
  annually: 1,
};

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Projects compound growth of a principal (plus optional regular
 * contributions) period by period, rather than via a closed-form formula —
 * an iterative calculation is simpler to get right and verify, and
 * performance is a non-issue at this scale (at most a few thousand periods
 * for a daily-compounding, multi-decade projection).
 *
 * Each compounding period: any contribution due that period is added FIRST
 * (an "annuity-due" convention — the contribution earns interest for the
 * same period it's deposited, matching how most real recurring-deposit
 * scenarios are modeled), then interest is applied to the resulting
 * balance. When the contribution frequency doesn't match the compounding
 * frequency (e.g. annual contributions with quarterly compounding), the
 * contribution amount is pro-rated evenly across each compounding period
 * so the correct total is still contributed every year.
 *
 * With no contribution, this reduces exactly to the standard formula
 * `A = P(1 + r/n)^(nt)` — verified against it directly (see the tool's
 * test cases). With contributions, verified against the closed-form
 * annuity-due future-value formula for a monthly-contribution/monthly-
 * compounding case.
 */
export function calculateCompoundGrowth(
  principal: number,
  annualRatePercent: number,
  years: number,
  compoundingFrequency: CompoundingFrequency,
  contributionAmount = 0,
  contributionFrequency: ContributionFrequency = 'monthly',
): CompoundGrowthResult {
  const periodsPerYear = COMPOUNDING_PERIODS_PER_YEAR[compoundingFrequency];
  const totalPeriods = Math.max(0, Math.round(years * periodsPerYear));
  const periodicRate = annualRatePercent / 100 / periodsPerYear;
  const contributionsPerYear = CONTRIBUTION_PERIODS_PER_YEAR[contributionFrequency];
  const periodicContribution = contributionAmount * (contributionsPerYear / periodsPerYear);

  let balance = principal;
  let cumulativeContributions = principal;
  let cumulativeInterest = 0;

  let yearContributions = 0;
  let yearInterest = 0;

  const yearlyBreakdown: YearData[] = [];

  for (let period = 1; period <= totalPeriods; period += 1) {
    balance += periodicContribution;
    cumulativeContributions += periodicContribution;
    yearContributions += periodicContribution;

    const interestThisPeriod = balance * periodicRate;
    balance += interestThisPeriod;
    cumulativeInterest += interestThisPeriod;
    yearInterest += interestThisPeriod;

    const isYearBoundary = period % periodsPerYear === 0;
    const isLastPeriod = period === totalPeriods;
    if (isYearBoundary || isLastPeriod) {
      yearlyBreakdown.push({
        year: roundToCents(period / periodsPerYear),
        balance: roundToCents(balance),
        contributionsThisPeriod: roundToCents(yearContributions),
        interestThisPeriod: roundToCents(yearInterest),
        cumulativeContributions: roundToCents(cumulativeContributions),
        cumulativeInterest: roundToCents(cumulativeInterest),
      });
      yearContributions = 0;
      yearInterest = 0;
    }
  }

  return {
    finalBalance: roundToCents(balance),
    totalContributions: roundToCents(cumulativeContributions),
    totalInterest: roundToCents(cumulativeInterest),
    yearlyBreakdown,
  };
}
