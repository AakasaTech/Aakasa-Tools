'use client';

import { useState } from 'react';
import { Button, CopyButton, Checkbox, Slider } from '@aakasa/ui';
import { CURRENCIES, formatCurrency } from '../invoice-generator/utils/currencies';
import { calculateSplit, calculateTip, groupSplitAmounts, roundToCents, roundUpPerPerson } from './utils/tipCalculation';

type TipMode = 'percent' | 'amount';

const TIP_PRESETS = [10, 15, 18, 20, 25];

function parseInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink/60 dark:text-paper/60">{label}</span>
      <span className="font-mono text-ink dark:text-paper">{value}</span>
    </div>
  );
}

export function TipCalculator() {
  const [currency, setCurrency] = useState('USD');
  const [billValue, setBillValue] = useState('100');

  const [tipMode, setTipMode] = useState<TipMode>('percent');
  const [tipPercent, setTipPercent] = useState(18);
  const [customTipValue, setCustomTipValue] = useState('15');

  const [peopleValue, setPeopleValue] = useState('1');
  const [roundUp, setRoundUp] = useState(false);

  const bill = parseInput(billValue);
  const customTip = parseInput(customTipValue);
  const people = Math.max(1, Math.floor(parseInput(peopleValue) ?? 1));
  const isSplitting = people > 1;

  const fmt = (value: number) => formatCurrency(value, currency);

  if (bill === null) {
    return (
      <div className="flex flex-col gap-5">
        <NumberField label="Bill amount" value={billValue} onChange={setBillValue} />
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter a bill amount above to calculate the tip.</p>
      </div>
    );
  }

  const tipAmount = tipMode === 'percent' ? calculateTip(bill, tipPercent).tipAmount : Math.round((customTip ?? 0) * 100) / 100;
  const totalAmount = Math.round((bill + tipAmount) * 100) / 100;

  const totalSplit = isSplitting ? calculateSplit(totalAmount, people) : null;
  const tipSplit = isSplitting ? calculateSplit(tipAmount, people) : null;
  const totalGroups = totalSplit ? groupSplitAmounts(totalSplit.amounts) : [];
  const tipGroups = tipSplit ? groupSplitAmounts(tipSplit.amounts) : [];

  const largestPerPersonTotal = totalGroups[0]?.amount ?? totalAmount;
  const roundUpResult = roundUp ? roundUpPerPerson(largestPerPersonTotal) : null;

  const summaryLines = [
    `Bill: ${fmt(bill)}`,
    `Tip: ${fmt(tipAmount)}`,
    `Total: ${fmt(totalAmount)}`,
    ...(isSplitting
      ? [
          `Split ${people} ways:`,
          ...totalGroups.map((g) => `  ${g.count}× ${fmt(g.amount)}${roundUp && g.amount === largestPerPersonTotal && roundUpResult ? ` (rounded up to ${fmt(roundUpResult.rounded)})` : ''}`),
        ]
      : []),
  ];
  const summaryText = summaryLines.join('\n');

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Bill amount" value={billValue} onChange={setBillValue} />
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Currency
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          <Button variant={tipMode === 'percent' ? 'primary' : 'secondary'} size="sm" onClick={() => setTipMode('percent')}>
            Tip by percent
          </Button>
          <Button variant={tipMode === 'amount' ? 'primary' : 'secondary'} size="sm" onClick={() => setTipMode('amount')}>
            Tip by flat amount
          </Button>
        </div>

        {tipMode === 'percent' ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {TIP_PRESETS.map((preset) => (
                <Button key={preset} variant={tipPercent === preset ? 'primary' : 'secondary'} size="sm" onClick={() => setTipPercent(preset)}>
                  {preset}%
                </Button>
              ))}
            </div>
            <Slider label="Tip percentage" min={0} max={50} value={tipPercent} onChange={setTipPercent} />
            <NumberField label="Custom tip %" value={String(tipPercent)} onChange={(v) => setTipPercent(parseInput(v) ?? 0)} />
          </div>
        ) : (
          <NumberField label="Tip amount" value={customTipValue} onChange={setCustomTipValue} />
        )}
      </div>

      <NumberField label="Number of people" value={peopleValue} onChange={setPeopleValue} />

      {isSplitting && (
        <Checkbox label="Round up per-person total to the nearest whole currency unit" checked={roundUp} onChange={(event) => setRoundUp(event.target.checked)} />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-4 text-sm text-ink dark:border-paper/10 dark:text-paper">
          <pre className="whitespace-pre-wrap font-sans text-sm">{summaryText}</pre>
          <CopyButton value={summaryText} size="sm" />
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
          <StatRow label="Tip amount" value={fmt(tipAmount)} />
          <StatRow label="Total (bill + tip)" value={fmt(totalAmount)} />
        </div>

        {isSplitting && totalSplit && tipSplit && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            {tipGroups.map((g, i) => (
              <StatRow key={`tip-${i}`} label={tipGroups.length > 1 ? `Per-person tip (${g.count} of ${people})` : 'Per-person tip'} value={fmt(g.amount)} />
            ))}
            {totalGroups.map((g, i) => (
              <StatRow key={`total-${i}`} label={totalGroups.length > 1 ? `Per-person total (${g.count} of ${people})` : 'Per-person total'} value={fmt(g.amount)} />
            ))}
            {totalGroups.length > 1 && totalGroups[1] && (
              <p className="text-xs text-ink/50 dark:text-paper/50">
                An even split doesn&apos;t always divide into whole cents — {totalGroups[1].count} of {people} people pay one cent less than the
                rest, so the per-person totals reconcile exactly to {fmt(totalAmount)} rather than being a cent off.
              </p>
            )}
          </div>
        )}

        {isSplitting && roundUp && roundUpResult && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <StatRow label="Exact per-person total" value={fmt(largestPerPersonTotal)} />
            <StatRow label="Rounded-up per-person total (everyone pays this)" value={fmt(roundUpResult.rounded)} />
            <p className="text-xs text-ink/50 dark:text-paper/50">
              Rounding everyone up to {fmt(roundUpResult.rounded)} each collects {fmt(roundToCents(roundUpResult.rounded * people))} total,{' '}
              {fmt(roundToCents(roundUpResult.rounded * people - totalAmount))} more than the {fmt(totalAmount)} actually owed — this surplus
              naturally covers the tip generously and then some.
            </p>
          </div>
        )}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored. The currency selector only changes the displayed
        symbol/format, it doesn&apos;t convert between currencies.
      </span>
    </div>
  );
}
