'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { formatUnifiedDiff, type DiffResult, type DiffRow, type DiffSegment, type Granularity } from './utils/computeDiff';
import type { DiffWorkerRequest, DiffWorkerResponse } from './utils/diff.worker';

type ViewMode = 'side-by-side' | 'unified';

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'word', label: 'Word' },
  { value: 'char', label: 'Character' },
];

const textareaClasses =
  'h-64 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

function segmentClasses(type: DiffSegment['type']): string {
  if (type === 'added') return 'rounded-sm bg-success/25';
  if (type === 'removed') return 'rounded-sm bg-danger/25 line-through decoration-danger/70';
  return '';
}

function Segments({ segments }: { segments: DiffSegment[] }) {
  if (segments.length === 0) {
    return <span className="opacity-0">&nbsp;</span>;
  }
  return (
    <>
      {segments.map((segment, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index} className={segmentClasses(segment.type)}>
          {segment.value || (index === segments.length - 1 ? ' ' : '')}
        </span>
      ))}
    </>
  );
}

function rowBackground(type: DiffRow['type'], side: 'original' | 'changed'): string {
  if (type === 'added' && side === 'changed') return 'bg-success/10';
  if (type === 'removed' && side === 'original') return 'bg-danger/10';
  return '';
}

function LineNumberCell({ value }: { value: number | null }) {
  return (
    <td className="w-10 select-none border-r border-ink/5 px-2 py-0.5 text-right text-xs text-ink/30 dark:border-paper/5 dark:text-paper/30">
      {value ?? ''}
    </td>
  );
}

