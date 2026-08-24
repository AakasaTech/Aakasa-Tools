'use client';

import { useMemo, useState } from 'react';
import { CronExpressionParser } from 'cron-parser';
import { Button, Combobox, CopyButton, type ComboboxOption } from '@aakasa/ui';
import {
  FIELD_RANGES,
  MONTH_NAMES,
  DAY_OF_WEEK_NAMES,
  buildFieldExpression,
  defaultFieldSelection,
  parseFieldExpression,
  type FieldKey,
  type FieldMode,
  type FieldSelection,
} from './utils/cronFieldHelpers';
import { describeCronExpression } from './utils/describeCron';
import { CRON_PRESETS } from './utils/cronPresets';

const FIELD_ORDER: FieldKey[] = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
const FIELD_LABELS: Record<FieldKey, string> = {
  minute: 'Minute',
  hour: 'Hour',
  dayOfMonth: 'Day of Month',
  month: 'Month',
  dayOfWeek: 'Day of Week',
};
const MODE_LABELS: Record<FieldMode, string> = {
  every: 'Every',
  specific: 'Specific value(s)',
  range: 'Range',
  step: 'Step',
};

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

function getValueLabel(fieldKey: FieldKey, value: number): string {
  if (fieldKey === 'month') return MONTH_NAMES[value - 1] ?? String(value);
  if (fieldKey === 'dayOfWeek') return DAY_OF_WEEK_NAMES[value] ?? String(value);
  return String(value);
}

const RANGE_ERROR_FIELDS: { re: RegExp; field: string }[] = [
  { re: /range 0-59/, field: 'minute' },
  { re: /range 0-23/, field: 'hour' },
  { re: /range 1-31/, field: 'day-of-month' },
  { re: /range 1-12/, field: 'month' },
  { re: /range 0-[67]/, field: 'day-of-week' },
];

function humanizeCronError(message: string): string {
  const match = RANGE_ERROR_FIELDS.find((entry) => entry.re.test(message));
  return match ? `Invalid ${match.field} value — ${message}` : `Invalid cron expression — ${message}`;
}

interface FieldSync {
  selections: Partial<Record<FieldKey, FieldSelection>>;
  customRaw: Partial<Record<FieldKey, string>>;
}

function computeFieldSync(expression: string): FieldSync {
  const selections: Partial<Record<FieldKey, FieldSelection>> = {};
  const customRaw: Partial<Record<FieldKey, string>> = {};
  const parts = expression.split(/\s+/).filter(Boolean);

  if (parts.length !== 5) {
    return { selections, customRaw };
  }

  FIELD_ORDER.forEach((key, index) => {
    const raw = parts[index]!;
    const parsed = parseFieldExpression(raw, key);
    if (parsed) {
      selections[key] = parsed;
    } else {
      customRaw[key] = raw;
    }
  });

  return { selections, customRaw };
}

