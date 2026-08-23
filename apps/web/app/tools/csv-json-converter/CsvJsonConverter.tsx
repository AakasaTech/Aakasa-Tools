'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Papa from 'papaparse';
import { Button, CopyButton, FileDropzone, JsonTreeView } from '@aakasa/ui';
import {
  csvToJson,
  SAMPLE_CSV,
  type CsvDelimiter,
  type CsvOutputShape,
  type CsvParseOptions,
} from './utils/csvToJson';
import { jsonToCsv, SAMPLE_JSON_FOR_CSV, type JsonToCsvOptions } from './utils/jsonToCsv';
import type { ConvertWorkerRequest, ConvertWorkerResponse } from './workers/convert.worker';

type Direction = 'csv-to-json' | 'json-to-csv';
type ViewMode = 'raw' | 'tree';

// Per spec: files over 1MB, or CSVs over ~5,000 rows, move off the main
// thread. Row count is estimated cheaply (newline count) rather than fully
// parsed just to decide where to run the real parse.
const LARGE_INPUT_THRESHOLD_BYTES = 1_000_000;
const LARGE_ROW_THRESHOLD = 5000;

const DELIMITER_LABELS: Record<CsvDelimiter, string> = {
  auto: 'Auto-detect',
  ',': 'Comma (,)',
  ';': 'Semicolon (;)',
  '\t': 'Tab',
  '|': 'Pipe (|)',
};

const OUTPUT_SHAPE_LABELS: Record<CsvOutputShape, string> = {
  'array-of-objects': 'Array of objects',
  'array-of-arrays': 'Array of arrays',
  'keyed-by-column': 'Object keyed by column',
};

function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

function estimateRowCount(text: string): number {
  return (text.match(/\n/g)?.length ?? 0) + 1;
}

function useConvertWorker() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRef = useRef(new Map<number, (response: ConvertWorkerResponse) => void>());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./workers/convert.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<ConvertWorkerResponse>) => {
        const resolve = pendingRef.current.get(event.data.id);
        if (resolve) {
          resolve(event.data);
          pendingRef.current.delete(event.data.id);
        }
      };
      workerRef.current = worker;
    }
    return workerRef.current;
  }, []);

  return useCallback(
    (request: Omit<ConvertWorkerRequest, 'id'>): Promise<ConvertWorkerResponse> => {
      const worker = getWorker();
      const id = (requestIdRef.current += 1);
      return new Promise((resolve) => {
        pendingRef.current.set(id, resolve);
        worker.postMessage({ ...request, id } as ConvertWorkerRequest);
      });
    },
    [getWorker]
  );
}

