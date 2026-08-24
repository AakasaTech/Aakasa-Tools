'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Combobox, CopyButton, type ComboboxOption } from '@aakasa/ui';
import {
  dateToTimestamp,
  detectTimestampUnit,
  formatInTimezone,
  getRelativeTimeDescription,
  timestampToDate,
  zonedTimeToUtc,
  type DateComponents,
  type TimestampUnit,
} from './utils/timestampConvert';

const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function getTimezoneOptions(): string[] {
  const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof supportedValuesOf === 'function') {
    try {
      return supportedValuesOf('timeZone');
    } catch {
      // fall through to the fallback list below
    }
  }
  return FALLBACK_TIMEZONES;
}

function parseDatetimeLocalValue(value: string): DateComponents | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: s ? Number(s) : 0,
  };
}

const inputClasses =
  'w-full rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">{label}</span>
        <span className="break-all font-mono text-sm text-ink dark:text-paper">{value}</span>
      </div>
      <CopyButton value={value} size="sm" />
    </div>
  );
}

export function TimestampConverter() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timezoneOptions = useMemo<ComboboxOption[]>(
    () => getTimezoneOptions().map((tz) => ({ value: tz, label: tz })),
    []
  );
  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);

  const [extraTimezone, setExtraTimezone] = useState(browserTimezone);

  // Timestamp -> Date
  const [tsInput, setTsInput] = useState('');
  const [unitOverride, setUnitOverride] = useState<'auto' | TimestampUnit>('auto');
  const tsValue = tsInput.trim() === '' ? null : Number(tsInput);
  const tsValid = tsValue !== null && Number.isFinite(tsValue);
  const detectedUnit = tsValid ? detectTimestampUnit(tsValue) : 'seconds';
  const effectiveUnit = unitOverride === 'auto' ? detectedUnit : unitOverride;
  const tsDate = tsValid ? timestampToDate(tsValue, effectiveUnit) : null;

  // Date -> Timestamp
  const [dtInput, setDtInput] = useState('');
  const [dtContext, setDtContext] = useState<'utc' | 'local' | 'specific'>('local');
  const [dtSpecificTimezone, setDtSpecificTimezone] = useState(browserTimezone);
  const dtComponents = parseDatetimeLocalValue(dtInput);
  const dtResolvedTimezone = dtContext === 'utc' ? 'UTC' : dtContext === 'local' ? browserTimezone : dtSpecificTimezone;
  const dtDate = dtComponents ? zonedTimeToUtc(dtComponents, dtResolvedTimezone) : null;
  const dtTimestamps = dtDate ? dateToTimestamp(dtDate) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Current Unix timestamp (seconds)</span>
          <span className="font-mono text-lg font-semibold text-ink dark:text-paper">
            {now ? Math.floor(now.getTime() / 1000) : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 sm:text-right">
          <span className="text-xs text-ink/50 dark:text-paper/50">Right now</span>
          <span className="font-mono text-sm text-ink dark:text-paper">
            {now ? formatInTimezone(now, browserTimezone, 'locale') : '—'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <span className="font-display text-sm font-semibold text-ink dark:text-paper">Timestamp &rarr; Date</span>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ts-input" className="text-sm font-medium text-ink dark:text-paper">
            Unix timestamp
          </label>
          <input
            id="ts-input"
            type="text"
            inputMode="numeric"
            value={tsInput}
            onChange={(event) => setTsInput(event.target.value)}
            placeholder="e.g. 1735689600 or 1735689600000"
            spellCheck={false}
            className={inputClasses}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink/50 dark:text-paper/50">Interpreting as:</span>
            <Button variant={unitOverride === 'auto' ? 'primary' : 'secondary'} size="sm" onClick={() => setUnitOverride('auto')}>
              Auto ({detectedUnit})
            </Button>
            <Button variant={unitOverride === 'seconds' ? 'primary' : 'secondary'} size="sm" onClick={() => setUnitOverride('seconds')}>
              Seconds
            </Button>
            <Button variant={unitOverride === 'milliseconds' ? 'primary' : 'secondary'} size="sm" onClick={() => setUnitOverride('milliseconds')}>
              Milliseconds
            </Button>
          </div>
        </div>

        {tsInput.trim() !== '' && !tsValid && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            Enter a valid number.
          </p>
        )}

        {tsDate && (
          <div className="flex flex-col gap-3">
            {now && (
              <span className="w-fit rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/70 dark:bg-paper/10 dark:text-paper/70">
                {getRelativeTimeDescription(tsDate, now)}
              </span>
            )}

            <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
              <span className="text-xs font-medium text-ink/60 dark:text-paper/60">UTC</span>
              <OutputRow label="ISO 8601" value={formatInTimezone(tsDate, 'UTC', 'iso')} />
              <OutputRow label="RFC 2822" value={formatInTimezone(tsDate, 'UTC', 'rfc2822')} />
              <OutputRow label="Readable" value={formatInTimezone(tsDate, 'UTC', 'locale')} />
            </div>

            <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
              <span className="text-xs font-medium text-ink/60 dark:text-paper/60">Your local timezone ({browserTimezone})</span>
              <OutputRow label="ISO 8601" value={formatInTimezone(tsDate, browserTimezone, 'iso')} />
              <OutputRow label="RFC 2822" value={formatInTimezone(tsDate, browserTimezone, 'rfc2822')} />
              <OutputRow label="Readable" value={formatInTimezone(tsDate, browserTimezone, 'locale')} />
            </div>

            <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink/60 dark:text-paper/60">Specific timezone</span>
                <Combobox
                  options={timezoneOptions}
                  value={extraTimezone}
                  onChange={setExtraTimezone}
                  ariaLabel="Additional timezone for Timestamp to Date output"
                  className="w-56"
                />
              </div>
              <OutputRow label="ISO 8601" value={formatInTimezone(tsDate, extraTimezone, 'iso')} />
              <OutputRow label="RFC 2822" value={formatInTimezone(tsDate, extraTimezone, 'rfc2822')} />
              <OutputRow label="Readable" value={formatInTimezone(tsDate, extraTimezone, 'locale')} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <span className="font-display text-sm font-semibold text-ink dark:text-paper">Date &rarr; Timestamp</span>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dt-input" className="text-sm font-medium text-ink dark:text-paper">
            Date &amp; time
          </label>
          <input
            id="dt-input"
            type="datetime-local"
            step={1}
            value={dtInput}
            onChange={(event) => setDtInput(event.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Interpret the entered date &amp; time as:</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={dtContext === 'local' ? 'primary' : 'secondary'} size="sm" onClick={() => setDtContext('local')}>
              Your local timezone
            </Button>
            <Button variant={dtContext === 'utc' ? 'primary' : 'secondary'} size="sm" onClick={() => setDtContext('utc')}>
              UTC
            </Button>
            <Button variant={dtContext === 'specific' ? 'primary' : 'secondary'} size="sm" onClick={() => setDtContext('specific')}>
              Specific timezone
            </Button>
            {dtContext === 'specific' && (
              <Combobox
                options={timezoneOptions}
                value={dtSpecificTimezone}
                onChange={setDtSpecificTimezone}
                ariaLabel="Timezone to interpret the entered date and time as"
                className="w-56"
              />
            )}
          </div>
        </div>

        {dtInput && !dtComponents && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            Enter a complete date and time.
          </p>
        )}

        {dtDate && dtTimestamps && (
          <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
            <OutputRow label="Seconds" value={String(dtTimestamps.seconds)} />
            <OutputRow label="Milliseconds" value={String(dtTimestamps.milliseconds)} />
            {now && (
              <span className="w-fit rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/70 dark:bg-paper/10 dark:text-paper/70">
                {getRelativeTimeDescription(dtDate, now)}
              </span>
            )}
          </div>
        )}
      </div>

      <FormatReference />

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing entered here is stored or transmitted — every conversion happens entirely in your browser.
      </span>
    </div>
  );
}

function FormatReference() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink/10 dark:border-paper/10">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 p-3 text-left"
      >
        <span className="font-display text-sm font-semibold text-ink dark:text-paper">Format reference</span>
        <span className="text-ink/40 dark:text-paper/40">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-ink/10 p-3 text-sm text-ink/70 dark:border-paper/10 dark:text-paper/70">
          <div>
            <span className="font-mono text-xs text-ink dark:text-paper">Unix epoch</span>
            <p>The number of seconds (or milliseconds) since January 1, 1970, 00:00:00 UTC. No timezone, no formatting — just a count.</p>
          </div>
          <div>
            <span className="font-mono text-xs text-ink dark:text-paper">ISO 8601</span>
            <p>The international standard date format: YYYY-MM-DDTHH:mm:ss±HH:mm (or with a trailing Z for UTC). Sortable as plain text, unambiguous, widely used in APIs and databases.</p>
          </div>
          <div>
            <span className="font-mono text-xs text-ink dark:text-paper">RFC 2822</span>
            <p>The format used in email headers and some older HTTP contexts, e.g. &ldquo;Mon, 24 Aug 2026 09:00:00 +0000&rdquo;.</p>
          </div>
        </div>
      )}
    </div>
  );
}
