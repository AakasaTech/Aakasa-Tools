/**
 * Pure pattern-matching weakness detection — no DOM, no React, no network.
 * Entropy math alone can't tell "kX9#mQ2!" apart from "password123" if
 * they happen to land on similar bit counts, even though the second is
 * trivially guessable by anyone who's seen a leaked-password list. This
 * catches the specific, well-known classes of weakness that raw entropy
 * scoring misses: sequential runs, keyboard-adjacent runs, repeated
 * characters, and leetspeak substitutions of common weak words.
 */

export interface WeaknessPattern {
  pattern: string;
  description: string;
}

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

const LEETSPEAK_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  '5': 's',
  '$': 's',
  '7': 't',
};

// A modest, illustrative list of very common weak passwords/dictionary
// words — not an exhaustive breach-corpus lookup, just enough to catch the
// obvious, frequently-reused cases.
const COMMON_WEAK_WORDS = [
  'password',
  'letmein',
  'welcome',
  'admin',
  'qwerty',
  'dragon',
  'monkey',
  'football',
  'baseball',
  'master',
  'login',
  'princess',
  'sunshine',
  'iloveyou',
  'trustno1',
  'starwars',
  'freedom',
  'whatever',
  'shadow',
  'superman',
  'batman',
  'abc123',
  'admin123',
];

function isLetter(ch: string): boolean {
  return ch >= 'a' && ch <= 'z';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function sameClass(a: string, b: string): boolean {
  return (isLetter(a) && isLetter(b)) || (isDigit(a) && isDigit(b));
}

/** Maximal ascending or descending runs of same-class (letters-only or
 * digits-only) characters, e.g. "abc", "cba", "789". */
function findSequentialRuns(password: string, minLength = 3): string[] {
  const lower = password.toLowerCase();
  const found: string[] = [];
  let i = 0;

  while (i < lower.length) {
    let runEnd = i;
    let direction = 0;

    while (runEnd + 1 < lower.length && sameClass(lower[runEnd]!, lower[runEnd + 1]!)) {
      const diff = lower.charCodeAt(runEnd + 1) - lower.charCodeAt(runEnd);
      if (direction === 0 && (diff === 1 || diff === -1)) {
        direction = diff;
      } else if (diff !== direction) {
        break;
      }
      runEnd += 1;
    }

    const runLength = runEnd - i + 1;
    if (runLength >= minLength) {
      found.push(lower.slice(i, runEnd + 1));
    }
    i = runEnd + 1;
  }

  return found;
}

/** Maximal runs that appear as a contiguous substring of a keyboard row,
 * forwards or backwards, e.g. "qwerty", "asdf", "poiuy". */
function findKeyboardRuns(password: string, minLength = 3): string[] {
  const lower = password.toLowerCase();
  const rows = [...KEYBOARD_ROWS, ...KEYBOARD_ROWS.map((row) => [...row].reverse().join(''))];
  const found: string[] = [];
  let i = 0;

  while (i <= lower.length - minLength) {
    let matchLength = 0;
    for (let len = lower.length - i; len >= minLength; len -= 1) {
      const candidate = lower.slice(i, i + len);
      if (rows.some((row) => row.includes(candidate))) {
        matchLength = len;
        break;
      }
    }
    if (matchLength > 0) {
      found.push(lower.slice(i, i + matchLength));
      i += matchLength;
    } else {
      i += 1;
    }
  }

  return found;
}

/** Maximal runs of the same character repeated, e.g. "aaa", "1111". */
function findRepeatedRuns(password: string, minLength = 3): string[] {
  const found: string[] = [];
  let i = 0;

  while (i < password.length) {
    let runEnd = i;
    while (runEnd + 1 < password.length && password[runEnd + 1] === password[i]) {
      runEnd += 1;
    }
    const runLength = runEnd - i + 1;
    if (runLength >= minLength) {
      found.push(password.slice(i, runEnd + 1));
    }
    i = runEnd + 1;
  }

  return found;
}

function normalizeLeetspeak(password: string): string {
  return [...password.toLowerCase()].map((ch) => LEETSPEAK_MAP[ch] ?? ch).join('');
}

/**
 * Common weak words — matched directly against the lowercase password
 * first (a plain, unobfuscated match), and separately against the
 * leetspeak-normalized form (so "p@ssw0rd" is caught via its normalized
 * "password"). Kept distinct so the resulting description is accurate:
 * a password that already spells the word out doesn't need to claim a
 * "substitution" that never happened.
 */
function findCommonWordMatches(password: string): { word: string; viaSubstitution: boolean }[] {
  const lower = password.toLowerCase();
  const normalized = normalizeLeetspeak(password);
  const found: { word: string; viaSubstitution: boolean }[] = [];

  for (const word of COMMON_WEAK_WORDS) {
    if (lower.includes(word)) {
      found.push({ word, viaSubstitution: false });
    } else if (normalized.includes(word)) {
      found.push({ word, viaSubstitution: true });
    }
  }

  return found;
}

export function detectPatterns(password: string): WeaknessPattern[] {
  if (!password) return [];

  const results: WeaknessPattern[] = [];

  for (const run of findSequentialRuns(password)) {
    results.push({ pattern: run, description: `"${run}" is a sequential run of characters — easy to guess.` });
  }
  for (const run of findKeyboardRuns(password)) {
    results.push({ pattern: run, description: `"${run}" is a run of keyboard-adjacent keys — easy to guess.` });
  }
  for (const run of findRepeatedRuns(password)) {
    results.push({ pattern: run, description: `"${run}" repeats the same character, adding little real randomness.` });
  }
  for (const { word, viaSubstitution } of findCommonWordMatches(password)) {
    results.push({
      pattern: word,
      description: viaSubstitution
        ? `Looks like the common word "${word}" with letter/number substitutions (leetspeak) — a well-known trick attackers check for first.`
        : `Contains the common, easily-guessed word "${word}".`,
    });
  }

  return results;
}