export function CsvJsonConverter() {
  const [direction, setDirection] = useState<Direction>('csv-to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statsLine, setStatsLine] = useState<string | null>(null);
  const [parsedJsonValue, setParsedJsonValue] = useState<unknown>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('raw');

  // CSV -> JSON options
  const [delimiter, setDelimiter] = useState<CsvDelimiter>('auto');
  const [hasHeader, setHasHeader] = useState(true);
  const [outputShape, setOutputShape] = useState<CsvOutputShape>('array-of-objects');
  const [keyColumn, setKeyColumn] = useState('');
  const [typeInference, setTypeInference] = useState(true);

  // JSON -> CSV options
  const [arrayJoinSeparator, setArrayJoinSeparator] = useState('; ');

  const runInWorker = useConvertWorker();

  const csvOptions: CsvParseOptions = useMemo(
    () => ({ delimiter, hasHeader, outputShape, keyColumn: keyColumn || undefined, typeInference }),
    [delimiter, hasHeader, outputShape, keyColumn, typeInference]
  );
  const jsonToCsvOptions: JsonToCsvOptions = useMemo(() => ({ arrayJoinSeparator }), [arrayJoinSeparator]);

  // Cheap header preview (parses only the first line) so the "keyed by
  // column" dropdown can offer real column names without running a full
  // parse of potentially-large input on every keystroke.
  const headerOptions = useMemo(() => {
    if (direction !== 'csv-to-json' || !hasHeader || !input.trim()) {
      return [];
    }
    const firstLine = input.split(/\r?\n/, 1)[0] ?? '';
    if (!firstLine) {
      return [];
    }
    const parsed = Papa.parse<string[]>(firstLine, { delimiter: delimiter === 'auto' ? '' : delimiter });
    return parsed.data[0] ?? [];
  }, [direction, hasHeader, input, delimiter]);

  const runCsvToJson = useCallback(
    async (text: string, options: CsvParseOptions) => {
      const isLarge = getByteSize(text) > LARGE_INPUT_THRESHOLD_BYTES || estimateRowCount(text) > LARGE_ROW_THRESHOLD;
      if (isLarge) {
        const response = await runInWorker({ direction: 'csv-to-json', input: text, options });
        return response.direction === 'csv-to-json' ? response.result : csvToJson(text, options);
      }
      return csvToJson(text, options);
    },
    [runInWorker]
  );

  const runJsonToCsv = useCallback(
    async (text: string, options: JsonToCsvOptions) => {
      const isLarge = getByteSize(text) > LARGE_INPUT_THRESHOLD_BYTES;
      if (isLarge) {
        const response = await runInWorker({ direction: 'json-to-csv', input: text, options });
        return response.direction === 'json-to-csv' ? response.result : jsonToCsv(text, options);
      }
      return jsonToCsv(text, options);
    },
    [runInWorker]
  );

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setStatsLine(null);
      setParsedJsonValue(undefined);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (direction === 'csv-to-json') {
        void runCsvToJson(input, csvOptions).then((result) => {
          if (cancelled) return;
          if (result.error) {
            setError(result.error);
            setOutput('');
            setParsedJsonValue(undefined);
            setStatsLine(null);
            return;
          }
          setError(null);
          setParsedJsonValue(result.data);
          setOutput(JSON.stringify(result.data, null, 2));
          setStatsLine(
            result.stats
              ? `${result.stats.rowCount.toLocaleString()} rows · ${result.stats.columnCount.toLocaleString()} columns`
              : null
          );
        });
      } else {
        void runJsonToCsv(input, jsonToCsvOptions).then((result) => {
          if (cancelled) return;
          if (result.error) {
            setError(result.error);
            setOutput('');
            setStatsLine(null);
            return;
          }
          setError(null);
          setOutput(result.data);
          setStatsLine(
            result.stats
              ? `${result.stats.rowCount.toLocaleString()} rows · ${result.stats.columnCount.toLocaleString()} columns`
              : null
          );
        });
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input, direction, csvOptions, jsonToCsvOptions, runCsvToJson, runJsonToCsv]);

  function handleDirectionChange(next: Direction) {
    if (next === direction) return;
    setDirection(next);
    setInput('');
    setOutput('');
    setError(null);
    setStatsLine(null);
    setParsedJsonValue(undefined);
    setViewMode('raw');
  }

  function handleFileSelected(file: File) {
    void file.text().then(setInput);
  }

  function handleLoadSample() {
    setInput(direction === 'csv-to-json' ? SAMPLE_CSV : SAMPLE_JSON_FOR_CSV);
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setError(null);
    setStatsLine(null);
    setParsedJsonValue(undefined);
  }

  function handleDownload() {
    if (!output) return;
    const isJsonOutput = direction === 'csv-to-json';
    const blob = new Blob([output], { type: isJsonOutput ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isJsonOutput ? 'converted.json' : 'converted.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const inputLabel = direction === 'csv-to-json' ? 'CSV input' : 'JSON input';
  const outputLabel = direction === 'csv-to-json' ? 'JSON output' : 'CSV output';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
        <DirectionButton active={direction === 'csv-to-json'} onClick={() => handleDirectionChange('csv-to-json')}>
          CSV → JSON
        </DirectionButton>
        <DirectionButton active={direction === 'json-to-csv'} onClick={() => handleDirectionChange('json-to-csv')}>
          JSON → CSV
        </DirectionButton>
      </div>

      {direction === 'csv-to-json' ? (
        <div className="flex flex-wrap items-end gap-3">
          <OptionField label="Delimiter">
            <select
              value={delimiter}
              onChange={(event) => setDelimiter(event.target.value as CsvDelimiter)}
              className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            >
              {(Object.keys(DELIMITER_LABELS) as CsvDelimiter[]).map((value) => (
                <option key={value} value={value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                  {DELIMITER_LABELS[value]}
                </option>
              ))}
            </select>
          </OptionField>

          <OptionField label="Output shape">
            <select
              value={outputShape}
              onChange={(event) => setOutputShape(event.target.value as CsvOutputShape)}
              className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            >
              {(Object.keys(OUTPUT_SHAPE_LABELS) as CsvOutputShape[]).map((value) => (
                <option key={value} value={value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                  {OUTPUT_SHAPE_LABELS[value]}
                </option>
              ))}
            </select>
          </OptionField>

          {outputShape === 'keyed-by-column' && (
            <OptionField label="Key column">
              <select
                value={keyColumn}
                onChange={(event) => setKeyColumn(event.target.value)}
                className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              >
                <option value="" className="bg-paper text-ink dark:bg-ink dark:text-paper">
                  Choose a column…
                </option>
                {headerOptions.map((header) => (
                  <option key={header} value={header} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                    {header}
                  </option>
                ))}
              </select>
            </OptionField>
          )}

          <label className="flex h-9 items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(event) => setHasHeader(event.target.checked)}
              className="accent-accent"
            />
            First row is header
          </label>

          <div className="flex flex-col gap-0.5">
            <label className="flex h-9 items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
              <input
                type="checkbox"
                checked={typeInference}
                onChange={(event) => setTypeInference(event.target.checked)}
                className="accent-accent"
              />
              Infer types (numbers/booleans)
            </label>
            {typeInference && (
              <span className="text-xs text-ink/40 dark:text-paper/40">
                Off keeps everything a string — safer for IDs like &quot;0042&quot; that would lose leading zeros.
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <OptionField label="Array join separator">
            <input
              type="text"
              value={arrayJoinSeparator}
              onChange={(event) => setArrayJoinSeparator(event.target.value)}
              spellCheck={false}
              className="h-9 w-24 rounded-md border border-ink/10 bg-transparent px-2 font-mono text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            />
          </OptionField>
          <span className="max-w-sm text-xs text-ink/40 dark:text-paper/40">
            Nested objects become dot-notation columns (address.city). Arrays of objects use index notation
            (items.0.name). Arrays of plain values are joined into one cell with the separator above.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>{inputLabel}</span>
            <span>
              {input.length.toLocaleString()} chars · {getByteSize(input).toLocaleString()} bytes
            </span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={direction === 'csv-to-json' ? 'Paste CSV here…' : 'Paste JSON here…'}
            aria-label={inputLabel}
            aria-invalid={error !== null}
            className="h-72 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />

          <FileDropzone
            onFileSelected={handleFileSelected}
            accept={direction === 'csv-to-json' ? '.csv,text/csv' : '.json,application/json'}
            hint={
              direction === 'csv-to-json'
                ? 'A .csv file — processed entirely in your browser, never uploaded.'
                : 'A .json file — processed entirely in your browser, never uploaded.'
            }
          />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLoadSample}>
              Load sample data
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!input}>
              Clear
            </Button>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>{outputLabel}</span>
            <span>{statsLine ?? `${output.length.toLocaleString()} chars`}</span>
          </div>

          {direction === 'csv-to-json' && viewMode === 'tree' ? (
            <div className="h-72 w-full overflow-auto rounded-md border border-ink/10 bg-paper p-3 dark:border-paper/10 dark:bg-ink">
              {parsedJsonValue !== undefined ? (
                <JsonTreeView value={parsedJsonValue} />
              ) : (
                <p className="text-sm text-ink/40 dark:text-paper/40">Valid CSV is needed to show the tree view.</p>
              )}
            </div>
          ) : (
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              placeholder={direction === 'csv-to-json' ? 'JSON output will appear here…' : 'CSV output will appear here…'}
              aria-label={outputLabel}
              className="h-72 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
          )}

          <div className="flex items-center gap-2">
            {direction === 'csv-to-json' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode((mode) => (mode === 'raw' ? 'tree' : 'raw'))}
              >
                {viewMode === 'raw' ? 'Tree view' : 'Raw view'}
              </Button>
            )}
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download {direction === 'csv-to-json' ? '.json' : '.csv'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-paper text-ink shadow-sm dark:bg-ink dark:text-paper'
          : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}

function OptionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink/70 dark:text-paper/70">{label}</span>
      {children}
    </div>
  );
}
