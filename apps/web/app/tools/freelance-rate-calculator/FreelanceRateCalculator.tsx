'use client';

import { useState } from 'react';
import { CopyButton, Slider } from '@aakasa/ui';
import { calculateRequiredRate, projectRateExamples } from './utils/rateCalculation';

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
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
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
      {hint && <span className="text-xs font-normal text-ink/50 dark:text-paper/50">{hint}</span>}
    </label>
  );
}

function BreakdownStep({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 text-sm ${isTotal ? 'font-semibold text-ink dark:text-paper' : 'text-ink/70 dark:text-paper/70'}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

const PROJECT_HOURS = [10, 40, 100];

export function FreelanceRateCalculator() {
  const [targetIncomeValue, setTargetIncomeValue] = useState('70000');
  const [expensesValue, setExpensesValue] = useState('5000');
  const [taxRateValue, setTaxRateValue] = useState('25');
  const [weeksPerYearValue, setWeeksPerYearValue] = useState('48');
  const [hoursPerWeekValue, setHoursPerWeekValue] = useState('40');
  const [billablePercent, setBillablePercent] = useState(70);

  const targetIncome = parseInput(targetIncomeValue);
  const expenses = parseInput(expensesValue);
  const taxRate = parseInput(taxRateValue);
  const weeksPerYear = parseInput(weeksPerYearValue);
  const hoursPerWeek = parseInput(hoursPerWeekValue);

  const hasValidInputs =
    targetIncome !== null &&
    expenses !== null &&
    taxRate !== null &&
    taxRate < 100 &&
    weeksPerYear !== null &&
    weeksPerYear > 0 &&
    hoursPerWeek !== null &&
    hoursPerWeek > 0;

  const result = hasValidInputs
    ? calculateRequiredRate(targetIncome, expenses, taxRate, weeksPerYear, hoursPerWeek, billablePercent)
    : null;

  const projectExamples = result ? projectRateExamples(result.hourlyRate, PROJECT_HOURS) : [];

  const grossedUpTotal = hasValidInputs ? targetIncome + expenses : 0;

  const summaryText = result
    ? [
        `Freelance rate calculation (target income ${formatUsd(targetIncome ?? 0)}, expenses ${formatUsd(expenses ?? 0)}, ${taxRateValue}% tax, ${weeksPerYearValue}wk × ${hoursPerWeekValue}hr/wk, ${billablePercent}% billable):`,
        `Required annual revenue: ${formatUsd(result.requiredRevenue)}`,
        `Required billable hours/year: ${result.billableHoursPerYear.toLocaleString()}`,
        `Required hourly rate: ${formatUsd(result.hourlyRate)}`,
      ].join('\n')
    : '';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Target annual income ($)" value={targetIncomeValue} onChange={setTargetIncomeValue} hint="What you actually want to take home" />
        <NumberField label="Annual business expenses ($)" value={expensesValue} onChange={setExpensesValue} hint="Software, equipment, insurance, etc." />
      </div>

      <NumberField
        label="Estimated tax rate (%)"
        value={taxRateValue}
        onChange={setTaxRateValue}
        hint="Your own estimate — this isn't a tax calculator and doesn't model brackets or jurisdictions"
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Weeks worked per year" value={weeksPerYearValue} onChange={setWeeksPerYearValue} hint="Accounting for vacation/time off" />
        <NumberField label="Hours worked per week" value={hoursPerWeekValue} onChange={setHoursPerWeekValue} hint="Total working time, not just billable" />
      </div>

      <div>
        <Slider label="Billable percentage" min={10} max={100} value={billablePercent} onChange={setBillablePercent} />
        <p className="mt-1.5 text-xs text-ink/50 dark:text-paper/50">
          The portion of your working hours actually billable to clients — the rest is admin, marketing, and unpaid pitching. This is commonly
          overestimated; many freelancers land somewhere around 60–80%, but be honest about your own number rather than assuming a figure.
        </p>
      </div>

      {!hasValidInputs ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">
          Enter your target income, expenses, tax rate (under 100%), and working time above to calculate your rate.
        </p>
      ) : (
        result && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-4 dark:border-paper/10">
              <span className="text-xs text-ink/60 dark:text-paper/60">Required hourly rate</span>
              <div className="font-mono text-3xl font-semibold text-ink dark:text-paper">{formatUsd(result.hourlyRate)}/hr</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
                <span className="text-xs text-ink/60 dark:text-paper/60">Required annual revenue</span>
                <span className="font-mono text-sm font-semibold text-ink dark:text-paper">{formatUsd(result.requiredRevenue)}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
                <span className="text-xs text-ink/60 dark:text-paper/60">Required billable hours/year</span>
                <span className="font-mono text-sm font-semibold text-ink dark:text-paper">{result.billableHoursPerYear.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
              <span className="text-xs font-medium text-ink/60 dark:text-paper/60">How this was calculated</span>
              <BreakdownStep label="Target income" value={formatUsd(targetIncome ?? 0)} />
              <BreakdownStep label={`+ Annual expenses (${formatUsd(expenses ?? 0)})`} value={formatUsd(grossedUpTotal)} />
              <BreakdownStep label={`÷ (1 − ${taxRateValue}% tax) → grossed up for tax`} value={formatUsd(result.requiredRevenue)} isTotal />
              <div className="my-1 border-t border-ink/10 dark:border-paper/10" />
              <BreakdownStep
                label={`${weeksPerYearValue} weeks × ${hoursPerWeekValue} hrs/wk × ${billablePercent}% billable`}
                value={`${result.billableHoursPerYear.toLocaleString()} billable hrs/yr`}
              />
              <div className="my-1 border-t border-ink/10 dark:border-paper/10" />
              <BreakdownStep label={`${formatUsd(result.requiredRevenue)} ÷ ${result.billableHoursPerYear.toLocaleString()} hrs`} value={`${formatUsd(result.hourlyRate)}/hr`} isTotal />
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
              <span className="text-xs font-medium text-ink/60 dark:text-paper/60">Reference project rates, at this hourly rate</span>
              <div className="grid grid-cols-3 gap-3">
                {projectExamples.map((example) => (
                  <div key={example.hours} className="flex flex-col gap-0.5">
                    <span className="text-xs text-ink/50 dark:text-paper/50">{example.hours}-hour project</span>
                    <span className="font-mono text-sm text-ink dark:text-paper">{formatUsd(example.rate)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
              <pre className="whitespace-pre-wrap font-sans text-xs text-ink/70 dark:text-paper/70">{summaryText}</pre>
              <CopyButton value={summaryText} size="sm" />
            </div>
          </div>
        )
      )}

      <p className="text-xs text-ink/50 dark:text-paper/50">
        This is a starting-point estimate based entirely on the numbers you enter — it doesn&apos;t know what clients in your market or industry
        actually pay, it only works out what YOU need to charge to hit YOUR income goal. It&apos;s not a market-rate recommendation or tax advice.
      </p>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>

      <p className="text-xs text-ink/40 dark:text-paper/40">
        Once you&apos;ve settled on a rate,{' '}
        <a href="https://billcraft.aakasa.dev" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          BillCraft AI
        </a>{' '}
        makes it easy to send professional invoices at that rate.
      </p>
    </div>
  );
}
