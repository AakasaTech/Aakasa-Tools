/**
 * Pure password generation/entropy logic. No React, no DOM beyond the Web
 * Crypto API — safe to unit test, and reusable by a future Password
 * Strength Checker tool (calculateEntropy / getStrengthLabel don't know
 * anything about generation).
 */

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Characters that are easy to mistake for one another in many fonts —
// excluded when the user needs to type the password by hand.
const AMBIGUOUS_CHARS = new Set(['0', 'O', '1', 'l', 'I']);

/** Builds the actual character pool for a given set of options, post-exclusions. */
export function buildCharacterPool(options: PasswordOptions): string {
  const parts: string[] = [];
  if (options.uppercase) parts.push(UPPERCASE);
  if (options.lowercase) parts.push(LOWERCASE);
  if (options.numbers) parts.push(NUMBERS);
  if (options.symbols) parts.push(SYMBOLS);

  let pool = parts.join('');
  if (options.excludeAmbiguous) {
    pool = [...pool].filter((ch) => !AMBIGUOUS_CHARS.has(ch)).join('');
  }
  return pool;
}

/**
 * Uniform random integer in [0, max) via rejection sampling over
 * crypto.getRandomValues — never Math.random(). A naive `value % max`
 * would introduce modulo bias whenever max doesn't evenly divide 2^32
 * (i.e. almost always), which is exactly the kind of subtle flaw that
 * makes a "secure" generator not actually secure.
 */
function getRandomIndex(max: number): number {
  const range = 0x100000000; // 2^32
  const limit = Math.floor(range / max) * max;
  const array = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(array);
    // Safe: `array` is a fixed-size Uint32Array(1), index 0 always exists.
    value = array[0]!;
  } while (value >= limit);
  return value % max;
}

export function generatePassword(options: PasswordOptions): string {
  const pool = [...buildCharacterPool(options)];
  if (pool.length === 0) {
    return '';
  }

  const result: string[] = [];
  for (let i = 0; i < options.length; i += 1) {
    // Safe: getRandomIndex(pool.length) always returns an index within bounds.
    result.push(pool[getRandomIndex(pool.length)]!);
  }
  return result.join('');
}

/** Shannon entropy in bits, assuming each character is drawn uniformly from a pool of `poolSize`. */
export function calculateEntropy(length: number, poolSize: number): number {
  if (poolSize <= 1 || length <= 0) {
    return 0;
  }
  return length * Math.log2(poolSize);
}

export type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very-strong';

export function getStrengthLabel(entropyBits: number): StrengthLevel {
  if (entropyBits < 40) return 'weak';
  if (entropyBits < 60) return 'fair';
  if (entropyBits < 80) return 'strong';
  return 'very-strong';
}
