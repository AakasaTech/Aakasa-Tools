/**
 * Line/word/char diffing, wrapping the `diff` package (Myers diff algorithm)
 * rather than hand-rolling one.
 *
 * How "granularity" maps to the library, confirmed empirically (see the
 * Node scripts run before writing this file — diffLines/diffWords/diffChars
 * all return `{ count, added, removed, value }[]`, and both diffLines and
 * diffWords/diffChars honor `ignoreCase` natively; `ignoreWhitespace` only
 * has an effect on diffLines — it's a no-op on diffChars, and diffWords
 * already tokenizes on whitespace so it's largely redundant there too):
 *
 * - Line granularity: a plain diffLines call. Each row is wholly added,
 *   removed, or unchanged — no inline highlighting within a row.
 * - Word/char granularity: diffLines still supplies the outer line
 *   structure (so line numbers and left/right alignment stay correct for
 *   every case, including insertions and deletions interspersed through a
 *   multi-line input), but wherever diffLines pairs a run of removed lines
 *   with a run of added lines (a "changed block"), each removed/added line
 *   pair is re-diffed with diffWords/diffChars to highlight exactly what
 *   changed inside that line. This also produces the right behavior for
 *   single-line/prose input (the case the granularity selector's FAQ entry
 *   calls out): with one line on each side, diffLines yields exactly one
 *   removed line + one added line, so the word/char re-diff on that pair is
 *   equivalent to just running diffWords/diffChars on the whole input.
 *   The tradeoff: a sentence that got split across two lines won't have its
 *   words correlated across that line boundary — an accepted edge case in
 *   exchange for guaranteed line-level alignment everywhere else.
 *
 * ignoreWhitespace is applied as an explicit normalization pass (trim each
 * line, collapse internal whitespace runs to a single space) before
 * diffing, rather than relying on the library's own option — that keeps its
 * effect identical and predictable across all three granularities, instead
 * of doing nothing for char-level and very little for word-level.
 *
 * ignoreCase is NOT passed as the library's own `{ ignoreCase }` option —
 * confirmed empirically that doing so makes an "unchanged" chunk's `.value`
 * collapse onto whichever side's casing the library happens to keep (the
 * second/"changed" argument's casing, in every case tested), so the
 * Original pane would silently render the Changed text's casing for any
 * line that only differs by case. Instead, structure is computed by diffing
 * lowercased copies of the text, and the resulting segment lengths are used
 * to slice the TRUE-case substrings back out of the real original/changed
 * strings — each side always displays its own actual casing.
 */

import { diffChars, diffLines, diffWords } from 'diff';

export type Granularity = 'line' | 'word' | 'char';

