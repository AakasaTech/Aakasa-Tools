'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { isPalindrome, reverseCharacters, reverseEachWord, reverseWordOrder } from './utils/textReverse';

type ReversalMode = 'characters' | 'wordOrder' | 'eachWord';

const MODE_OPTIONS: { value: ReversalMode; label: string }[] = [
  { value: 'characters', label: 'Reverse entire string' },
  { value: 'wordOrder', label: 'Reverse word order' },
  { value: 'eachWord', label: "Reverse each word's letters" },
];

const SAMPLE_INPUT = 'A man, a plan, a canal: Panama';

export function TextReverser() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [mode, setMode] = useState<ReversalMode>('characters');
  const [relaxedPalindrome, setRelaxedPalindrome] = useState(true);

  const output = useMemo(() => {
    if (mode === 'wordOrder') return reverseWordOrder(input);
    if (mode === 'eachWord') return reverseEachWord(input);
    return reverseCharacters(input);
  }, [input, mode]);

  const palindromeResult = useMemo(() => isPalindrome(input, !relaxedPalindrome), [input, relaxedPalindrome]);
  const hasInput = input.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Input
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Type or paste some text…"
          className="h-32 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {MODE_OPTIONS.map((option) => (
          <Button key={option.value} variant={mode === option.value ? 'primary' : 'secondary'} size="sm" onClick={() => setMode(option.value)}>
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">Reversed output</span>
          <CopyButton value={output} size="sm" disabled={!output} />
        </div>
        <textarea
          value={output}
          readOnly
          className="h-32 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink dark:text-paper">Palindrome check</span>
          <Checkbox
            label="Ignore spaces, punctuation & case"
            checked={relaxedPalindrome}
            onChange={(event) => setRelaxedPalindrome(event.target.checked)}
          />
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">Checks the input above, not the reversed output.</p>
        {hasInput && (
          <div
            className={`rounded-md border-y border-r border-l-2 px-3 py-2 text-center text-sm font-semibold ${
              palindromeResult
                ? 'border-l-success border-ink/10 bg-success/10 text-success dark:border-paper/10'
                : 'border-l-danger border-ink/10 bg-danger/10 text-danger dark:border-paper/10'
            }`}
          >
            {palindromeResult ? 'PALINDROME' : 'NOT A PALINDROME'}
          </div>
        )}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