export function CronBuilder() {
  const [rawInput, setRawInput] = useState('0 0 * * *');
  const [timezone, setTimezone] = useState<string>(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  const timezoneOptions = useMemo<ComboboxOption[]>(
    () => getTimezoneOptions().map((tz) => ({ value: tz, label: tz })),
    []
  );

  const trimmedExpression = rawInput.trim();
  const fieldSync = useMemo(() => computeFieldSync(trimmedExpression), [trimmedExpression]);

  const parseResult = useMemo(() => {
    if (!trimmedExpression) {
      return { valid: false, error: 'Enter a cron expression, or pick a preset below.' };
    }
    try {
      CronExpressionParser.parse(trimmedExpression, { tz: timezone, currentDate: new Date() });
      return { valid: true, error: null as string | null };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? humanizeCronError(err.message) : 'Invalid cron expression.' };
    }
  }, [trimmedExpression, timezone]);

  const description = useMemo(
    () => (parseResult.valid ? describeCronExpression(trimmedExpression) : ''),
    [parseResult.valid, trimmedExpression]
  );

  const nextRuns = useMemo<Date[]>(() => {
    if (!parseResult.valid) return [];
    try {
      return CronExpressionParser.parse(trimmedExpression, { tz: timezone, currentDate: new Date() })
        .take(8)
        .map((d) => d.toDate());
    } catch {
      return [];
    }
  }, [parseResult.valid, trimmedExpression, timezone]);

  function handleFieldChange(key: FieldKey, newSelection: FieldSelection) {
    const segments = FIELD_ORDER.map((fieldKey) => {
      if (fieldKey === key) {
        return buildFieldExpression(newSelection, fieldKey);
      }
      const customRaw = fieldSync.customRaw[fieldKey];
      if (customRaw !== undefined) {
        return customRaw;
      }
      const selection = fieldSync.selections[fieldKey] ?? defaultFieldSelection(fieldKey);
      return buildFieldExpression(selection, fieldKey);
    });
    setRawInput(segments.join(' '));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink dark:text-paper">Presets</span>
        <div className="flex flex-wrap gap-2">
          {CRON_PRESETS.map((preset) => (
            <Button key={preset.name} variant="secondary" size="sm" onClick={() => setRawInput(preset.expression)}>
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <span className="font-display text-sm font-semibold text-ink dark:text-paper">Visual builder</span>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELD_ORDER.map((key) => (
            <FieldGroup
              key={key}
              fieldKey={key}
              selection={fieldSync.selections[key] ?? defaultFieldSelection(key)}
              customRaw={fieldSync.customRaw[key]}
              onChange={(newSelection) => handleFieldChange(key, newSelection)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cron-raw-input" className="text-sm font-medium text-ink dark:text-paper">
          Raw expression
        </label>
        <div className="flex items-center gap-2">
          <input
            id="cron-raw-input"
            type="text"
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            spellCheck={false}
            placeholder="* * * * *"
            aria-label="Raw cron expression"
            className="w-full rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={rawInput} label="Copy" />
        </div>
        <span className="text-xs text-ink/50 dark:text-paper/50">
          Standard 5-field Unix cron (minute hour day-of-month month day-of-week). Nothing entered here is stored or
          transmitted — everything runs in your browser.
        </span>
      </div>

      {parseResult.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {parseResult.error}
        </p>
      )}

      {parseResult.valid && (
        <>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <span className="text-xs text-ink/50 dark:text-paper/50">Human-readable description</span>
            <p className="font-display text-base font-semibold text-ink dark:text-paper">{description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink dark:text-paper">Preview timezone</span>
                <Combobox
                  options={timezoneOptions}
                  value={timezone}
                  onChange={setTimezone}
                  ariaLabel="Preview timezone"
                  className="w-64"
                />
              </div>
            </div>
            <p className="text-xs text-ink/50 dark:text-paper/50">
              This only affects the &ldquo;next run times&rdquo; preview below. Cron expressions don&apos;t encode a
              timezone — the actual run times of a real cron job depend entirely on the timezone of the system
              running it, not on anything selected here. The expression itself never changes based on this selector.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink dark:text-paper">Next {nextRuns.length} run times</span>
            <ul className="flex flex-col gap-1 rounded-lg border border-ink/10 divide-y divide-ink/5 dark:border-paper/10 dark:divide-paper/5">
              {nextRuns.map((date, index) => (
                <li key={index} className="px-3 py-2 font-mono text-sm text-ink dark:text-paper">
                  {date.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                    timeZone: timezone,
                  })}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

interface FieldGroupProps {
  fieldKey: FieldKey;
  selection: FieldSelection;
  customRaw: string | undefined;
  onChange: (selection: FieldSelection) => void;
}

function FieldGroup({ fieldKey, selection, customRaw, onChange }: FieldGroupProps) {
  const range = FIELD_RANGES[fieldKey];

  if (customRaw !== undefined) {
    return (
      <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink dark:text-paper">{FIELD_LABELS[fieldKey]}</span>
          <Button variant="ghost" size="sm" onClick={() => onChange(defaultFieldSelection(fieldKey))}>
            Reset
          </Button>
        </div>
        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60 dark:bg-paper/10 dark:text-paper/60">
          Custom: <span className="font-mono">{customRaw}</span>
        </span>
        <span className="text-xs text-ink/50 dark:text-paper/50">
          Too specific for these controls — edit it directly in the raw expression above. (If it&apos;s invalid,
          the error above will say so.)
        </span>
      </div>
    );
  }

  const values = Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-ink/10 p-3 dark:border-paper/10">
      <span className="text-sm font-medium text-ink dark:text-paper">{FIELD_LABELS[fieldKey]}</span>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MODE_LABELS) as FieldMode[]).map((mode) => (
          <Button
            key={mode}
            variant={selection.mode === mode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() =>
              onChange({
                ...defaultFieldSelection(fieldKey),
                ...selection,
                mode,
              })
            }
          >
            {MODE_LABELS[mode]}
          </Button>
        ))}
      </div>

      {selection.mode === 'specific' && (
        <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
          {values.map((value) => {
            const active = selection.values.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const nextValues = active
                    ? selection.values.filter((v) => v !== value)
                    : [...selection.values, value];
                  onChange({ ...selection, values: nextValues });
                }}
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  active ? 'bg-accent text-white' : 'bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-paper/10 dark:text-paper/70'
                }`}
              >
                {getValueLabel(fieldKey, value)}
              </button>
            );
          })}
        </div>
      )}

      {selection.mode === 'range' && (
        <div className="flex items-center gap-2 text-sm text-ink dark:text-paper">
          <select
            value={selection.from}
            onChange={(event) => onChange({ ...selection, from: Number(event.target.value) })}
            aria-label={`${FIELD_LABELS[fieldKey]} range start`}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm dark:border-paper/10 dark:bg-ink"
          >
            {values.map((value) => (
              <option key={value} value={value}>
                {getValueLabel(fieldKey, value)}
              </option>
            ))}
          </select>
          <span className="text-ink/50 dark:text-paper/50">to</span>
          <select
            value={selection.to}
            onChange={(event) => onChange({ ...selection, to: Number(event.target.value) })}
            aria-label={`${FIELD_LABELS[fieldKey]} range end`}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm dark:border-paper/10 dark:bg-ink"
          >
            {values.map((value) => (
              <option key={value} value={value}>
                {getValueLabel(fieldKey, value)}
              </option>
            ))}
          </select>
        </div>
      )}

      {selection.mode === 'step' && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink dark:text-paper">
          <span>Every</span>
          <input
            type="number"
            min={1}
            max={range.max - range.min + 1}
            value={selection.step}
            onChange={(event) => onChange({ ...selection, step: Math.max(1, Number(event.target.value)) })}
            aria-label={`${FIELD_LABELS[fieldKey]} step`}
            className="w-16 rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm dark:border-paper/10 dark:bg-ink"
          />
          <span>units, starting at</span>
          <select
            value={selection.from}
            onChange={(event) => onChange({ ...selection, from: Number(event.target.value) })}
            aria-label={`${FIELD_LABELS[fieldKey]} step start`}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm dark:border-paper/10 dark:bg-ink"
          >
            {values.map((value) => (
              <option key={value} value={value}>
                {getValueLabel(fieldKey, value)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
