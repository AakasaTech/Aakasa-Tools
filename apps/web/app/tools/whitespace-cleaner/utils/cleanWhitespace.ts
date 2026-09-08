export type BlankLineHandling = 'none' | 'collapse' | 'removeAll';
export type TabHandling = 'none' | 'remove' | 'convert';

export interface CleaningOptions {
  normalizeLineEndings: boolean;
  trimLines: boolean;
  collapseSpaces: boolean;
  blankLineHandling: BlankLineHandling;
  /** Used only when blankLineHandling is 'collapse'. */
  maxConsecutiveBlankLines: number;
  removeLineBreaks: boolean;
  removeInvisibleChars: boolean;
  tabHandling: TabHandling;
  /** Used only when tabHandling is 'convert'. */
  tabSpaceCount: number;
}

/** Non-breaking space — converted to a regular space, not stripped
 * entirely, since it visually occupies a character position (unlike the
 * zero-width characters below). A common invisible artifact from
 * copy-pasting out of web pages and Word documents. */
export const NON_BREAKING_SPACE = ' ';

/** Zero-width characters targeted by "remove invisible characters" — a
 * small, well-known set rather than an attempt at exhaustive Unicode
 * whitespace coverage. Each is fully removed (not replaced with a
 * regular space), since they carry no visible width to begin with. */
export const ZERO_WIDTH_CHARACTERS: { char: string; name: string }[] = [
  { char: '​', name: 'Zero-width space (U+200B)' },
  { char: '‌', name: 'Zero-width non-joiner (U+200C)' },
  { char: '‍', name: 'Zero-width joiner (U+200D)' },
  { char: '﻿', name: 'Zero-width no-break space / BOM (U+FEFF)' },
  { char: '⁠', name: 'Word joiner (U+2060)' },
];

function removeInvisibleCharacters(text: string): string {
  let result = text.split(NON_BREAKING_SPACE).join(' ');
  for (const { char } of ZERO_WIDTH_CHARACTERS) {
    result = result.split(char).join('');
  }
  return result;
}

/**
 * Applies each enabled cleaning operation to `text`, in an order chosen
 * so later steps see consistent input from earlier ones:
 *
 * 1. Line-ending normalization (\r\n and \r → \n) — applied whenever the
 *    toggle is on, AND whenever any line-structure-based option below
 *    needs it (trimming per line, blank-line handling, or joining
 *    everything into one line): splitting text into "lines" on a single
 *    delimiter first is what makes those operations behave correctly on
 *    mixed-line-ending input rather than leaving stray \r characters
 *    embedded mid-line. Pure character-level operations (space
 *    collapsing, invisible-character removal, tab handling) don't need
 *    this and run on the raw text either way.
 * 2. Invisible/zero-width character removal.
 * 3. Tab handling (remove, or convert to a fixed number of spaces).
 * 4. Per-line trimming.
 * 5. Consecutive-space collapsing.
 * 6. Blank-line handling (collapse to a max, or remove entirely) — the UI
 *    treats these as mutually exclusive; this function just does whichever
 *    one `blankLineHandling` names.
 * 7. Removing all line breaks (joining into one line) — applied last,
 *    since it supersedes whatever blank-line handling did above.
 */
export function cleanText(text: string, options: CleaningOptions): string {
  let result = text;

  const needsLineSplitting = options.trimLines || options.blankLineHandling !== 'none' || options.removeLineBreaks;
  if (options.normalizeLineEndings || needsLineSplitting) {
    result = result.replace(/\r\n|\r/g, '\n');
  }

  if (options.removeInvisibleChars) {
    result = removeInvisibleCharacters(result);
  }

  if (options.tabHandling === 'remove') {
    result = result.replace(/\t/g, '');
  } else if (options.tabHandling === 'convert') {
    result = result.replace(/\t/g, ' '.repeat(Math.max(1, Math.floor(options.tabSpaceCount) || 1)));
  }

  if (options.trimLines) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  if (options.collapseSpaces) {
    result = result.replace(/ {2,}/g, ' ');
  }

  if (options.blankLineHandling === 'removeAll') {
    result = result
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .join('\n');
  } else if (options.blankLineHandling === 'collapse') {
    const maxBlank = Math.max(0, Math.floor(options.maxConsecutiveBlankLines));
    const lines = result.split('\n');
    const collapsed: string[] = [];
    let blankRun = 0;
    for (const line of lines) {
      if (line.trim().length === 0) {
        blankRun += 1;
        if (blankRun <= maxBlank) collapsed.push(line);
      } else {
        blankRun = 0;
        collapsed.push(line);
      }
    }
    result = collapsed.join('\n');
  }

  if (options.removeLineBreaks) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(' ');
  }

  return result;
}
