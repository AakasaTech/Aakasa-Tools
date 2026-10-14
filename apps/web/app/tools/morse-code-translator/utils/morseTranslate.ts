import { CHAR_TO_MORSE, MORSE_TO_CHAR } from './morseMap';

/** The standard ITU "error" prosign (eight dots) — used here to mark a
 * character with no Morse mapping, so it's visibly flagged inline rather
 * than silently dropped from the output. */
const UNRECOGNIZED_MARKER = '........';

/**
 * Converts text to Morse code: letters within a word separated by a single
 * space, words separated by " / ". Characters with no Morse mapping
 * (anything outside A-Z, 0-9, and the supported punctuation) are replaced
 * with the standard 8-dot error prosign, rather than silently dropped.
 */
export function textToMorse(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word) =>
      [...word.toUpperCase()]
        .map((char) => CHAR_TO_MORSE[char] ?? UNRECOGNIZED_MARKER)
        .join(' ')
    )
    .join(' / ');
}

export interface MorseToTextResult {
  result: string;
  /** The raw, unrecognized Morse token(s) encountered, in order. */
  unrecognized: string[];
}

/**
 * Converts Morse code back to text. Words are separated by "/" (the
 * convention this tool's own encoder produces); if no "/" is present, a
 * run of two or more spaces is treated as a word boundary instead, as a
 * common alternative convention. Within a word, letters are separated by
 * single spaces. Any token that isn't valid dots/dashes, or doesn't match
 * a known character, is left in the output wrapped in `[...]` and also
 * collected into `unrecognized` — never silently dropped, never a crash.
 */
export function morseToText(morse: string): MorseToTextResult {
  const trimmed = morse.trim();
  if (!trimmed) {
    return { result: '', unrecognized: [] };
  }

  const wordTokens = trimmed.includes('/') ? trimmed.split('/') : trimmed.split(/ {2,}/);

  const unrecognized: string[] = [];

  const words = wordTokens.map((wordToken) => {
    const letterTokens = wordToken.trim().split(/\s+/).filter(Boolean);
    return letterTokens
      .map((token) => {
        if (!/^[.-]+$/.test(token)) {
          unrecognized.push(token);
          return `[${token}]`;
        }
        const char = MORSE_TO_CHAR[token];
        if (char === undefined) {
          unrecognized.push(token);
          return `[${token}]`;
        }
        return char;
      })
      .join('');
  });

  return { result: words.join(' '), unrecognized };
}
