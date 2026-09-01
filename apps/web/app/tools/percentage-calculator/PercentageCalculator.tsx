'use client';

import { useState, type ReactNode } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  addPercentage,
  percentOf,
  percentageChange,
  percentageDifference,
  reversePercentage,
  subtractPercentage,
  whatPercent,
} from './utils/percentageMath';

type Mode = 'percentOf' | 'whatPercent' | 'change' | 'difference' | 'addSubtract' | 'reverse';

const MODE_LABELS: Record<Mode, string> = {
  percentOf: 'X% of Y',
  whatPercent: 'X is what % of Y',
  change: 'Percentage change',
  difference: 'Percentage difference',
  addSubtract: 'Add/subtract a %',
  reverse: 'Reverse percentage',
};

function parseInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 4 });
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

function ResultCard({ children, copyValue, tint = 'default' }: { children: ReactNode; copyValue: string | null; tint?: 'default' | 'success' | 'info' }) {
  const tintClass =
    tint === 'success'
      ? 'border-l-success bg-success/5'
      : tint === 'info'
        ? 'border-l-accent bg-accent/5'
        : 'border-l-accent bg-accent/5';
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border-y border-r border-l-2 border-ink/10 p-4 text-sm text-ink dark:border-paper/10 dark:text-paper ${tintClass}`}>
      <span>{children}</span>
      {copyValue !== null && <CopyButton value={copyValue} size="sm" />}
    </div>
  );
}

const EMPTY_STATE = <p className="text-sm text-ink/40 dark:text-paper/40">Enter both values above to see the result.</p>;

export function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>('percentOf');

  // X% of Y
  const [percentOfPercent, setPercentOfPercent] = useState('15');
  const [percentOfBase, setPercentOfBase] = useState('200');

  // X is what % of Y
  const [whatPercentPart, setWhatPercentPart] = useState('50');
  const [whatPercentWhole, setWhatPercentWhole] = useState('200');

  // Percentage change
  const [changeOriginal, setChangeOriginal] = useState('80');
  const [changeNew, setChangeNew] = useState('100');

  // Percentage difference
  const [diffA, setDiffA] = useState('80');
  const [diffB, setDiffB] = useState('100');

  // Add/subtract
  const [asBase, setAsBase] = useState('150');
  const [asPercent, setAsPercent] = useState('20');
  const [asOperation, setAsOperation] = useState<'add' | 'subtract'>('add');

  // Reverse percentage
  const [revFinal, setRevFinal] = useState('80');
  const [revPercent, setRevPercent] = useState('20');
  const [revWasIncrease, setRevWasIncrease] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
          <Button key={m} variant={mode === m ? 'primary' : 'secondary'} size="sm" onClick={() => setMode(m)}>
            {MODE_LABELS[m]}
          </Button>
        ))}
      </div>

      {mode === 'percentOf' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Percentage (%)" value={percentOfPercent} onChange={setPercentOfPercent} />
            <NumberField label="Of number" value={percentOfBase} onChange={setPercentOfBase} />
          </div>
          {(() => {
            const percent = parseInput(percentOfPercent);
            const base = parseInput(percentOfBase);
            if (percent === null || base === null) return EMPTY_STATE;
            const result = percentOf(percent, base);
            return (
              <ResultCard copyValue={formatNumber(result)}>
                <span className="font-mono">{formatNumber(percent)}%</span> of <span className="font-mono">{formatNumber(base)}</span> is{' '}
                <span className="font-mono font-semibold">{formatNumber(result)}</span>
              </ResultCard>
            );
          })()}
        </div>
      )}

      {mode === 'whatPercent' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="This number" value={whatPercentPart} onChange={setWhatPercentPart} />
            <NumberField label="Is what % of this number" value={whatPercentWhole} onChange={setWhatPercentWhole} />
          </div>
          {(() => {
            const part = parseInput(whatPercentPart);
            const whole = parseInput(whatPercentWhole);
            if (part === null || whole === null || whole === 0) return EMPTY_STATE;
            const result = whatPercent(part, whole);
            return (
              <ResultCard copyValue={formatNumber(result)}>
                <span className="font-mono">{formatNumber(part)}</span> is <span className="font-mono font-semibold">{formatNumber(result)}%</span> of{' '}
                <span className="font-mono">{formatNumber(whole)}</span>
              </ResultCard>
            );
          })()}
        </div>
      )}

      {mode === 'change' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ink/50 dark:text-paper/50">
            Tracks a before/after change relative to the original value — not the same as &ldquo;percentage difference&rdquo;, which compares two
            values with neither treated as the starting point.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Original value" value={changeOriginal} onChange={setChangeOriginal} />
            <NumberField label="New value" value={changeNew} onChange={setChangeNew} />
          </div>
          {(() => {
            const original = parseInput(changeOriginal);
            const newValue = parseInput(changeNew);
            if (original === null || newValue === null || original === 0) return EMPTY_STATE;
            const result = percentageChange(original, newValue);
            const isIncrease = result >= 0;
            return (
              <ResultCard copyValue={formatNumber(result)} tint={isIncrease ? 'success' : 'info'}>
                From <span className="font-mono">{formatNumber(original)}</span> to <span className="font-mono">{formatNumber(newValue)}</span> is a{' '}
                <span className="font-mono font-semibold">
                  {isIncrease ? '+' : '−'}
                  {formatNumber(Math.abs(result))}%
                </span>{' '}
                {isIncrease ? 'increase' : 'decrease'}
              </ResultCard>
            );
          })()}
        </div>
      )}

      {mode === 'difference' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ink/50 dark:text-paper/50">
            Compares two values symmetrically — swapping them gives the same result. Use this for comparing two measurements, not for a
            before/after change (that&apos;s &ldquo;percentage change&rdquo;).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Value A" value={diffA} onChange={setDiffA} />
            <NumberField label="Value B" value={diffB} onChange={setDiffB} />
          </div>
          {(() => {
            const a = parseInput(diffA);
            const b = parseInput(diffB);
            if (a === null || b === null || a + b === 0) return EMPTY_STATE;
            const result = percentageDifference(a, b);
            return (
              <ResultCard copyValue={formatNumber(result)}>
                <span className="font-mono">{formatNumber(a)}</span> and <span className="font-mono">{formatNumber(b)}</span> differ by{' '}
                <span className="font-mono font-semibold">{formatNumber(result)}%</span>
              </ResultCard>
            );
          })()}
        </div>
      )}

      {mode === 'addSubtract' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Base value" value={asBase} onChange={setAsBase} />
            <NumberField label="Percentage (%)" value={asPercent} onChange={setAsPercent} />
          </div>
          <div className="flex gap-1.5">
            <Button variant={asOperation === 'add' ? 'primary' : 'secondary'} size="sm" onClick={() => setAsOperation('add')}>
              Increase by
            </Button>
            <Button variant={asOperation === 'subtract' ? 'primary' : 'secondary'} size="sm" onClick={() => setAsOperation('subtract')}>
              Decrease by
            </Button>
          </div>
          {(() => {
            const base = parseInput(asBase);
            const percent = parseInput(asPercent);
            if (base === null || percent === null) return EMPTY_STATE;
            const result = asOperation === 'add' ? addPercentage(base, percent) : subtractPercentage(base, percent);
            return (
              <ResultCard copyValue={formatNumber(result)}>
                <span className="font-mono">{formatNumber(base)}</span> {asOperation === 'add' ? 'increased' : 'decreased'} by{' '}
                <span className="font-mono">{formatNumber(percent)}%</span> is <span className="font-mono font-semibold">{formatNumber(result)}</span>
              </ResultCard>
            );
          })()}
        </div>
      )}

      {mode === 'reverse' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ink/50 dark:text-paper/50">Solves backward — e.g. &ldquo;this price is $80 after a 20% discount, what was the original price?&rdquo;</p>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Final value" value={revFinal} onChange={setRevFinal} />
            <NumberField label="Percentage applied (%)" value={revPercent} onChange={setRevPercent} />
          </div>
          <div className="flex gap-1.5">
            <Button variant={!revWasIncrease ? 'primary' : 'secondary'} size="sm" onClick={() => setRevWasIncrease(false)}>
              …from a decrease
            </Button>
            <Button variant={revWasIncrease ? 'primary' : 'secondary'} size="sm" onClick={() => setRevWasIncrease(true)}>
              …from an increase
            </Button>
          </div>
          {(() => {
            const finalValue = parseInput(revFinal);
            const percent = parseInput(revPercent);
            if (finalValue === null || percent === null) return EMPTY_STATE;
            const factor = revWasIncrease ? 1 + percent / 100 : 1 - percent / 100;
            if (factor === 0) return EMPTY_STATE;
            const result = reversePercentage(finalValue, percent, revWasIncrease);
            return (
              <ResultCard copyValue={formatNumber(result)}>
                If <span className="font-mono">{formatNumber(finalValue)}</span> is the result of a{' '}
                <span className="font-mono">{formatNumber(percent)}%</span> {revWasIncrease ? 'increase' : 'decrease'}, the original value was{' '}
                <span className="font-mono font-semibold">{formatNumber(result)}</span>
              </ResultCard>
            );
          })()}
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