export interface DiffOptions {
  granularity: Granularity;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export type SegmentType = 'added' | 'removed' | 'unchanged';

export interface DiffSegment {
  type: SegmentType;
  value: string;
}

export type RowType = 'unchanged' | 'added' | 'removed' | 'modified';

export interface DiffRow {
  type: RowType;
  originalLineNumber: number | null;
  changedLineNumber: number | null;
  originalSegments: DiffSegment[];
  changedSegments: DiffSegment[];
}

export interface DiffStats {
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  linesUnchanged: number;
  wordsAdded: number;
  wordsRemoved: number;
  wordsUnchanged: number;
}

export interface DiffResult {
  rows: DiffRow[];
  stats: DiffStats;
}

function normalizeWhitespace(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .join('\n');
}

/** Splits a diff chunk's value into lines, dropping the trailing empty
 * string that `.split('\n')` produces when the value ends with `\n` (that's
 * the line terminator, not an extra blank line). */
function splitLines(value: string): string[] {
  const lines = value.split('\n');
  if (value.endsWith('\n')) {
    lines.pop();
  }
  return lines;
}

function countWords(text: string): number {
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

interface LineChange {
  added?: boolean;
  removed?: boolean;
  value: string;
}

/** Re-diffs one removed line against one added line at word/char level and
 * splits the result into the segments each side of the row should show.
 * When ignoreCase is on, the diff is computed on lowercased copies (for
 * structure only) and the true-case substrings are sliced back out of the
 * real removedLine/addedLine by matching segment lengths, so each side
 * keeps displaying its own actual casing rather than borrowing the other
 * side's. This relies on `toLowerCase()` preserving string length, true for
 * the code/prose text this tool is built for. */
function diffLinePair(
  removedLine: string,
  addedLine: string,
  granularity: 'word' | 'char',
  ignoreCase: boolean,
): { originalSegments: DiffSegment[]; changedSegments: DiffSegment[] } {
  const compareRemoved = ignoreCase ? removedLine.toLowerCase() : removedLine;
  const compareAdded = ignoreCase ? addedLine.toLowerCase() : addedLine;
  const fineDiff = granularity === 'word' ? diffWords(compareRemoved, compareAdded) : diffChars(compareRemoved, compareAdded);

  const originalSegments: DiffSegment[] = [];
  const changedSegments: DiffSegment[] = [];
  let originalCursor = 0;
  let changedCursor = 0;

  for (const change of fineDiff) {
    const length = change.value.length;
    if (change.removed) {
      originalSegments.push({ type: 'removed', value: removedLine.slice(originalCursor, originalCursor + length) });
      originalCursor += length;
    } else if (change.added) {
      changedSegments.push({ type: 'added', value: addedLine.slice(changedCursor, changedCursor + length) });
      changedCursor += length;
    } else {
      originalSegments.push({ type: 'unchanged', value: removedLine.slice(originalCursor, originalCursor + length) });
      changedSegments.push({ type: 'unchanged', value: addedLine.slice(changedCursor, changedCursor + length) });
      originalCursor += length;
      changedCursor += length;
    }
  }

  return { originalSegments, changedSegments };
}

export function computeDiff(original: string, changed: string, options: DiffOptions): DiffResult {
  const workingOriginal = options.ignoreWhitespace ? normalizeWhitespace(original) : original;
  const workingChanged = options.ignoreWhitespace ? normalizeWhitespace(changed) : changed;

  // True-case line arrays, sliced from below by count so display never
  // borrows the other side's casing (see the ignoreCase note at the top of
  // this file).
  const originalLinesArr = splitLines(workingOriginal.endsWith('\n') || workingOriginal === '' ? workingOriginal : `${workingOriginal}\n`);
  const changedLinesArr = splitLines(workingChanged.endsWith('\n') || workingChanged === '' ? workingChanged : `${workingChanged}\n`);

  const compareOriginal = options.ignoreCase ? workingOriginal.toLowerCase() : workingOriginal;
  const compareChanged = options.ignoreCase ? workingChanged.toLowerCase() : workingChanged;

  const lineChanges = diffLines(compareOriginal, compareChanged) as LineChange[];

  const rows: DiffRow[] = [];
  let originalLineNumber = 0;
  let changedLineNumber = 0;

  let i = 0;
  while (i < lineChanges.length) {
    const chunk = lineChanges[i];
    if (!chunk) break;

    if (!chunk.added && !chunk.removed) {
      const count = splitLines(chunk.value).length;
      for (let n = 0; n < count; n += 1) {
        originalLineNumber += 1;
        changedLineNumber += 1;
        const originalLine = originalLinesArr[originalLineNumber - 1] ?? '';
        const changedLine = changedLinesArr[changedLineNumber - 1] ?? '';
        rows.push({
          type: 'unchanged',
          originalLineNumber,
          changedLineNumber,
          originalSegments: [{ type: 'unchanged', value: originalLine }],
          changedSegments: [{ type: 'unchanged', value: changedLine }],
        });
      }
      i += 1;
      continue;
    }

    // A changed block: a run of removed lines optionally followed by a run
    // of added lines (the `diff` package always emits removed before added
    // for the same block).
    const removedCount = chunk.removed ? splitLines(chunk.value).length : 0;
    const nextChunk = chunk.removed ? lineChanges[i + 1] : undefined;
    const addedChunk = chunk.added ? chunk : nextChunk?.added ? nextChunk : undefined;
    const addedCount = addedChunk ? splitLines(addedChunk.value).length : 0;
    const removedLines = originalLinesArr.slice(originalLineNumber, originalLineNumber + removedCount);
    const addedLines = changedLinesArr.slice(changedLineNumber, changedLineNumber + addedCount);
    i += chunk.removed && addedChunk ? 2 : 1;

    const pairCount = options.granularity === 'line' ? 0 : Math.min(removedLines.length, addedLines.length);

    for (let p = 0; p < pairCount; p += 1) {
      const removedLine = removedLines[p] ?? '';
      const addedLine = addedLines[p] ?? '';
      originalLineNumber += 1;
      changedLineNumber += 1;
      const { originalSegments, changedSegments } = diffLinePair(removedLine, addedLine, options.granularity as 'word' | 'char', options.ignoreCase);
      rows.push({
        type: 'modified',
        originalLineNumber,
        changedLineNumber,
        originalSegments,
        changedSegments,
      });
    }

    for (let r = pairCount; r < removedLines.length; r += 1) {
      originalLineNumber += 1;
      rows.push({
        type: 'removed',
        originalLineNumber,
        changedLineNumber: null,
        originalSegments: [{ type: 'removed', value: removedLines[r] ?? '' }],
        changedSegments: [],
      });
    }

    for (let a = pairCount; a < addedLines.length; a += 1) {
      changedLineNumber += 1;
      rows.push({
        type: 'added',
        originalLineNumber: null,
        changedLineNumber,
        originalSegments: [],
        changedSegments: [{ type: 'added', value: addedLines[a] ?? '' }],
      });
    }
  }

  const stats: DiffStats = {
    linesAdded: 0,
    linesRemoved: 0,
    linesModified: 0,
    linesUnchanged: 0,
    wordsAdded: 0,
    wordsRemoved: 0,
    wordsUnchanged: 0,
  };

  for (const row of rows) {
    if (row.type === 'added') stats.linesAdded += 1;
    else if (row.type === 'removed') stats.linesRemoved += 1;
    else if (row.type === 'modified') stats.linesModified += 1;
    else stats.linesUnchanged += 1;

    for (const segment of row.originalSegments) {
      if (segment.type === 'removed') stats.wordsRemoved += countWords(segment.value);
      else if (segment.type === 'unchanged') stats.wordsUnchanged += countWords(segment.value);
    }
    for (const segment of row.changedSegments) {
      if (segment.type === 'added') stats.wordsAdded += countWords(segment.value);
    }
  }

  return { rows, stats };
}

function rowOriginalText(row: DiffRow): string {
  return row.originalSegments.map((segment) => segment.value).join('');
}

function rowChangedText(row: DiffRow): string {
  return row.changedSegments.map((segment) => segment.value).join('');
}

/** Formats a DiffResult as a plain unified diff (git-style +/- prefixes),
 * suitable for copying into a code review comment or downloading as a
 * .diff/.patch file. A 'modified' row (word/char-level highlighting within
 * one line) unpacks into a removed line followed by an added line, since
 * the unified diff format has no concept of inline highlighting. */
export function formatUnifiedDiff(diffResult: DiffResult): string {
  const lines: string[] = [];
  for (const row of diffResult.rows) {
    if (row.type === 'unchanged') {
      lines.push(`  ${rowOriginalText(row)}`);
    } else if (row.type === 'added') {
      lines.push(`+ ${rowChangedText(row)}`);
    } else if (row.type === 'removed') {
      lines.push(`- ${rowOriginalText(row)}`);
    } else {
      lines.push(`- ${rowOriginalText(row)}`);
      lines.push(`+ ${rowChangedText(row)}`);
    }
  }
  return lines.join('\n');
}
