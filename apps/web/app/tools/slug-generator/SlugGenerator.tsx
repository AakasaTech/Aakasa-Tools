'use client';

import { useMemo, useState } from 'react';
import { Checkbox, CopyButton } from '@aakasa/ui';
import { generateSlugsForLines, type SlugSeparator } from './utils/generateSlug';

const SAMPLE_INPUT = 'My Blog Post Title!\nCafé de Paris — A Résumé';

export function SlugGenerator() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [separator, setSeparator] = useState<SlugSeparator>('-');
  const [lowercase, setLowercase] = useState(true);
  const [maxLengthValue, setMaxLengthValue] = useState('');
  const [removeStopWords, setRemoveStopWords] = useState(false);

  const maxLength = maxLengthValue.trim() === '' ? undefined : Math.max(1, Math.floor(Number(maxLengthValue)) || 1);

  const lines = useMemo(
    () => input.split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0),
    [input],
  );

  const slugs = useMemo(
    () => generateSlugsForLines(input, { separator, lowercase, maxLength, removeStopWords }),
    [input, separator, lowercase, maxLength, removeStopWords],
  );

  const allSlugsText = slugs.join('\n');

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Text to slugify
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Type a title, or paste multiple lines to generate a slug for each…"
          className="h-28 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Separator
          <select
            value={separator}
            onChange={(event) => setSeparator(event.target.value as SlugSeparator)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            <option value="-" className="bg-paper text-ink dark:bg-ink dark:text-paper">
              Hyphen ( - )
            </option>
            <option value="_" className="bg-paper text-ink dark:bg-ink dark:text-paper">
              Underscore ( _ )
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Max length (optional)
          <input
            type="text"
            inputMode="numeric"
            value={maxLengthValue}
            onChange={(event) => setMaxLengthValue(event.target.value)}
            placeholder="No limit"
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>

        <div className="col-span-2 flex flex-wrap items-end gap-4">
          <Checkbox label="Lowercase" checked={lowercase} onChange={(event) => setLowercase(event.target.checked)} />
          <Checkbox label="Remove stop words (a, the, of, and…)" checked={removeStopWords} onChange={(event) => setRemoveStopWords(event.target.checked)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">
            {slugs.length > 1 ? `${slugs.length} slugs` : 'Slug'}
          </span>
          {slugs.length > 1 && <CopyButton value={allSlugsText} label="Copy all" size="sm" disabled={!allSlugsText} />}
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-ink/40 dark:text-paper/40">Type or paste some text above to generate a slug.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lines.map((line, index) => (
              <div key={index} className="flex flex-col gap-1 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
                {slugs.length > 1 && <span className="truncate text-xs text-ink/50 dark:text-paper/50">{line}</span>}
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink dark:text-paper">{slugs[index] || '(empty)'}</span>
                  <CopyButton value={slugs[index] ?? ''} size="sm" disabled={!slugs[index]} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
