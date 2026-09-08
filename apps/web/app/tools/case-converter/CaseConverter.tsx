'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { CASE_STYLES, tokenizeWords } from './utils/caseConvert';

const DEFAULT_INPUT = 'my-variable_name convertsTo Any Case Style';

export function CaseConverter() {
  const [input, setInput] = useState(DEFAULT_INPUT);

  const words = useMemo(() => tokenizeWords(input), [input]);
  const results = useMemo(() => CASE_STYLES.map((style) => ({ ...style, value: style.convert(words) })), [words]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="case-converter-input" className="text-sm text-ink/70 dark:text-paper/70">
            Text to convert
          </label>
          <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
            Clear
          </Button>
        </div>
        <textarea
          id="case-converter-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Type or paste text in any case style…"
          className="h-24 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </div>

      <div className="flex flex-col gap-2">
        {results.map((result) => (
          <div key={result.id} className="flex items-center gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <span className="w-40 shrink-0 text-xs text-ink/50 dark:text-paper/50">{result.label}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink dark:text-paper">{result.value || '—'}</span>
            <CopyButton value={result.value} size="sm" disabled={!result.value} />
          </div>
        ))}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
