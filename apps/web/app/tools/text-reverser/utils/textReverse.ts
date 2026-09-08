/**
 * `Array.from(text)` (equivalently, the spread operator `[...text]`)
 * iterates by Unicode CODE POINT, not UTF-16 code unit — unlike
 * `text.split('')`, which splits by code unit and breaks apart any
 * character outside the Basic Multilingual Plane (most emoji included,
 * since they're represented as a surrogate PAIR of two code units). A
 * naive `split('').reverse().join('')` reverses the two halves of such a
 * pair independently, corrupting the character. Every function here goes
 * through this code-point-correct path instead.
 */
export function reverseCharacters(text: string): string {
  return Array.from(text).reverse().join('');
}

function reverseWordsInLine(line: string): string {
  return line
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .reverse()
    .join(' ');
}

/** Reverses the ORDER of words on each line, keeping each word itself
 * intact — "Hello World" becomes "World Hello". Processed line by line so
 * multi-line input keeps its line structure rather than being collapsed
 * into one line. */
export function reverseWordOrder(text: string): string {
  return text
    .split(/\r\n|\r|\n/)
    .map(reverseWordsInLine)
    .join('\n');
}

/** Reverses the letters WITHIN each word while leaving word order and all
 * original whitespace exactly as it was — "Hello World" becomes
 * "olleH dlroW". A "word" here is any run of non-whitespace characters,
 * so attached punctuation reverses along with it (e.g. "Hello," becomes
 * ",olleH"), which is the simplest, most predictable rule to explain. */
export function reverseEachWord(text: string): string {
  return text.replace(/\S+/g, (word) => reverseCharacters(word));
}

/** Matches "letter or number" in the Unicode-aware sense (via the `\p{}`
 * property escapes, which need the `u` flag) — used to strip punctuation/
 * spaces for the relaxed palindrome check rather than a plain [a-z0-9]
 * class, which would incorrectly reject accented or non-Latin letters. */
const ALPHANUMERIC_PATTERN = /[\p{L}\p{N}]/u;

/**
 * Checks whether `text` reads the same forwards and backwards.
 *
 * Strict mode compares the raw input directly against its own
 * Unicode-correct reversal — spacing, punctuation, and case all matter,
 * so "A man, a plan, a canal: Panama" is NOT a palindrome under strict
 * comparison (its reversal starts with "amanaP", not "A man").
 *
 * Relaxed mode (the default) first strips everything that isn't a letter
 * or number and lowercases what's left, then compares THAT against its
 * own reversal — matching the everyday, human sense of "palindrome" that
 * ignores spacing/punctuation/case, under which "A man, a plan, a canal:
 * Panama" IS a palindrome. An input that normalizes to nothing (e.g. pure
 * punctuation) is never considered a palindrome — there's nothing
 * meaningful to compare.
 */
export function isPalindrome(text: string, strict: boolean): boolean {
  if (strict) {
    return text === reverseCharacters(text);
  }

  const normalized = Array.from(text.toLowerCase())
    .filter((ch) => ALPHANUMERIC_PATTERN.test(ch))
    .join('');

  if (normalized.length === 0) return false;

  return normalized === reverseCharacters(normalized);
}
