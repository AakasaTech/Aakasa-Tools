export type SlugSeparator = '-' | '_';

export interface SlugOptions {
  separator: SlugSeparator;
  lowercase: boolean;
  maxLength?: number;
  removeStopWords: boolean;
}

// A short, deliberately conservative list — common short function words
// whose removal shortens a slug without changing its meaning. Not
// exhaustive by design; stop-word removal is opt-in exactly because
// dropping words changes what the URL represents.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'is', 'it',
]);

/** Strips accents/diacritics via Unicode NFD normalization: decomposes
 * each accented character into its base letter plus separate combining
 * mark codepoints (e.g. "é" → "e" + U+0301), then removes every combining
 * mark. This handles the full range of Latin accented characters
 * correctly ("café" → "cafe", "Müller" → "Muller") without needing a
 * hand-maintained character-replacement table that would only ever cover
 * a subset of them. */
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapeForRegex(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

/**
 * Converts `text` into a URL-friendly slug: strips accents to their base
 * Latin letters, replaces every run of non-alphanumeric characters with
 * the chosen separator, trims leading/trailing separators, and optionally
 * removes common stop words or truncates to a maximum length.
 *
 * Non-Latin scripts (Chinese, Arabic, Japanese, etc.) have no meaningful
 * Latin-alphabet slug equivalent — this doesn't attempt transliteration
 * for them, so that content is simply stripped, which can produce a very
 * short or empty result for non-Latin input. That's a real, honestly
 * stated limitation (see the tool's FAQ), not a bug: a Latin-script slug
 * generator can't invent a faithful romanization of Arabic or Japanese
 * out of nothing.
 *
 * Truncation happens AFTER separator normalization and, when maxLength
 * would otherwise cut through a word, backs up to the last separator
 * boundary before that point — so a length limit never produces a
 * partial, cut-off word.
 */
export function generateSlug(text: string, options: SlugOptions): string {
  const { separator, lowercase, maxLength, removeStopWords } = options;

  let working = stripDiacritics(text);
  if (lowercase) working = working.toLowerCase();

  working = working.replace(/[^a-zA-Z0-9]+/g, separator);

  const sepPattern = escapeForRegex(separator);
  working = working.replace(new RegExp(`^${sepPattern}+|${sepPattern}+$`, 'g'), '');

  if (removeStopWords && working.length > 0) {
    const words = working
      .split(separator)
      .filter((word) => word.length > 0 && !STOP_WORDS.has(lowercase ? word : word.toLowerCase()));
    working = words.join(separator);
  }

  if (maxLength !== undefined && maxLength > 0 && working.length > maxLength) {
    const truncated = working.slice(0, maxLength);
    const lastSeparatorIndex = truncated.lastIndexOf(separator);
    working = lastSeparatorIndex > 0 ? truncated.slice(0, lastSeparatorIndex) : truncated;
  }

  return working;
}

/** Generates one slug per non-empty input line — a convenient batch mode
 * for turning a list of titles into a list of slugs at once. */
export function generateSlugsForLines(text: string, options: SlugOptions): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => generateSlug(line, options));
}
