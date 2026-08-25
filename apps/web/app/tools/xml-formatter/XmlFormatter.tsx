'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  formatXml,
  getByteSize,
  minifyXml,
  parseXml,
  SAMPLE_XML,
  type XmlIndentOption,
  type XmlParseError,
} from './utils/xmlFormat';
import { XmlTreeView } from './XmlTreeView';

type ViewMode = 'raw' | 'tree';

export function XmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<XmlParseError | null>(null);
  const [validDoc, setValidDoc] = useState<Document | null>(null);
  const [indent, setIndent] = useState<XmlIndentOption>(2);
  const [viewMode, setViewMode] = useState<ViewMode>('raw');

  // Live well-formedness check as the user types — separate from the
  // explicit Format/Minify actions below, so the error message and tree
  // view stay current even before either button is pressed.
  useEffect(() => {
    if (!input.trim()) {
      setError(null);
      setValidDoc(null);
      return;
    }
    const timer = setTimeout(() => {
      const result = parseXml(input);
      setError(result.error ?? null);
      setValidDoc(result.doc);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  function handleFormat() {
    try {
      setOutput(formatXml(input, indent));
    } catch (err) {
      setOutput('');
      setError({ message: err instanceof Error ? err.message : 'Invalid XML.' });
    }
  }

  function handleMinify() {
    try {
      setOutput(minifyXml(input));
    } catch (err) {
      setOutput('');
      setError({ message: err instanceof Error ? err.message : 'Invalid XML.' });
    }
  }

  function handleIndentChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setIndent(value === 'tab' ? 'tab' : value === '4' ? 4 : 2);
  }

  function handleLoadSample() {
    setInput(SAMPLE_XML);
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setError(null);
    setValidDoc(null);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.xml';
    link.click();
    URL.revokeObjectURL(url);
  }

  const inputStats = useMemo(() => ({ chars: input.length, bytes: getByteSize(input) }), [input]);
  const outputStats = useMemo(() => ({ chars: output.length, bytes: getByteSize(output) }), [output]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleFormat} disabled={!input.trim()}>
          Format
        </Button>
        <Button variant="secondary" onClick={handleMinify} disabled={!input.trim()}>
          Minify
        </Button>

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
          <Button variant="ghost" size="sm" onClick={() => setViewMode((mode) => (mode === 'raw' ? 'tree' : 'raw'))}>
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
              {inputStats.chars.toLocaleString()} chars &middot; {inputStats.bytes.toLocaleString()} bytes
            </span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder="Paste XML here…"
            aria-label="XML input"
            aria-invalid={error !== null}
            className="h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {error.line !== undefined && error.column !== undefined ? `Line ${error.line}, column ${error.column}: ` : ''}
              {error.message}
            </p>
          )}
          {!error && input.trim() && <p className="text-xs text-success">Well-formed XML.</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Output</span>
            <span>
              {outputStats.chars.toLocaleString()} chars &middot; {outputStats.bytes.toLocaleString()} bytes
            </span>
          </div>

          {viewMode === 'raw' ? (
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              placeholder="Formatted XML will appear here…"
              aria-label="Formatted XML output"
              className="h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
          ) : (
            <div className="h-80 w-full overflow-auto rounded-md border border-ink/10 bg-paper p-3 dark:border-paper/10 dark:bg-ink">
              {validDoc ? (
                <XmlTreeView root={validDoc.documentElement} />
              ) : (
                <p className="text-sm text-ink/40 dark:text-paper/40">Well-formed XML is needed to show the tree view.</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download .xml
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
