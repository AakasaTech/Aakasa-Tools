'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CopyButton, Slider, StrengthMeter } from '@aakasa/ui';
import {
  buildCharacterPool,
  calculateEntropy,
  generatePassword,
  getStrengthLabel,
  type PasswordOptions,
} from './utils/generatePassword';

const BULK_COUNT = 10;

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([]);

  const options = useMemo<PasswordOptions>(
    () => ({ length, uppercase, lowercase, numbers, symbols, excludeAmbiguous }),
    [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]
  );

  const poolSize = useMemo(() => buildCharacterPool(options).length, [options]);
  const hasNoCharsetSelected = poolSize === 0;
  const entropyBits = useMemo(() => calculateEntropy(length, poolSize), [length, poolSize]);
  const strengthLevel = useMemo(() => getStrengthLabel(entropyBits), [entropyBits]);

  const regenerate = useCallback(() => {
    if (poolSize === 0) {
      setPassword('');
      return;
    }
    setPassword(generatePassword(options));
  }, [options, poolSize]);

  // Generates on mount, and again whenever length or a character-set toggle
  // changes — no debounce needed since generation is effectively instant.
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  function handleGenerateBulk() {
    if (hasNoCharsetSelected) {
      return;
    }
    const list = Array.from({ length: BULK_COUNT }, () => generatePassword(options));
    setBulkPasswords(list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
          <span>Generated password</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={password}
            placeholder={hasNoCharsetSelected ? 'Select at least one character type' : ''}
            aria-label="Generated password"
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={password} size="md" disabled={!password} />
        </div>

        {!hasNoCharsetSelected && (
          <StrengthMeter level={strengthLevel} detail={`${entropyBits.toFixed(1)} bits of entropy`} />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Slider label="Length" min={4} max={64} value={length} onChange={setLength} />

        <div className="grid grid-cols-2 gap-2 text-sm text-ink/70 dark:text-paper/70 sm:grid-cols-4">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(event) => setUppercase(event.target.checked)}
              className="accent-accent"
            />
            Uppercase (A-Z)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(event) => setLowercase(event.target.checked)}
              className="accent-accent"
            />
            Lowercase (a-z)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(event) => setNumbers(event.target.checked)}
              className="accent-accent"
            />
            Numbers (0-9)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(event) => setSymbols(event.target.checked)}
              className="accent-accent"
            />
            Symbols (!@#$…)
          </label>
        </div>

        <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(event) => setExcludeAmbiguous(event.target.checked)}
            className="accent-accent"
          />
          Exclude ambiguous characters (0/O, 1/l/I)
        </label>

        <div className="flex flex-col gap-1.5">
          <Button onClick={regenerate} disabled={hasNoCharsetSelected} size="md">
            Regenerate
          </Button>
          {hasNoCharsetSelected && (
            <p role="alert" className="text-xs text-danger">
              Select at least one character type
            </p>
          )}
        </div>
      </div>

      {/* Bulk generation: fully functional and free for now — a natural
          candidate to gate as Pro once tier-gating logic exists, but that
          logic doesn't exist anywhere in the repo yet, so this stays open. */}
      <div className="flex flex-col gap-2 border-t border-ink/10 pt-4 dark:border-paper/10">
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={handleGenerateBulk} disabled={hasNoCharsetSelected}>
            Generate {BULK_COUNT} passwords
          </Button>
          {bulkPasswords.length > 0 && (
            <CopyButton value={bulkPasswords.join('\n')} label="Copy all" size="sm" />
          )}
        </div>

        {bulkPasswords.length > 0 && (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-ink/10 p-2 dark:border-paper/10">
            {bulkPasswords.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-ink/5 dark:hover:bg-paper/5"
              >
                <span className="truncate font-mono text-sm text-ink dark:text-paper">{item}</span>
                <CopyButton value={item} label="Copy" size="sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
