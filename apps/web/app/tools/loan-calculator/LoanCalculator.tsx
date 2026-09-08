'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { calculateMonthlyPayment, generateAmortizationSchedule } from './utils/loanCalculation';
import { LoanChart } from './LoanChart';

type TermUnit = 'years' | 'months';

function parseInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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

function monthsToYearsText(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${months} mo`;
  if (remainder === 0) return `${years} yr`;
  return `${years} yr ${remainder} mo`;
}

export function LoanCalculator() {
  const [principalValue, setPrincipalValue] = useState('200000');
  const [rateValue, setRateValue] = useState('5');
  const [termValue, setTermValue] = useState('30');
  const [termUnit, setTermUnit] = useState<TermUnit>('years');

  const [includeExtraPayment, setIncludeExtraPayment] = useState(false);
  const [extraPaymentValue, setExtraPaymentValue] = useState('200');

  const [showTable, setShowTable] = useState(false);

  const principal = parseInput(principalValue);
  const rate = parseInput(rateValue);
  const termRaw = parseInput(termValue);
  const termMonths = termRaw === null ? 0 : Math.round(termUnit === 'years' ? termRaw * 12 : termRaw);
  const extraPayment = includeExtraPayment ? (parseInput(extraPaymentValue) ?? 0) : 0;

  const hasValidInputs = principal !== null && principal > 0 && rate !== null && termMonths > 0;

  const monthlyPayment = hasValidInputs ? calculateMonthlyPayment(principal, rate, termMonths) : 0;

  const baseSchedule = useMemo(
    () => (hasValidInputs ? generateAmortizationSchedule(principal, rate, termMonths) : []),
    [hasValidInputs, principal, rate, termMonths]
  );

  const extraSchedule = useMemo(
    () => (hasValidInputs && extraPayment > 0 ? generateAmortizationSchedule(principal, rate, termMonths, extraPayment) : null),
    [hasValidInputs, principal, rate, termMonths, extraPayment]
  );

  const activeSchedule = extraSchedule ?? baseSchedule;
  const totalPaid = activeSchedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = activeSchedule.reduce((sum, entry) => sum + entry.interestPortion, 0);

  const baseTotalInterest = baseSchedule.reduce((sum, entry) => sum + entry.interestPortion, 0);
  const monthsSaved = extraSchedule ? baseSchedule.length - extraSchedule.length : 0;
  const interestSaved = extraSchedule ? baseTotalInterest - totalInterest : 0;

  const summaryText = hasValidInputs
    ? [
        `Loan/EMI calculation (${formatUsd(principal)} principal, ${rateValue}% annual rate, ${termValue} ${termUnit}${includeExtraPayment && extraPayment > 0 ? `, +${formatUsd(extraPayment)}/mo extra` : ''}):`,
        `Monthly payment (EMI): ${formatUsd(monthlyPayment)}`,
        `Total paid: ${formatUsd(totalPaid)}`,
        `Total interest: ${formatUsd(totalInterest)}`,
        `Payoff time: ${monthsToYearsText(activeSchedule.length)}`,
        ...(extraSchedule
          ? [`Extra payments save: ${formatUsd(interestSaved)} interest, ${monthsToYearsText(monthsSaved)} sooner`]
          : []),
      ].join('\n')
    : '';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Loan principal ($)" value={principalValue} onChange={setPrincipalValue} />
        <NumberField label="Annual interest rate (%)" value={rateValue} onChange={setRateValue} />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <NumberField label="Loan term" value={termValue} onChange={setTermValue} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/70 dark:text-paper/70">Term unit</span>
          <div className="flex gap-1.5">
            <Button variant={termUnit === 'years' ? 'primary' : 'secondary'} size="sm" onClick={() => setTermUnit('years')}>
              Years
            </Button>
            <Button variant={termUnit === 'months' ? 'primary' : 'secondary'} size="sm" onClick={() => setTermUnit('months')}>
              Months
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Checkbox
          label="Add a recurring extra monthly payment"
          checked={includeExtraPayment}
          onChange={(event) => setIncludeExtraPayment(event.target.checked)}
        />
        {includeExtraPayment && (
          <div className="w-48">
            <NumberField label="Extra payment ($/month)" value={extraPaymentValue} onChange={setExtraPaymentValue} />
          </div>
        )}
      </div>

      <div className="rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-3 text-xs text-ink/70 dark:border-paper/10 dark:text-paper/70">
        This computes payments purely from the numbers you enter — it isn&apos;t a loan offer, pre-approval, or quote from any lender. It
        doesn&apos;t reflect any specific lender&apos;s actual rates, fees, insurance, or approval criteria.
      </div>

      {!hasValidInputs ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter a loan principal, interest rate, and a term greater than zero to see results.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Monthly payment (EMI)" value={formatUsd(monthlyPayment)} />
            <StatCard label="Total paid over term" value={formatUsd(totalPaid)} />
            <StatCard label="Total interest paid" value={formatUsd(totalInterest)} />
          </div>

          {extraSchedule && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-ink dark:text-paper">
              With an extra {formatUsd(extraPayment)}/month, the loan is paid off in{' '}
              <strong>{monthsToYearsText(extraSchedule.length)}</strong> instead of{' '}
              <strong>{monthsToYearsText(baseSchedule.length)}</strong> — saving{' '}
              <strong>{monthsToYearsText(monthsSaved)}</strong> and <strong>{formatUsd(interestSaved)}</strong> in interest.
            </div>
          )}

          <div className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <pre className="whitespace-pre-wrap font-sans text-xs text-ink/70 dark:text-paper/70">{summaryText}</pre>
            <CopyButton value={summaryText} size="sm" />
          </div>

          <LoanChart schedule={activeSchedule} />

          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowTable((v) => !v)}>
              {showTable ? 'Hide' : 'Show'} amortization schedule
            </Button>
            {showTable && (
              <div className="max-h-96 overflow-auto rounded-lg border border-ink/10 dark:border-paper/10">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="sticky top-0 border-b border-ink/10 bg-paper text-ink/60 dark:border-paper/10 dark:bg-ink dark:text-paper/60">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Principal</th>
                      <th className="px-3 py-2 font-medium">Interest</th>
                      <th className="px-3 py-2 font-medium">Remaining balance</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {activeSchedule.map((entry) => (
                      <tr key={entry.month} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                        <td className="px-3 py-2 text-ink dark:text-paper">{entry.month}</td>
                        <td className="px-3 py-2 text-ink/70 dark:text-paper/70">{formatUsd(entry.principalPortion)}</td>
                        <td className="px-3 py-2 text-ink/70 dark:text-paper/70">{formatUsd(entry.interestPortion)}</td>
                        <td className="px-3 py-2 text-ink dark:text-paper">{formatUsd(entry.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
