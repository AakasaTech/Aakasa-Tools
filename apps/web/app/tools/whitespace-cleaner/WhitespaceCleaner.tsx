'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { cleanText, ZERO_WIDTH_CHARACTERS, type BlankLineHandling, type TabHandling } from './utils/cleanWhitespace';

const SAMPLE_INPUT = 'Hello    World!\r\nThis  line has   extra spaces.\n\n\n\nToo many blank lines above.\r\n\r\n\tTabbed line.';

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function WhitespaceCleaner() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [normalizeLineEndings, setNormalizeLineEndings] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [blankLineHandling, setBlankLineHandling] = useState<BlankLineHandling>('collapse');
  const [maxConsecutiveBlankLinesValue, setMaxConsecutiveBlankLinesValue] = useState('1');
  const [removeLineBreaks, setRemoveLineBreaks] = useState(false);
  const [removeInvisibleChars, setRemoveInvisibleChars] = useState(true);
  const [tabHandling, setTabHandling] = useState<TabHandling>('convert');
  const [tabSpaceCountValue, setTabSpaceCountValue] = useState('4');

  const maxConsecutiveBlankLines = Math.max(0, Math.floor(Number(maxConsecutiveBlankLinesValue)) || 0);
  const tabSpaceCount = Math.max(1, Math.floor(Number(tabSpaceCountValue)) || 1);

  const output = useMemo(
    () =>
      cleanText(input, {
        normalizeLineEndings,
        trimLines,
        collapseSpaces,
        blankLineHandling,
        maxConsecutiveBlankLines,
        removeLineBreaks,
        removeInvisibleChars,
        tabHandling,
        tabSpaceCount,
      }),
    [input, normalizeLineEndings, trimLines, collapseSpaces, blankLineHandling, maxConsecutiveBlankLines, removeLineBreaks, removeInvisibleChars, tabHandling, tabSpaceCount],
  );

  const charsRemoved = input.length - output.length;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Input
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Paste messy text here…"
          className="h-40 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Checkbox label="Trim leading/trailing whitespace per line" checked={trimLines} onChange={(event) => setTrimLines(event.target.checked)} />
          <Checkbox label="Collapse multiple spaces into one" checked={collapseSpaces} onChange={(event) => setCollapseSpaces(event.target.checked)} />
          <Checkbox
            label="Normalize line endings (\r\n / \r → \n)"
            checked={normalizeLineEndings}
            onChange={(event) => setNormalizeLineEndings(event.target.checked)}
          />
          <Checkbox
            label="Remove invisible characters (NBSP, zero-width…)"
            checked={removeInvisibleChars}
            onChange={(event) => setRemoveInvisibleChars(event.target.checked)}
          />
        </div>

        <div className="flex flex-col gap-1.5 border-t border-ink/10 pt-3 dark:border-paper/10">
          <span className="text-xs font-medium text-ink/60 dark:text-paper/60">Blank lines</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant={blankLineHandling === 'none' ? 'primary' : 'secondary'} size="sm" onClick={() => setBlankLineHandling('none')}>
              Leave as-is
            </Button>
            <Button variant={blankLineHandling === 'collapse' ? 'primary' : 'secondary'} size="sm" onClick={() => setBlankLineHandling('collapse')}>
              Collapse to max
            </Button>
            {blankLineHandling === 'collapse' && (
              <input
                type="text"
                inputMode="numeric"
                value={maxConsecutiveBlankLinesValue}
                onChange={(event) => setMaxConsecutiveBlankLinesValue(event.target.value)}
                className="w-14 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
            )}
            <Button variant={blankLineHandling === 'removeAll' ? 'primary' : 'secondary'} size="sm" onClick={() => setBlankLineHandling('removeAll')}>
              Remove all blank lines
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-ink/10 pt-3 dark:border-paper/10">
          <span className="text-xs font-medium text-ink/60 dark:text-paper/60">Tabs</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant={tabHandling === 'none' ? 'primary' : 'secondary'} size="sm" onClick={() => setTabHandling('none')}>
              Leave as-is
            </Button>
            <Button variant={tabHandling === 'convert' ? 'primary' : 'secondary'} size="sm" onClick={() => setTabHandling('convert')}>
              Convert to spaces
            </Button>
            {tabHandling === 'convert' && (
              <input
                type="text"
                inputMode="numeric"
                value={tabSpaceCountValue}
                onChange={(event) => setTabSpaceCountValue(event.target.value)}
                className="w-14 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
            )}
            <Button variant={tabHandling === 'remove' ? 'primary' : 'secondary'} size="sm" onClick={() => setTabHandling('remove')}>
              Remove tabs
            </Button>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-3 dark:border-paper/10">
          <Checkbox
            label="Remove all line breaks (join into one paragraph)"
            checked={removeLineBreaks}
            onChange={(event) => setRemoveLineBreaks(event.target.checked)}
          />
        </div>

        {removeInvisibleChars && (
          <p className="text-xs text-ink/40 dark:text-paper/40">
            Targets non-breaking spaces (converted to a regular space) and: {ZERO_WIDTH_CHARACTERS.map((c) => c.name).join(', ')}.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-ink/70 dark:text-paper/70">
        <span>
          Input: <span className="font-mono font-semibold text-ink dark:text-paper">{input.length.toLocaleString()}</span> chars
        </span>
        <span>
          Output: <span className="font-mono font-semibold text-ink dark:text-paper">{output.length.toLocaleString()}</span> chars
        </span>
        {charsRemoved !== 0 && (
          <span className={charsRemoved > 0 ? 'font-medium text-accent' : 'font-medium text-ink/70 dark:text-paper/70'}>
            {charsRemoved > 0 ? `Removed ${charsRemoved.toLocaleString()} characters` : `Added ${Math.abs(charsRemoved).toLocaleString()} characters`}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output</span>
          <div className="flex gap-2">
            <CopyButton value={output} size="sm" disabled={!output} />
            <Button variant="secondary" size="sm" onClick={() => downloadTextFile(output, 'cleaned.txt')} disabled={!output}>
              Download .txt
            </Button>
          </div>
        </div>
        <textarea
          value={output}
          readOnly
          className="h-40 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
