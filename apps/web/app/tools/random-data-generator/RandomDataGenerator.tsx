'use client';

import { useEffect, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { FIELD_TYPE_REGISTRY, FIELD_TYPES, type FieldOptions, type FieldSchema, type FieldType } from './utils/fieldTypes';
import { generateRecords, LOCALE_OPTIONS, type Locale } from './utils/generateDataset';
import { formatAsCsv, formatAsJson, formatAsSqlInserts } from './utils/exportFormatters';

type OutputFormat = 'json' | 'csv' | 'sql';

const OUTPUT_FORMATS: { value: OutputFormat; label: string; extension: string; mime: string }[] = [
  { value: 'json', label: 'JSON', extension: 'json', mime: 'application/json' },
  { value: 'csv', label: 'CSV', extension: 'csv', mime: 'text/csv' },
  { value: 'sql', label: 'SQL INSERT statements', extension: 'sql', mime: 'text/plain' },
];

const LARGE_COUNT_WARNING_THRESHOLD = 10_000;
const PREVIEW_ROW_COUNT = 5;

let nextFieldId = 0;

function createField(type: FieldType = 'fullName'): FieldSchema {
  const definition = FIELD_TYPE_REGISTRY[type];
  return {
    id: `field-${(nextFieldId += 1)}`,
    name: type,
    type,
    options: { ...definition.defaultOptions },
  };
}

function formatOutput(format: OutputFormat, records: Record<string, unknown>[], tableName: string): string {
  if (format === 'json') return formatAsJson(records);
  if (format === 'csv') return formatAsCsv(records);
  return formatAsSqlInserts(records, tableName);
}

export function RandomDataGenerator() {
  const [fields, setFields] = useState<FieldSchema[]>(() => [createField('fullName'), createField('email')]);
  const [recordCountValue, setRecordCountValue] = useState('100');
  const [locale, setLocale] = useState<Locale>('en');
  const [seedValue, setSeedValue] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
  const [tableName, setTableName] = useState('my_table');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const recordCount = Math.max(0, Math.floor(Number(recordCountValue) || 0));
  const seed = seedValue.trim() === '' ? undefined : Number(seedValue);
  const showLargeCountWarning = recordCount > LARGE_COUNT_WARNING_THRESHOLD;

  // Generated client-side only, in an effect rather than during render:
  // faker's output is random, so computing it directly in the render body
  // would run once during SSR and again on the client's first render,
  // producing two different results and a hydration mismatch (the exact
  // failure mode this pattern avoids — SSR and the pre-hydration client
  // render both show an empty preview, then this effect fills it in).
  const [previewRecords, setPreviewRecords] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    setPreviewRecords(fields.length === 0 ? [] : generateRecords(fields, PREVIEW_ROW_COUNT, locale, seed));
  }, [fields, locale, seed]);

  function addField() {
    setFields((prev) => [...prev, createField('fullName')]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((field) => field.id !== id));
  }

  function updateField(id: string, updates: Partial<FieldSchema>) {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...updates } : field)));
  }

  function updateFieldOptions(id: string, updates: Partial<FieldOptions>) {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, options: { ...field.options, ...updates } } : field)));
  }

  function moveField(id: string, direction: -1 | 1) {
    setFields((prev) => {
      const index = prev.findIndex((field) => field.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved!);
      return next;
    });
  }

  function handleGenerate() {
    if (fields.length === 0 || recordCount === 0) {
      setOutput('');
      return;
    }
    setIsGenerating(true);
    // Deferred so React can paint the "Generating…" state first — at the
    // documented 10,000-row upper bound, generation takes well under half
    // a second, but it's still synchronous, blocking work.
    setTimeout(() => {
      const records = generateRecords(fields, recordCount, locale, seed);
      setOutput(formatOutput(outputFormat, records, tableName));
      setIsGenerating(false);
    }, 0);
  }

  const outputMeta = OUTPUT_FORMATS.find((f) => f.value === outputFormat)!;

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: outputMeta.mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-data.${outputMeta.extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-ink dark:text-paper">Fields</span>
        {fields.map((field, index) => (
          <FieldRow
            key={field.id}
            field={field}
            index={index}
            fieldCount={fields.length}
            onUpdate={(updates) => updateField(field.id, updates)}
            onUpdateOptions={(updates) => updateFieldOptions(field.id, updates)}
            onRemove={() => removeField(field.id)}
            onMove={(direction) => moveField(field.id, direction)}
          />
        ))}
        <Button variant="secondary" size="sm" onClick={addField} className="self-start">
          + Add field
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Records to generate
          <input
            type="text"
            inputMode="numeric"
            value={recordCountValue}
            onChange={(event) => setRecordCountValue(event.target.value)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Locale
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {LOCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Seed (optional)
          <input
            type="text"
            inputMode="numeric"
            value={seedValue}
            onChange={(event) => setSeedValue(event.target.value)}
            placeholder="Random"
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Output format
          <select
            value={outputFormat}
            onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {OUTPUT_FORMATS.map((f) => (
              <option key={f.value} value={f.value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {outputFormat === 'sql' && (
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Table name
          <input
            type="text"
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>
      )}

      {showLargeCountWarning && (
        <p role="alert" className="text-xs text-danger">
          Generating more than {LARGE_COUNT_WARNING_THRESHOLD.toLocaleString()} rows may be slow, both to generate and for your browser to
          render — consider a smaller count unless you specifically need this many.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">Live preview (first {PREVIEW_ROW_COUNT} rows)</span>
        <pre className="max-h-48 overflow-auto rounded-md border border-ink/10 bg-ink/5 p-3 font-mono text-xs text-ink/80 dark:border-paper/10 dark:bg-paper/5 dark:text-paper/80">
          {fields.length === 0 ? 'Add at least one field to see a preview.' : JSON.stringify(previewRecords, null, 2)}
        </pre>
      </div>

      <Button onClick={handleGenerate} disabled={fields.length === 0 || recordCount === 0 || isGenerating} className="self-start">
        {isGenerating ? 'Generating…' : `Generate ${recordCount.toLocaleString()} records`}
      </Button>

      {output && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink/50 dark:text-paper/50">Output ({outputMeta.label})</span>
            <div className="flex gap-2">
              <CopyButton value={output} size="sm" />
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                Download .{outputMeta.extension}
              </Button>
            </div>
          </div>
          <pre className="max-h-96 overflow-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper">
            {output}
          </pre>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}

function FieldRow({
  field,
  index,
  fieldCount,
  onUpdate,
  onUpdateOptions,
  onRemove,
  onMove,
}: {
  field: FieldSchema;
  index: number;
  fieldCount: number;
  onUpdate: (updates: Partial<FieldSchema>) => void;
  onUpdateOptions: (updates: Partial<FieldOptions>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const definition = FIELD_TYPE_REGISTRY[field.type];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={field.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          placeholder="Column name"
          className="min-w-0 flex-1 rounded-md border border-ink/15 bg-paper px-2 py-1.5 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
        <select
          value={field.type}
          onChange={(event) => {
            const type = event.target.value as FieldType;
            onUpdate({ type, options: { ...FIELD_TYPE_REGISTRY[type].defaultOptions } });
          }}
          className="rounded-md border border-ink/15 bg-paper px-2 py-1.5 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        >
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type} className="bg-paper text-ink dark:bg-ink dark:text-paper">
              {FIELD_TYPE_REGISTRY[type].label}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move field up">
            ↑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMove(1)} disabled={index === fieldCount - 1} aria-label="Move field down">
            ↓
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove field ${field.name}`}>
            Remove
          </Button>
        </div>
      </div>

      {definition.hasOptions && field.type === 'date' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 dark:text-paper/60">
          <select
            value={field.options.dateMode ?? 'past'}
            onChange={(event) => onUpdateOptions({ dateMode: event.target.value as 'past' | 'future' | 'range' })}
            className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            <option value="past" className="bg-paper text-ink dark:bg-ink dark:text-paper">
              Past
            </option>
            <option value="future" className="bg-paper text-ink dark:bg-ink dark:text-paper">
              Future
            </option>
            <option value="range" className="bg-paper text-ink dark:bg-ink dark:text-paper">
              Specific range
            </option>
          </select>
          {field.options.dateMode === 'range' && (
            <>
              <input
                type="date"
                value={field.options.dateFrom ?? ''}
                onChange={(event) => onUpdateOptions({ dateFrom: event.target.value })}
                className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
              <span>to</span>
              <input
                type="date"
                value={field.options.dateTo ?? ''}
                onChange={(event) => onUpdateOptions({ dateTo: event.target.value })}
                className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
            </>
          )}
        </div>
      )}

      {definition.hasOptions && (field.type === 'integer' || field.type === 'decimal') && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 dark:text-paper/60">
          <label className="flex items-center gap-1">
            Min
            <input
              type="number"
              value={field.options.min ?? 0}
              onChange={(event) => onUpdateOptions({ min: Number(event.target.value) })}
              className="w-20 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </label>
          <label className="flex items-center gap-1">
            Max
            <input
              type="number"
              value={field.options.max ?? 1000}
              onChange={(event) => onUpdateOptions({ max: Number(event.target.value) })}
              className="w-20 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </label>
          {field.type === 'decimal' && (
            <label className="flex items-center gap-1">
              Decimal places
              <input
                type="number"
                min={0}
                max={10}
                value={field.options.precision ?? 2}
                onChange={(event) => onUpdateOptions({ precision: Number(event.target.value) })}
                className="w-16 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
