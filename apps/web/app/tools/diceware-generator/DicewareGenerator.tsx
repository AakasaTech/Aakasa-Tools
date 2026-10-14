'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CopyButton, Slider, StrengthMeter } from '@aakasa/ui';
import { getStrengthLabel } from '../password-generator/utils/generatePassword';
import { generatePassphrase, WORDLIST_SIZE, BITS_PER_WORD, type PassphraseOptions } from './utils/generatePassphrase';

const BULK_COUNT = 5;

type SeparatorChoice = 'space' | 'hyphen' | 'none';

const SEPARATOR_VALUES: Record<SeparatorChoice, string> = {
  space: ' ',
  hyphen: '-',
  none: '',
};

export function DicewareGenerator() {
  const [wordCount, setWordCount] = useState(6);
  const [separatorChoice, setSeparatorChoice] = useState<SeparatorChoice>('hyphen');
  const [capitalize, setCapitalize] = useState(false);
  const [includeNumber, setIncludeNumber] = useState(false);
  const [includeSymbol, setIncludeSymbol] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [entropyBits, setEntropyBits] = useState(0);
  const [bulkPassphrases, setBulkPassphrases] = useState<{ passphrase: string; entropyBits: number }[]>([]);

  const options = useMemo<PassphraseOptions>(
    () => ({ wordCount, separator: SEPARATOR_VALUES[separatorChoice], capitalize, includeNumber, includeSymbol }),
    [wordCount, separatorChoice, capitalize, includeNumber, includeSymbol]
  );

  const regenerate = useCallback(() => {
    const result = generatePassphrase(options);
    setPassphrase(result.passphrase);
    setEntropyBits(result.entropyBits);
  }, [options]);

  // Generates on mount, and again whenever any option changes.
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  function handleGenerateBulk() {
    setBulkPassphrases(Array.from({ length: BULK_COUNT }, () => generatePassphrase(options)));
  }

  const strengthLevel = getStrengthLabel(entropyBits);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
          <span>Generated passphrase</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={passphrase}
            aria-label="Generated passphrase"
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={passphrase} size="md" disabled={!passphrase} />
        </div>

        <StrengthMeter level={strengthLevel} detail={`${entropyBits.toFixed(1)} bits of entropy`} />
      </div>

      <div className="flex flex-col gap-4">
        <Slider label="Word count" min={4} max={8} value={wordCount} onChange={setWordCount} />
        <p className="-mt-2.5 text-xs text-ink/50 dark:text-paper/50">
          Each additional word multiplies the search space by {WORDLIST_SIZE.toLocaleString()} (the wordlist size) — word count matters far
          more for security here than which words happen to be chosen.
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/70 dark:text-paper/70">Separator</span>
          <div className="flex gap-2">
            {(['space', 'hyphen', 'none'] as SeparatorChoice[]).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setSeparatorChoice(choice)}
                aria-pressed={separatorChoice === choice}
                className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                  separatorChoice === choice
                    ? 'bg-accent text-white'
                    : 'bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-paper/10 dark:text-paper/70 dark:hover:bg-paper/20'
                }`}
              >
                {choice === 'none' ? 'None (concatenated)' : choice}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          <input type="checkbox" checked={capitalize} onChange={(event) => setCapitalize(event.target.checked)} className="accent-accent" />
          Capitalize each word
        </label>

        <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
          <p className="text-xs text-ink/50 dark:text-paper/50">
            Optional — pure word-based diceware is already strong on its own. Add these only if a service requires a number or symbol.
          </p>
          <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              checked={includeNumber}
              onChange={(event) => setIncludeNumber(event.target.checked)}
              className="accent-accent"
            />
            Insert a random digit
          </label>
          <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              checked={includeSymbol}
              onChange={(event) => setIncludeSymbol(event.target.checked)}
              className="accent-accent"
            />
            Insert a random symbol
          </label>
        </div>

        <Button onClick={regenerate} size="md">
          Generate
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-ink/10 pt-4 dark:border-paper/10">
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={handleGenerateBulk}>
            Generate {BULK_COUNT} passphrases
          </Button>
          {bulkPassphrases.length > 0 && (
            <CopyButton value={bulkPassphrases.map((item) => item.passphrase).join('\n')} label="Copy all" size="sm" />
          )}
        </div>

        {bulkPassphrases.length > 0 && (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-ink/10 p-2 dark:border-paper/10">
            {bulkPassphrases.map((item, index) => (
              <li
                key={`${index}-${item.passphrase}`}
                className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-ink/5 dark:hover:bg-paper/5"
              >
                <span className="truncate font-mono text-sm text-ink dark:text-paper">{item.passphrase}</span>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-ink/40 dark:text-paper/40">{item.entropyBits.toFixed(1)} bits</span>
                  <CopyButton value={item.passphrase} label="Copy" size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-ink/50 dark:text-paper/50">
        Words are drawn from the {WORDLIST_SIZE.toLocaleString()}-word EFF long wordlist ({BITS_PER_WORD.toFixed(2)} bits per word) using
        the Web Crypto API (<code className="font-mono">crypto.getRandomValues</code>), with unbiased rejection sampling — never
        Math.random(). Nothing is generated on, or sent to, a server.
      </p>
    </div>
  );
}
