'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StrengthMeter } from '@aakasa/ui';
import { calculateEntropy, getStrengthLabel } from '../password-generator/utils/generatePassword';
import { detectPatterns } from './utils/detectWeakPatterns';
import { DEFAULT_GUESSES_PER_SECOND, estimateCrackTime } from './utils/estimateCrackTime';

// Matches password-generator's own SYMBOLS pool size (26 characters), so a
// checker's entropy estimate for a typed password stays on the same basis
// as the generator's — this tool doesn't know WHICH symbols were used, so
// it can only detect that at least one non-alphanumeric character is
// present and assume a pool of that size.
const SYMBOL_POOL_SIZE = 26;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

/** Infers a character pool size from which classes are actually present in
 * the password — the checker doesn't know a chosen charset up front the
 * way the generator does, only what ended up in the string. */
function inferPoolSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += SYMBOL_POOL_SIZE;
  return size;
}

function buildSuggestions(password: string, entropyBits: number, hasWeakPatterns: boolean): string[] {
  const suggestions: string[] = [];
  if (password.length < 12) {
    suggestions.push('Increase the length — longer passwords are exponentially harder to guess than adding more character types.');
  }
  if (!/[a-z]/.test(password)) suggestions.push('Add lowercase letters.');
  if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters.');
  if (!/[0-9]/.test(password)) suggestions.push('Add numbers.');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add symbols (e.g. !@#$%).');
  if (hasWeakPatterns) {
    suggestions.push('Avoid predictable patterns — sequences (abc, 123), keyboard runs (qwerty), repeated characters, and common words, even with letter/number substitutions.');
  }
  if (entropyBits < 60 && suggestions.length === 0) {
    suggestions.push('Consider using a longer, randomly-generated password rather than one built from a memorable pattern.');
  }
  return suggestions;
}

export function PasswordStrengthChecker() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const debouncedPassword = useDebouncedValue(password, 150);

  const poolSize = useMemo(() => inferPoolSize(debouncedPassword), [debouncedPassword]);
  const entropyBits = useMemo(() => calculateEntropy(debouncedPassword.length, poolSize), [debouncedPassword, poolSize]);
  const strengthLevel = useMemo(() => getStrengthLabel(entropyBits), [entropyBits]);
  const crackTime = useMemo(() => estimateCrackTime(entropyBits), [entropyBits]);
  const weaknesses = useMemo(() => detectPatterns(debouncedPassword), [debouncedPassword]);
  const suggestions = useMemo(
    () => buildSuggestions(debouncedPassword, entropyBits, weaknesses.length > 0),
    [debouncedPassword, entropyBits, weaknesses.length]
  );

  const hasPassword = debouncedPassword.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border-y border-r border-l-2 border-l-success border-ink/10 bg-success/5 p-3 text-sm text-ink dark:border-paper/10 dark:text-paper">
        <strong>Nothing you type here ever leaves your browser.</strong> This tool runs entirely client-side — no network
        request, log, analytics event, or storage write of any kind is ever made with what you enter, not even in
        hashed or aggregate form. You can safely check a password you actually use.
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password-strength-input" className="text-sm text-ink/70 dark:text-paper/70">
          Password to check
        </label>
        <div className="flex items-center gap-2">
          <input
            id="password-strength-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Type a password to check its strength…"
            className="h-11 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-base text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="h-11 shrink-0 rounded-md border border-ink/10 px-3 text-sm text-ink/70 hover:text-ink dark:border-paper/10 dark:text-paper/70 dark:hover:text-paper"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {hasPassword && (
        <div className="flex flex-col gap-4">
          <StrengthMeter level={strengthLevel} detail={`${entropyBits.toFixed(1)} bits of entropy`} />

          <div className="rounded-lg border border-ink/10 p-3 text-sm text-ink dark:border-paper/10 dark:text-paper">
            Would take approximately <strong>{crackTime}</strong> to crack via brute force, assuming{' '}
            {DEFAULT_GUESSES_PER_SECOND.toLocaleString('en-US')} guesses/second.
            <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">
              A simplified, illustrative estimate, not a precise prediction — real attacks vary enormously by method
              (online vs. offline), attacker hardware, and whether this password appears in a leaked-password
              dictionary, which would make even a high-entropy password crack far faster than brute force alone.
            </p>
          </div>

          {weaknesses.length > 0 && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-ink dark:text-paper">
              <p className="font-medium text-danger">Weak patterns detected</p>
              <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
                These can make a password much easier to guess than its raw entropy suggests, since they&apos;re exactly
                what automated cracking tools check for first.
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {weaknesses.map((w, i) => (
                  <li key={`${w.pattern}-${i}`} className="text-xs text-ink/80 dark:text-paper/80">
                    {w.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
              <p className="text-sm font-medium text-ink dark:text-paper">Suggestions</p>
              <ul className="mt-1.5 list-disc pl-4 text-xs text-ink/70 dark:text-paper/70">
                {suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-ink/50 dark:text-paper/50">
            Trying to fix a weak password instead of generating a new one? The{' '}
            <Link href="/tools/password-generator" className="text-accent underline">
              Password Generator
            </Link>{' '}
            makes a fresh, strong one for you.
          </p>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Strength is measured the same way as this toolbox&apos;s Password Generator — entropy in bits, based on password
        length and which character types are present.
      </span>
    </div>
  );
}
