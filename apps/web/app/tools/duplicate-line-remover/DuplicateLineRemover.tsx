'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { removeDuplicateLines } from './utils/removeDuplicates';

const SAMPLE_INPUT = 'apple\nbanana\nApple\ncherry\nbanana\n\ncherry  ';

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DuplicateLineRemover() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(true);
  const [keepFirst, setKeepFirst] = useState(true);
  const [sortOutput, setSortOutput] = useState(false);

  const { result, totalLines, uniqueLines, duplicatesRemoved } = useMemo(
    () => removeDuplicateLines(input, { caseSensitive, trimWhitespace, ignoreEmptyLines, keepFirst, sortOutput }),
    [input, caseSensitive, trimWhitespace, ignoreEmptyLines, keepFirst, sortOutput],
  );

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Input
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Paste a list or block of text, one item per line…"
          className="h-48 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Checkbox label="Case-sensitive" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />
        <Checkbox label="Trim whitespace before comparing" checked={trimWhitespace} onChange={(event) => setTrimWhitespace(event.target.checked)} />
        <Checkbox label="Ignore empty lines" checked={ignoreEmptyLines} onChange={(event) => setIgnoreEmptyLines(event.target.checked)} />
        <Checkbox label="Sort output alphabetically" checked={sortOutput} onChange={(event) => setSortOutput(event.target.checked)} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-ink/70 dark:text-paper/70">When duplicates are found, keep the</span>
        <div className="flex gap-1.5">
          <Button variant={keepFirst ? 'primary' : 'secondary'} size="sm" onClick={() => setKeepFirst(true)}>
            First occurrence
          </Button>
          <Button variant={!keepFirst ? 'primary' : 'secondary'} size="sm" onClick={() => setKeepFirst(false)}>
            Last occurrence
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-ink/10 p-3 text-sm dark:border-paper/10">
        <span className="text-ink/70 dark:text-paper/70">
          <span className="font-mono font-semibold text-ink dark:text-paper">{totalLines.toLocaleString()}</span> total lines
        </span>
        <span className="text-ink/70 dark:text-paper/70">
          <span className="font-mono font-semibold text-ink dark:text-paper">{uniqueLines.toLocaleString()}</span> unique lines
        </span>
        <span className={duplicatesRemoved > 0 ? 'font-medium text-accent' : 'text-ink/70 dark:text-paper/70'}>
          {duplicatesRemoved > 0
            ? `Removed ${duplicatesRemoved.toLocaleString()} duplicate line${duplicatesRemoved === 1 ? '' : 's'}`
            : 'No duplicates found'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output</span>
          <div className="flex gap-2">
            <CopyButton value={result} size="sm" disabled={!result} />
            <Button variant="secondary" size="sm" onClick={() => downloadTextFile(result, 'deduplicated.txt')} disabled={!result}>
              Download .txt
            </Button>
          </div>
        </div>
        <textarea
          value={result}
          readOnly
          placeholder="Deduplicated output will appear here…"
          className="h-48 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
