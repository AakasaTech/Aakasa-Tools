'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { Button, CopyButton, JsonTreeView } from '@aakasa/ui';
import {
  formatJson,
  getByteSize,
  minifyJson,
  parseJson,
  SAMPLE_JSON,
  type IndentOption,
} from './utils/jsonFormat';
import type { FormatWorkerRequest, FormatWorkerResponse } from './workers/format.worker';

const LARGE_INPUT_THRESHOLD_BYTES = 500_000;

type ViewMode = 'raw' | 'tree';

interface DisplayError {
  message: string;
  line: number;
  column: number;
}

type FormatOutcome =
  | { success: true; value: unknown; result: string }
  | { success: false; error: DisplayError };

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedValue, setParsedValue] = useState<unknown>(undefined);
  const [error, setError] = useState<DisplayError | null>(null);
  const [indent, setIndent] = useState<IndentOption>(2);
  const [autoFormat, setAutoFormat] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('raw');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map<number, (response: FormatWorkerResponse) => void>());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useLayoutEffect(() => {
    if (pendingCaretRef.current !== null && textareaRef.current) {
      const pos = pendingCaretRef.current;
      textareaRef.current.selectionStart = pos;
      textareaRef.current.selectionEnd = pos;
      pendingCaretRef.current = null;
    }
  }, [input]);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./workers/format.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<FormatWorkerResponse>) => {
        const resolve = pendingRequestsRef.current.get(event.data.id);
        if (resolve) {
          resolve(event.data);
          pendingRequestsRef.current.delete(event.data.id);
        }
      };
      workerRef.current = worker;
    }
    return workerRef.current;
  }, []);

  const runInWorker = useCallback(
    (text: string, mode: 'format' | 'minify', nextIndent: IndentOption) => {
      const worker = getWorker();
      const id = (requestIdRef.current += 1);
      return new Promise<FormatWorkerResponse>((resolve) => {
        pendingRequestsRef.current.set(id, resolve);
        const request: FormatWorkerRequest = { id, input: text, mode, indent: nextIndent };
        worker.postMessage(request);
      });
    },
    [getWorker]
  );

  const runFormat = useCallback(
    async (text: string, mode: 'format' | 'minify', nextIndent: IndentOption): Promise<FormatOutcome> => {
      if (getByteSize(text) > LARGE_INPUT_THRESHOLD_BYTES) {
        const response = await runInWorker(text, mode, nextIndent);
        return response.success
          ? { success: true, value: response.value, result: response.result }
          : { success: false, error: response.error };
      }

      const parsed = parseJson(text);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            message: parsed.error.message,
            line: parsed.error.line,
            column: parsed.error.column,
          },
        };
      }

      const result = mode === 'minify' ? minifyJson(parsed.value) : formatJson(parsed.value, nextIndent);
      return { success: true, value: parsed.value, result };
    },
    [runInWorker]
  );

  const applyOutcome = useCallback(
    (outcome: FormatOutcome, forceOutput: boolean) => {
      if (!outcome.success) {
        setError(outcome.error);
        setParsedValue(undefined);
        if (forceOutput) {
          setOutput('');
        }
        return;
      }
      setError(null);
      setParsedValue(outcome.value);
      if (forceOutput || autoFormat) {
        setOutput(outcome.result);
      }
    },
    [autoFormat]
  );

  useEffect(() => {
    if (!input.trim()) {
      setError(null);
      setParsedValue(undefined);
      setOutput('');
      return;
    }

    const timer = setTimeout(() => {
      void runFormat(input, 'format', indent).then((outcome) => applyOutcome(outcome, false));
    }, 300);

    return () => clearTimeout(timer);
  }, [input, indent, runFormat, applyOutcome]);

  async function handleFormatClick() {
    const outcome = await runFormat(input, 'format', indent);
    applyOutcome(outcome, true);
  }

  async function handleMinifyClick() {
    const outcome = await runFormat(input, 'minify', indent);
    applyOutcome(outcome, true);
  }

  function handleIndentChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setIndent(value === 'tab' ? 'tab' : value === '4' ? 4 : 2);
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setParsedValue(undefined);
    setError(null);
  }

  function handleLoadSample() {
    setInput(SAMPLE_JSON);
  }

  function handleDownload() {
    if (!output) {
      return;
    }
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleTabKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab') {
      return;
    }
    event.preventDefault();
    const target = event.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    pendingCaretRef.current = selectionStart + 2;
    setInput(next);
  }

  const inputStats = useMemo(() => ({ chars: input.length, bytes: getByteSize(input) }), [input]);
  const outputStats = useMemo(() => ({ chars: output.length, bytes: getByteSize(output) }), [output]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void handleFormatClick()} disabled={!input.trim()}>
          Format
        </Button>
        <Button variant="secondary" onClick={() => void handleMinifyClick()} disabled={!input.trim()}>
          Minify
        </Button>

        <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          <input
            type="checkbox"
            checked={autoFormat}
            onChange={(event) => setAutoFormat(event.target.checked)}
            className="accent-accent"
          />
          Auto-format
        </label>

        <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Indent
          <select
            value={indent === 'tab' ? 'tab' : String(indent)}
            onChange={handleIndentChange}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode((mode) => (mode === 'raw' ? 'tree' : 'raw'))}
          >
            {viewMode === 'raw' ? 'Tree view' : 'Raw view'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLoadSample}>
            Sample
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={!input}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Input</span>
            <span>
              {inputStats.chars.toLocaleString()} chars · {inputStats.bytes.toLocaleString()} bytes
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleTabKey}
            spellCheck={false}
            placeholder="Paste JSON here…"
            aria-label="JSON input"
            aria-invalid={error !== null}
            className="h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              Line {error.line}, column {error.column}: {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Output</span>
            <span>
              {outputStats.chars.toLocaleString()} chars · {outputStats.bytes.toLocaleString()} bytes
            </span>
          </div>

          {viewMode === 'raw' ? (
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              placeholder="Formatted JSON will appear here…"
              aria-label="Formatted JSON output"
              className="h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
          ) : (
            <div className="h-80 w-full overflow-auto rounded-md border border-ink/10 bg-paper p-3 dark:border-paper/10 dark:bg-ink">
              {parsedValue !== undefined ? (
                <JsonTreeView value={parsedValue} />
              ) : (
                <p className="text-sm text-ink/40 dark:text-paper/40">
                  Valid JSON is needed to show the tree view.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download .json
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
