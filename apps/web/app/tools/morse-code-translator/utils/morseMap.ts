/**
 * Standard International Morse code (ITU-R M.1677-1): the 26 Latin
 * letters, 10 digits, and common punctuation. Independently
 * cross-verified letter-by-letter against Wikipedia's Morse code
 * reference and a separately-published Morse translator package's own
 * character table before being hand-typed here — parentheses in
 * particular are easy to mix up (`(` is 5 symbols, `)` is 6, one extra
 * trailing dash) and were double-checked specifically.
 */
export const CHAR_TO_MORSE: Readonly<Record<string, string>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

export const MORSE_TO_CHAR: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(CHAR_TO_MORSE).map(([char, morse]) => [morse, char])
);

/** Ordered for a readable reference chart: letters, then digits, then punctuation. */
export const REFERENCE_CHART: readonly { char: string; morse: string }[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => ({ char, morse: CHAR_TO_MORSE[char]! })),
  ...'0123456789'.split('').map((char) => ({ char, morse: CHAR_TO_MORSE[char]! })),
  ...[".", ',', '?', "'", '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@'].map((char) => ({
    char,
    morse: CHAR_TO_MORSE[char]!,
  })),
];