function SideBySideView({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink/10 dark:border-paper/10">
      <table className="w-full border-collapse font-mono text-xs">
        <tbody>
          {rows.map((row, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={index} className="align-top">
              <LineNumberCell value={row.originalLineNumber} />
              <td className={`w-1/2 whitespace-pre-wrap break-all px-2 py-0.5 ${rowBackground(row.type, 'original')}`}>
                <Segments segments={row.originalSegments} />
              </td>
              <LineNumberCell value={row.changedLineNumber} />
              <td className={`w-1/2 whitespace-pre-wrap break-all px-2 py-0.5 ${rowBackground(row.type, 'changed')}`}>
                <Segments segments={row.changedSegments} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnifiedView({ rows }: { rows: DiffRow[] }) {
  interface UnifiedLine {
    key: string;
    prefix: string;
    originalLineNumber: number | null;
    changedLineNumber: number | null;
    segments: DiffSegment[];
    background: string;
  }

  const lines: UnifiedLine[] = [];
  rows.forEach((row, index) => {
    if (row.type === 'unchanged') {
      lines.push({
        key: `${index}-u`,
        prefix: ' ',
        originalLineNumber: row.originalLineNumber,
        changedLineNumber: row.changedLineNumber,
        segments: row.originalSegments,
        background: '',
      });
    } else if (row.type === 'added') {
      lines.push({
        key: `${index}-a`,
        prefix: '+',
        originalLineNumber: null,
        changedLineNumber: row.changedLineNumber,
        segments: row.changedSegments,
        background: 'bg-success/10',
      });
    } else if (row.type === 'removed') {
      lines.push({
        key: `${index}-r`,
        prefix: '-',
        originalLineNumber: row.originalLineNumber,
        changedLineNumber: null,
        segments: row.originalSegments,
        background: 'bg-danger/10',
      });
    } else {
      lines.push({
        key: `${index}-mr`,
        prefix: '-',
        originalLineNumber: row.originalLineNumber,
        changedLineNumber: null,
        segments: row.originalSegments,
        background: '',
      });
      lines.push({
        key: `${index}-ma`,
        prefix: '+',
        originalLineNumber: null,
        changedLineNumber: row.changedLineNumber,
        segments: row.changedSegments,
        background: '',
      });
    }
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-ink/10 dark:border-paper/10">
      <table className="w-full border-collapse font-mono text-xs">
        <tbody>
          {lines.map((line) => (
            <tr key={line.key} className="align-top">
              <LineNumberCell value={line.originalLineNumber} />
              <LineNumberCell value={line.changedLineNumber} />
              <td className="w-6 select-none px-1 py-0.5 text-center text-ink/40 dark:text-paper/40">{line.prefix}</td>
              <td className={`whitespace-pre-wrap break-all px-2 py-0.5 ${line.background}`}>
                <Segments segments={line.segments} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink dark:text-paper';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-ink/50 dark:text-paper/50">{label}</span>
      <span className={`font-mono text-base font-medium ${toneClass}`}>{value.toLocaleString()}</span>
    </div>
  );
}

export function DiffTool() {
  const [original, setOriginal] = useState('');
  const [changed, setChanged] = useState('');
  const [debouncedOriginal, setDebouncedOriginal] = useState('');
  const [debouncedChanged, setDebouncedChanged] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('line');
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('./utils/diff.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<DiffWorkerResponse>) => {
      if (event.data.requestId !== latestRequestRef.current) return;
      setDiffResult(event.data.result);
      setIsComputing(false);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOriginal(original);
      setDebouncedChanged(changed);
    }, 400);
    return () => clearTimeout(timer);
  }, [original, changed]);

  useEffect(() => {
    if (!debouncedOriginal && !debouncedChanged) {
      setDiffResult(null);
      setIsComputing(false);
      return;
    }
    const worker = workerRef.current;
    if (!worker) return;
    const requestId = (latestRequestRef.current += 1);
    setIsComputing(true);
    const request: DiffWorkerRequest = {
      requestId,
      original: debouncedOriginal,
      changed: debouncedChanged,
      options: { granularity, ignoreWhitespace, ignoreCase },
    };
    worker.postMessage(request);
  }, [debouncedOriginal, debouncedChanged, granularity, ignoreWhitespace, ignoreCase]);

  const unifiedText = useMemo(() => (diffResult ? formatUnifiedDiff(diffResult) : ''), [diffResult]);

  function handleSwap() {
    setOriginal(changed);
    setChanged(original);
  }

  async function handlePaste(target: 'original' | 'changed') {
    try {
      const text = await navigator.clipboard.readText();
      if (target === 'original') setOriginal(text);
      else setChanged(text);
    } catch {
      // Clipboard access can be denied by the browser — standard paste
      // (Ctrl/Cmd+V, right-click) still works, so this button is a
      // convenience, not the only way in.
    }
  }

  function handleDownload() {
    if (!diffResult) return;
    const blob = new Blob([unifiedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diff.patch';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Original</span>
            <button type="button" onClick={() => handlePaste('original')} className="text-accent hover:underline">
              Paste
            </button>
          </div>
          <textarea
            value={original}
            onChange={(event) => setOriginal(event.target.value)}
            spellCheck={false}
            placeholder="Paste or type the original text…"
            aria-label="Original text"
            className={textareaClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Changed</span>
            <button type="button" onClick={() => handlePaste('changed')} className="text-accent hover:underline">
              Paste
            </button>
          </div>
          <textarea
            value={changed}
            onChange={(event) => setChanged(event.target.value)}
            spellCheck={false}
            placeholder="Paste or type the changed text…"
            aria-label="Changed text"
            className={textareaClasses}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleSwap} disabled={!original && !changed}>
          Swap
        </Button>
        <span className="mx-1 text-ink/20 dark:text-paper/20">|</span>
        {GRANULARITY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={granularity === option.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setGranularity(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <span className="mx-1 text-ink/20 dark:text-paper/20">|</span>
        <Button variant={viewMode === 'side-by-side' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('side-by-side')}>
          Side-by-side
        </Button>
        <Button variant={viewMode === 'unified' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('unified')}>
          Unified
        </Button>
        <span className="mx-1 text-ink/20 dark:text-paper/20">|</span>
        <Checkbox label="Ignore whitespace" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} />
        <Checkbox label="Ignore case" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} />

        <div className="ml-auto flex items-center gap-2">
          {viewMode === 'unified' && <CopyButton value={unifiedText} disabled={!diffResult} />}
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!diffResult}>
            Download .patch
          </Button>
        </div>
      </div>

      {diffResult && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-ink/10 p-4 sm:grid-cols-4 lg:grid-cols-7 dark:border-paper/10">
          <Stat label="Lines added" value={diffResult.stats.linesAdded} tone="success" />
          <Stat label="Lines removed" value={diffResult.stats.linesRemoved} tone="danger" />
          <Stat label="Lines modified" value={diffResult.stats.linesModified} />
          <Stat label="Lines unchanged" value={diffResult.stats.linesUnchanged} />
          <Stat label="Words added" value={diffResult.stats.wordsAdded} tone="success" />
          <Stat label="Words removed" value={diffResult.stats.wordsRemoved} tone="danger" />
          <Stat label="Words unchanged" value={diffResult.stats.wordsUnchanged} />
        </div>
      )}

      {isComputing && <p className="text-xs text-ink/50 dark:text-paper/50">Computing diff…</p>}

      {diffResult && !isComputing && (viewMode === 'side-by-side' ? <SideBySideView rows={diffResult.rows} /> : <UnifiedView rows={diffResult.rows} />)}

      {!diffResult && !isComputing && (
        <p className="rounded-lg border border-dashed border-ink/10 p-6 text-center text-sm text-ink/50 dark:border-paper/10 dark:text-paper/50">
          Paste text into both boxes above to see the diff.
        </p>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you paste here is stored or transmitted — the comparison runs entirely in your browser.
      </span>
    </div>
  );
}
