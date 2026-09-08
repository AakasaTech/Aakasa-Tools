'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { sortLines, type SortMode } from './utils/sortLines';

const SAMPLE_INPUT = 'banana\nApple\napple\nBanana\nitem2\nitem10\nitem1';

const MODE_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'alphabetical', label: 'Alphabetical (A–Z)' },
  { value: 'natural', label: 'Natural / numeric' },
  { value: 'length', label: 'By length' },
  { value: 'random', label: 'Random shuffle' },
];

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function TextSorter() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [mode, setMode] = useState<SortMode>('alphabetical');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [shuffledBase, setShuffledBase] = useState<string[]>([]);

  const lines = useMemo(() => input.split(/\r\n|\r|\n/).filter((line) => line.length > 0), [input]);

  function handleModeChange(nextMode: SortMode) {
    setMode(nextMode);
    if (nextMode === 'random') {
      setShuffledBase(sortLines(lines, 'random', { caseSensitive, reverse: false }));
    }
  }

  function handleShuffle() {
    setShuffledBase(sortLines(lines, 'random', { caseSensitive, reverse: false }));
  }

  // Random mode is deliberately NOT recomputed live from `lines`/options —
  // it only changes when the user explicitly switches to it or clicks
  // "Shuffle"; re-drawing a new random order on every keystroke or option
  // toggle would make the result impossible to look at or copy reliably.
  const outputLines = mode === 'random' ? (reverse ? [...shuffledBase].reverse() : shuffledBase) : sortLines(lines, mode, { caseSensitive, reverse });
  const output = outputLines.join('\n');

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Input
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Paste a list, one item per line…"
          className="h-48 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="col-span-2 flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70 sm:col-span-1">
          Sort by
          <select
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as SortMode)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="col-span-2 flex flex-wrap items-end gap-4 sm:col-span-3">
          {mode === 'alphabetical' && (
            <Checkbox label="Case-sensitive" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />
          )}
          <Checkbox label="Reverse order" checked={reverse} onChange={(event) => setReverse(event.target.checked)} />
          {mode === 'random' && (
            <Button variant="secondary" size="sm" onClick={handleShuffle}>
              Shuffle
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-ink/70 dark:text-paper/70">
        <span className="font-mono font-semibold text-ink dark:text-paper">{lines.length.toLocaleString()}</span> line{lines.length === 1 ? '' : 's'}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output</span>
          <div className="flex gap-2">
            <CopyButton value={output} size="sm" disabled={!output} />
            <Button variant="secondary" size="sm" onClick={() => downloadTextFile(output, 'sorted.txt')} disabled={!output}>
              Download .txt
            </Button>
          </div>
        </div>
        <textarea
          value={output}
          readOnly
          placeholder="Sorted output will appear here…"
          className="h-48 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
