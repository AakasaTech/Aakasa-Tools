'use client';

import { useMemo, useRef, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { addTax, extractTax } from './utils/taxCalculation';

type Mode = 'add' | 'extract';

interface LineItem {
  id: number;
  description: string;
  amountValue: string;
}

const RATE_PRESETS = [5, 7, 8.5, 10, 15, 20];

function parseInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink/60 dark:text-paper/60">{label}</span>
      <span className="font-mono text-ink dark:text-paper">{value}</span>
    </div>
  );
}

export function TaxCalculator() {
  const [mode, setMode] = useState<Mode>('add');
  const [rateValue, setRateValue] = useState('10');
  const [items, setItems] = useState<LineItem[]>([{ id: 0, description: '', amountValue: '100' }]);
  const nextId = useRef(1);

  const rate = parseInput(rateValue);

  function updateItem(id: number, patch: Partial<Omit<LineItem, 'id'>>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: nextId.current++, description: '', amountValue: '' }]);
  }

  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  const amountLabel = mode === 'add' ? 'Pre-tax price' : 'Tax-inclusive total';

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (parseInput(item.amountValue) ?? 0), 0),
    [items]
  );
  const hasAnyAmount = items.some((item) => parseInput(item.amountValue) !== null);
  const hasValidInputs = rate !== null && hasAnyAmount;

  const addResult = hasValidInputs ? addTax(subtotal, rate) : null;
  const extractResult = hasValidInputs ? extractTax(subtotal, rate) : null;

  const summaryText = hasValidInputs
    ? mode === 'add'
      ? [
          `Add tax (${rateValue}% on ${formatUsd(subtotal)} pre-tax):`,
          `Pre-tax subtotal: ${formatUsd(subtotal)}`,
          `Tax: ${formatUsd(addResult!.tax)}`,
          `Total: ${formatUsd(addResult!.total)}`,
        ].join('\n')
      : [
          `Extract tax (${rateValue}% out of ${formatUsd(subtotal)} total):`,
          `Tax-inclusive total: ${formatUsd(subtotal)}`,
          `Pre-tax price: ${formatUsd(extractResult!.preTaxPrice)}`,
          `Tax: ${formatUsd(extractResult!.tax)}`,
        ].join('\n')
    : '';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        <Button variant={mode === 'add' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('add')}>
          Add tax to a price
        </Button>
        <Button variant={mode === 'extract' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('extract')}>
          Extract tax from a total
        </Button>
      </div>

      <p className="text-xs text-ink/50 dark:text-paper/50">
        {mode === 'add'
          ? "For a price that doesn't yet include tax — enter the pre-tax amount and this adds tax on top."
          : "For an amount that already includes tax (e.g. a receipt total) — this backs out what the price was before tax, and how much of the total was tax."}
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-ink/70 dark:text-paper/70">Tax rate (%)</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={rateValue}
            onChange={(event) => setRateValue(event.target.value)}
            spellCheck={false}
            placeholder="0"
            className="h-9 w-28 rounded-md border border-ink/15 bg-paper px-3 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          <div className="flex flex-wrap gap-1.5">
            {RATE_PRESETS.map((preset) => (
              <Button key={preset} variant="ghost" size="sm" onClick={() => setRateValue(String(preset))}>
                {preset}%
              </Button>
            ))}
          </div>
        </div>
        <span className="text-xs text-ink/40 dark:text-paper/40">
          Round-number shortcuts to fill the field quickly — not a suggestion of your actual rate. You&apos;ll need to know or look up
          the rate that applies to you; this tool doesn&apos;t know it for you.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink/70 dark:text-paper/70">Items</span>
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={item.description}
              onChange={(event) => updateItem(item.id, { description: event.target.value })}
              placeholder="Description (optional)"
              className="h-9 min-w-[10rem] flex-1 rounded-md border border-ink/15 bg-paper px-3 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
            <input
              type="text"
              inputMode="decimal"
              value={item.amountValue}
              onChange={(event) => updateItem(item.id, { amountValue: event.target.value })}
              placeholder="0.00"
              aria-label={amountLabel}
              className="h-9 w-32 rounded-md border border-ink/15 bg-paper px-3 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} disabled={items.length <= 1} aria-label="Remove item">
              ✕
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addItem} className="self-start">
          + Add item
        </Button>
        <span className="text-xs text-ink/40 dark:text-paper/40">Each item&apos;s amount is a &quot;{amountLabel.toLowerCase()}.&quot;</span>
      </div>

      {!hasValidInputs ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter a tax rate and at least one amount to see results.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-4 text-sm text-ink dark:border-paper/10 dark:text-paper">
            <pre className="whitespace-pre-wrap font-sans text-sm">{summaryText}</pre>
            <CopyButton value={summaryText} size="sm" />
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            {mode === 'add' && addResult ? (
              <>
                <StatRow label="Pre-tax subtotal" value={formatUsd(subtotal)} />
                <StatRow label="Tax" value={formatUsd(addResult.tax)} />
                <StatRow label="Total" value={formatUsd(addResult.total)} />
              </>
            ) : (
              extractResult && (
                <>
                  <StatRow label="Tax-inclusive total" value={formatUsd(subtotal)} />
                  <StatRow label="Pre-tax price" value={formatUsd(extractResult.preTaxPrice)} />
                  <StatRow label="Tax" value={formatUsd(extractResult.tax)} />
                </>
              )
            )}
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored. It&apos;s a calculator, not tax advice —
        consult a tax professional or your relevant tax authority for your actual obligations.
      </span>
    </div>
  );
}
