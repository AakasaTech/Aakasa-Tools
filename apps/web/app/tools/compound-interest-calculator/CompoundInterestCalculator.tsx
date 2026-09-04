'use client';

import { useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import {
  calculateCompoundGrowth,
  type CompoundingFrequency,
  type ContributionFrequency,
} from './utils/compoundInterest';
import { GrowthChart } from './GrowthChart';

const COMPOUNDING_OPTIONS: { value: CompoundingFrequency; label: string }[] = [
  { value: 'annually', label: 'Annually' },
  { value: 'semiannually', label: 'Semi-annually' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
];

function parseInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
      />
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
      <span className="text-xs text-ink/60 dark:text-paper/60">{label}</span>
      <span className="font-mono text-lg font-semibold text-ink dark:text-paper">{value}</span>
    </div>
  );
}

export function CompoundInterestCalculator() {
  const [principalValue, setPrincipalValue] = useState('10000');
  const [rateValue, setRateValue] = useState('7');
  const [yearsValue, setYearsValue] = useState('20');
  const [monthsValue, setMonthsValue] = useState('0');
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('monthly');

  const [includeContributions, setIncludeContributions] = useState(false);
  const [contributionAmountValue, setContributionAmountValue] = useState('200');
  const [contributionFrequency, setContributionFrequency] = useState<ContributionFrequency>('monthly');

  const [showTable, setShowTable] = useState(false);

  const principal = parseInput(principalValue);
  const rate = parseInput(rateValue);
  const years = parseInput(yearsValue);
  const months = parseInput(monthsValue);
  const contributionAmount = includeContributions ? (parseInput(contributionAmountValue) ?? 0) : 0;

  const totalYears = (years ?? 0) + (months ?? 0) / 12;
  const hasValidInputs = principal !== null && rate !== null && totalYears > 0;

  const result = hasValidInputs
    ? calculateCompoundGrowth(principal, rate, totalYears, compoundingFrequency, contributionAmount, contributionFrequency)
    : null;

  const summaryText = result
    ? [
        `Compound interest projection (${principalValue} principal, ${rateValue}% annual rate, ${yearsValue}y ${monthsValue}m, ${compoundingFrequency} compounding${includeContributions ? `, +${contributionAmountValue} ${contributionFrequency}` : ''}):`,
        `Final balance: ${formatUsd(result.finalBalance)}`,
        `Total contributions: ${formatUsd(result.totalContributions)}`,
        `Total interest earned: ${formatUsd(result.totalInterest)}`,
      ].join('\n')
    : '';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Initial principal ($)" value={principalValue} onChange={setPrincipalValue} />
        <NumberField label="Annual interest rate (%)" value={rateValue} onChange={setRateValue} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <NumberField label="Time period (years)" value={yearsValue} onChange={setYearsValue} />
        <NumberField label="+ months" value={monthsValue} onChange={setMonthsValue} />
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Compounding frequency
          <select
            value={compoundingFrequency}
            onChange={(event) => setCompoundingFrequency(event.target.value as CompoundingFrequency)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {COMPOUNDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <Checkbox
          label="Add regular contributions"
          checked={includeContributions}
          onChange={(event) => setIncludeContributions(event.target.checked)}
        />
        {includeContributions && (
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Contribution amount ($)" value={contributionAmountValue} onChange={setContributionAmountValue} />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-ink/70 dark:text-paper/70">Contribution frequency</span>
              <div className="flex gap-1.5">
                <Button variant={contributionFrequency === 'monthly' ? 'primary' : 'secondary'} size="sm" onClick={() => setContributionFrequency('monthly')}>
                  Monthly
                </Button>
                <Button variant={contributionFrequency === 'annually' ? 'primary' : 'secondary'} size="sm" onClick={() => setContributionFrequency('annually')}>
                  Annually
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-3 text-xs text-ink/70 dark:border-paper/10 dark:text-paper/70">
        This is a mathematical projection based on the numbers you enter — not a prediction, promise, or guarantee of any real investment&apos;s
        performance. Actual returns vary and involve risk, and no specific rate of return is suggested or endorsed here.
      </div>

      {!hasValidInputs ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter a principal, interest rate, and a time period greater than zero to see a projection.</p>
      ) : (
        result && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Final balance (projected)" value={formatUsd(result.finalBalance)} />
              <StatCard label="Total contributions" value={formatUsd(result.totalContributions)} />
              <StatCard label="Total interest earned" value={formatUsd(result.totalInterest)} />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
              <pre className="whitespace-pre-wrap font-sans text-xs text-ink/70 dark:text-paper/70">{summaryText}</pre>
              <CopyButton value={summaryText} size="sm" />
            </div>

            <GrowthChart yearlyBreakdown={result.yearlyBreakdown} />

            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowTable((v) => !v)}>
                {showTable ? 'Hide' : 'Show'} year-by-year breakdown
              </Button>
              {showTable && (
                <div className="overflow-x-auto rounded-lg border border-ink/10 dark:border-paper/10">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead className="border-b border-ink/10 text-ink/60 dark:border-paper/10 dark:text-paper/60">
                      <tr>
                        <th className="px-3 py-2 font-medium">Year</th>
                        <th className="px-3 py-2 font-medium">Balance</th>
                        <th className="px-3 py-2 font-medium">Contributions to date</th>
                        <th className="px-3 py-2 font-medium">Interest to date</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {result.yearlyBreakdown.map((yearData) => (
                        <tr key={yearData.year} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                          <td className="px-3 py-2 text-ink dark:text-paper">{yearData.year}</td>
                          <td className="px-3 py-2 text-ink dark:text-paper">{formatUsd(yearData.balance)}</td>
                          <td className="px-3 py-2 text-ink/70 dark:text-paper/70">{formatUsd(yearData.cumulativeContributions)}</td>
                          <td className="px-3 py-2 text-ink/70 dark:text-paper/70">{formatUsd(yearData.cumulativeInterest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
