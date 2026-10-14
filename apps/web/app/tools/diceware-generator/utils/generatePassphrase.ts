/**
 * Pure diceware passphrase generation/entropy logic. No React, no DOM
 * beyond the Web Crypto API. Mirrors password-generator's
 * crypto.getRandomValues + rejection-sampling discipline (see
 * ../../password-generator/utils/generatePassword.ts), applied to word
 * selection instead of character selection.
 */

import { EFF_LARGE_WORDLIST } from '../data/wordlist';

export interface PassphraseOptions {
  wordCount: number;
  /** '' (none/concatenated), ' ' (space), or '-' (hyphen) — or any custom string. */
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
  includeSymbol: boolean;
}

export interface PassphraseResult {
  passphrase: string;
  entropyBits: number;
}

const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export const WORDLIST_SIZE = EFF_LARGE_WORDLIST.length;
export const BITS_PER_WORD = Math.log2(WORDLIST_SIZE);

/**
 * Uniform random integer in [0, max) via rejection sampling over
 * crypto.getRandomValues — never Math.random(). A naive `value % max`
 * is biased whenever max doesn't evenly divide 2^32 (true for both the
 * 7,776-word list and the digit/symbol pools here), so values in the
 * final, incomplete multiple of `max` are discarded and re-drawn instead
 * of being folded in unevenly.
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

function pickRandomChar(pool: string): string {
  // Safe: getRandomIndex(pool.length) always returns an index within bounds.
  return pool[getRandomIndex(pool.length)]!;
}

function capitalizeWord(word: string): string {
  return word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
}

/** wordCount × log2(wordlist size), plus one log2(pool size) term per optional insertion. */
export function calculatePassphraseEntropy(
  options: Pick<PassphraseOptions, 'wordCount' | 'includeNumber' | 'includeSymbol'>
): number {
  let bits = options.wordCount * BITS_PER_WORD;
  if (options.includeNumber) bits += Math.log2(DIGITS.length);
  if (options.includeSymbol) bits += Math.log2(SYMBOLS.length);
  return bits;
}

export function generatePassphrase(options: PassphraseOptions): PassphraseResult {
  const words: string[] = [];
  for (let i = 0; i < options.wordCount; i += 1) {
    const word = EFF_LARGE_WORDLIST[getRandomIndex(WORDLIST_SIZE)]!;
    words.push(options.capitalize ? capitalizeWord(word) : word);
  }

  let passphrase = words.join(options.separator);

  // Each inserted character goes at its own independently-chosen random
  // position (0..length, inclusive of both ends) within the passphrase as
  // it stands at that point — so with both enabled, the number and symbol
  // can end up anywhere relative to each other and to the words, not
  // pinned to the start/end.
  const extras: string[] = [];
  if (options.includeNumber) extras.push(pickRandomChar(DIGITS));
  if (options.includeSymbol) extras.push(pickRandomChar(SYMBOLS));

  for (const extra of extras) {
    const position = getRandomIndex(passphrase.length + 1);
    passphrase = passphrase.slice(0, position) + extra + passphrase.slice(position);
  }

  return { passphrase, entropyBits: calculatePassphraseEntropy(options) };
}
