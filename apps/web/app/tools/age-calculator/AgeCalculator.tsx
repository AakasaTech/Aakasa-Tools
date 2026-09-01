'use client';

import { useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { calculateCalendarDifference, countBusinessDays, daysUntilNextAnniversary, parseDateInputValue } from './utils/dateDiff';

type Mode = 'age' | 'difference';

function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

export function AgeCalculator() {
  const [mode, setMode] = useState<Mode>('age');

  const [birthDateValue, setBirthDateValue] = useState('2000-01-01');
  const [asOfDateValue, setAsOfDateValue] = useState(todayInputValue());

  const [startDateValue, setStartDateValue] = useState('2023-01-01');
  const [endDateValue, setEndDateValue] = useState(todayInputValue());

  const birthDate = parseDateInputValue(birthDateValue);
  const asOfDate = parseDateInputValue(asOfDateValue);

  const startDate = parseDateInputValue(startDateValue);
  const endDate = parseDateInputValue(endDateValue);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5">
        <Button variant={mode === 'age' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('age')}>
          Age calculator
        </Button>
        <Button variant={mode === 'difference' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('difference')}>
          Date difference
        </Button>
      </div>

      {mode === 'age' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Date of birth" value={birthDateValue} onChange={setBirthDateValue} />
            <DateField label="As of date" value={asOfDateValue} onChange={setAsOfDateValue} />
          </div>

          {!birthDate || !asOfDate ? (
            <p className="text-sm text-ink/40 dark:text-paper/40">Enter both dates above to calculate age.</p>
          ) : (
            (() => {
              const diff = calculateCalendarDifference(birthDate, asOfDate);
              const isFuture = asOfDate.getTime() < birthDate.getTime();
              const nextBirthdayDays = daysUntilNextAnniversary(birthDate, asOfDate);
              const summary = isFuture
                ? `This date of birth is after the "as of" date, so no age has elapsed yet.`
                : `As of ${asOfDateValue}, this person is ${diff.years} years, ${diff.months} months, and ${diff.days} days old.`;
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
                    <span className="text-sm text-ink dark:text-paper">{summary}</span>
                    <CopyButton value={summary} size="sm" />
                  </div>
                  {!isFuture && (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
                      <StatRow label="Total days lived" value={diff.totalDays.toLocaleString()} />
                      <StatRow label="Total weeks" value={diff.totalWeeks.toLocaleString()} />
                      <StatRow label="Total months" value={diff.totalMonths.toLocaleString()} />
                      <StatRow
                        label="Next birthday"
                        value={nextBirthdayDays === 0 ? "Today!" : `in ${nextBirthdayDays.toLocaleString()} day${nextBirthdayDays === 1 ? '' : 's'}`}
                      />
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {mode === 'difference' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Start date" value={startDateValue} onChange={setStartDateValue} />
            <DateField label="End date" value={endDateValue} onChange={setEndDateValue} />
          </div>

          {!startDate || !endDate ? (
            <p className="text-sm text-ink/40 dark:text-paper/40">Enter both dates above to calculate the difference.</p>
          ) : (
            (() => {
              const wasReversed = endDate.getTime() < startDate.getTime();
              const diff = calculateCalendarDifference(startDate, endDate);
              const businessDays = countBusinessDays(startDate, endDate);
              const summary = `${wasReversed ? endDateValue : startDateValue} to ${wasReversed ? startDateValue : endDateValue} is ${diff.years} years, ${diff.months} months, and ${diff.days} days`;
              return (
                <div className="flex flex-col gap-3">
                  {wasReversed && (
                    <p className="text-xs text-ink/50 dark:text-paper/50">
                      End date is before start date — showing the difference between them regardless of order.
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
                    <span className="text-sm text-ink dark:text-paper">{summary}</span>
                    <CopyButton value={summary} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
                    <StatRow label="Total days" value={diff.totalDays.toLocaleString()} />
                    <StatRow label="Total weeks" value={diff.totalWeeks.toLocaleString()} />
                    <StatRow label="Business days (weekdays only)" value={businessDays.toLocaleString()} />
                  </div>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    Business days counts weekdays (Mon–Fri) only — it doesn&apos;t exclude public holidays, since those vary by country and
                    region.
                  </p>
                </div>
              );
            })()
          )}
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored. Calculations use calendar dates as entered, not
        time-of-day or timezone specifics.
      </span>
    </div>
  );
}
