'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  buildQueryString,
  decodeComponent,
  decodeFullUrl,
  encodeComponent,
  encodeFullUrl,
  parseQueryString,
  type QueryPair,
} from './utils/urlEncoding';

const LOOKS_ENCODED_PATTERN = /%[0-9a-fA-F]{2}/;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

/** Groups repeated keys into an array so "copy as JSON" doesn't silently drop values the way a naive object assignment would. */
function buildQueryObject(pairs: QueryPair[]): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const { key, value } of pairs) {
    const existing = result[key];
    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
  }
  return result;
}

type Tab = 'convert' | 'parse' | 'build';
type EncodingMode = 'component' | 'full-url';
type Direction = 'encode' | 'decode';

const MODE_INFO: Record<EncodingMode, { label: string; description: string }> = {
  component: {
    label: 'Component',
    description:
      'For a single value — a query parameter, form field, or path segment. Escapes everything, including &, ?, and /.',
  },
  'full-url': {
    label: 'Full URL',
    description:
      'For an entire URL. Leaves structural characters like :, /, ?, &, and # alone so the URL stays valid.',
  },
};

const textareaClasses =
  'h-56 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

export function UrlEncoderDecoder() {
  const [tab, setTab] = useState<Tab>('convert');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={tab === 'convert' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('convert')}>
          Encode / Decode
        </Button>
        <Button variant={tab === 'parse' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('parse')}>
          Parse Query String
        </Button>
        <Button variant={tab === 'build' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('build')}>
          Build Query String
        </Button>
      </div>

      {tab === 'convert' && <ConvertTab />}
      {tab === 'parse' && <ParseTab />}
      {tab === 'build' && <BuildTab />}
    </div>
  );
}

function ConvertTab() {
  const [mode, setMode] = useState<EncodingMode>('component');
  const [direction, setDirection] = useState<Direction>('encode');
  const [input, setInput] = useState('');
  const debouncedInput = useDebouncedValue(input, 200);

  const conversion = useMemo(() => {
    if (!debouncedInput) {
      return { result: '', error: undefined as string | undefined };
    }
    if (direction === 'encode') {
      const result = mode === 'component' ? encodeComponent(debouncedInput) : encodeFullUrl(debouncedInput);
      return { result, error: undefined as string | undefined };
    }
    return mode === 'component' ? decodeComponent(debouncedInput) : decodeFullUrl(debouncedInput);
  }, [debouncedInput, mode, direction]);

  const looksEncoded = direction === 'encode' && LOOKS_ENCODED_PATTERN.test(debouncedInput);

  function handleSwap() {
    setInput(conversion.result);
    setDirection((prev) => (prev === 'encode' ? 'decode' : 'encode'));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink dark:text-paper">Mode</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(MODE_INFO) as EncodingMode[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                mode === key
                  ? 'border-accent bg-accent/5'
                  : 'border-ink/10 hover:border-accent/40 dark:border-paper/10'
              }`}
            >
              <span className="font-display text-sm font-semibold text-ink dark:text-paper">{MODE_INFO[key].label}</span>
              <span className="text-xs text-ink/60 dark:text-paper/60">{MODE_INFO[key].description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={direction === 'encode' ? 'primary' : 'secondary'} size="sm" onClick={() => setDirection('encode')}>
          Encode
        </Button>
        <Button variant={direction === 'decode' ? 'primary' : 'secondary'} size="sm" onClick={() => setDirection('decode')}>
          Decode
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSwap} disabled={!conversion.result}>
          <SwapIcon />
          Swap
        </Button>
      </div>

      {looksEncoded && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-accent/10 px-3 py-2 text-xs text-ink dark:text-paper">
          <span>This looks like it&apos;s already encoded.</span>
          <Button variant="secondary" size="sm" onClick={() => setDirection('decode')}>
            Decode instead
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Input</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={direction === 'encode' ? 'Type or paste text to encode…' : 'Paste encoded text to decode…'}
            aria-label="Input"
            className={textareaClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output</span>
          <textarea
            value={conversion.result}
            readOnly
            spellCheck={false}
            placeholder="Result will appear here…"
            aria-label="Output"
            className={textareaClasses}
          />
          {conversion.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {conversion.error}
            </p>
          )}
          <CopyButton value={conversion.result} disabled={!conversion.result} />
        </div>
      </div>
    </div>
  );
}

function ParseTab() {
  const [input, setInput] = useState('');
  const pairs = useMemo(() => parseQueryString(input), [input]);
  const jsonOutput = useMemo(() => JSON.stringify(buildQueryObject(pairs), null, 2), [pairs]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">Full URL or query string</span>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="?name=John+Doe&age=30&tags=a,b,c"
          aria-label="Query string input"
          className="h-24 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
      </div>

      {pairs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink dark:text-paper">
              {pairs.length} parameter{pairs.length === 1 ? '' : 's'}
            </span>
            <CopyButton value={jsonOutput} label="Copy as JSON" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-ink/10 dark:border-paper/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs text-ink/50 dark:border-paper/10 dark:text-paper/50">
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Decoded value</th>
                  <th className="px-3 py-2 font-medium">Encoded</th>
                  <th className="px-3 py-2 font-medium">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair, index) => (
                  <tr key={`${pair.key}-${index}`} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                    <td className="px-3 py-2 font-mono text-xs text-ink dark:text-paper">{pair.key}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink dark:text-paper">{pair.value}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink/60 dark:text-paper/60">
                      {encodeComponent(pair.value)}
                    </td>
                    <td className="px-3 py-2">
                      <CopyButton value={pair.value} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink/50 dark:text-paper/50">
          Paste a full URL or a query string above to see it broken down.
        </p>
      )}
    </div>
  );
}

interface BuilderRow {
  id: number;
  key: string;
  value: string;
}

let nextRowId = 1;

function BuildTab() {
  const [rows, setRows] = useState<BuilderRow[]>([{ id: 0, key: '', value: '' }]);
  const [includeLeadingMark, setIncludeLeadingMark] = useState(true);

  const queryString = useMemo(
    () => buildQueryString(rows.map(({ key, value }) => ({ key, value }))),
    [rows]
  );
  const output = queryString && includeLeadingMark ? `?${queryString}` : queryString;

  function updateRow(id: number, field: 'key' | 'value', text: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: text } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: (nextRowId += 1), key: '', value: '' }]);
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              type="text"
              value={row.key}
              onChange={(event) => updateRow(row.id, 'key', event.target.value)}
              placeholder="key"
              aria-label="Parameter key"
              className="w-1/3 rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
            <input
              type="text"
              value={row.value}
              onChange={(event) => updateRow(row.id, 'value', event.target.value)}
              placeholder="value"
              aria-label="Parameter value"
              className="flex-1 rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
            <Button variant="ghost" size="sm" onClick={() => removeRow(row.id)} disabled={rows.length === 1}>
              Remove
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addRow} className="self-start">
          Add pair
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/70">
        <input
          type="checkbox"
          checked={includeLeadingMark}
          onChange={(event) => setIncludeLeadingMark(event.target.checked)}
          className="h-4 w-4 rounded border-ink/20 text-accent focus:ring-accent dark:border-paper/20"
        />
        Include leading &ldquo;?&rdquo;
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">Generated query string</span>
        <div className="min-h-[2.5rem] w-full break-all rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {output || <span className="text-ink/40 dark:text-paper/40">Add at least one key to get started…</span>}
        </div>
        <CopyButton value={output} disabled={!output} />
      </div>
    </div>
  );
}
