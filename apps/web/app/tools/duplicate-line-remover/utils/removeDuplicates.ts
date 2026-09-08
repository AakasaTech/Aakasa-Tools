export interface RemoveDuplicatesOptions {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  ignoreEmptyLines: boolean;
  keepFirst: boolean;
  sortOutput: boolean;
}

export interface RemoveDuplicatesResult {
  result: string;
  totalLines: number;
  uniqueLines: number;
  duplicatesRemoved: number;
}

/** Builds the key used only for duplicate DETECTION — never written back to
 * the output, so a case-insensitive or whitespace-trimmed comparison never
 * mutates the actual surviving line's original text. */
function buildComparisonKey(line: string, caseSensitive: boolean, trimWhitespace: boolean): string {
  let key = line;
  if (trimWhitespace) key = key.trim();
  if (!caseSensitive) key = key.toLowerCase();
  return key;
}

/**
 * Removes duplicate lines from `text`, comparing lines by a normalized key
 * (per `caseSensitive`/`trimWhitespace`) while always keeping the KEPT
 * line's original, untouched text in the output — the comparison key and
 * the output content are deliberately separate values throughout, so a
 * case-insensitive dedupe can never accidentally lowercase a surviving
 * line, and a whitespace-trimmed comparison never strips whitespace from
 * output text that wasn't itself the exact duplicate being removed.
 *
 * `keepFirst`/`keepLast` is resolved with a two-pass approach: first,
 * for each comparison key, find which occurrence (by position among the
 * lines under consideration) should survive — the first-seen position if
 * `keepFirst`, or whichever position was seen last if not. Then a second
 * pass keeps only lines at a surviving position. This naturally keeps
 * BOTH the correct original text (from that exact occurrence) AND the
 * correct output ordering (surviving lines stay in their own original
 * relative order) without needing separate logic for the two modes.
 */
export function removeDuplicateLines(text: string, options: RemoveDuplicatesOptions): RemoveDuplicatesResult {
  const { caseSensitive, trimWhitespace, ignoreEmptyLines, keepFirst, sortOutput } = options;

  if (text.length === 0) {
    return { result: '', totalLines: 0, uniqueLines: 0, duplicatesRemoved: 0 };
  }

  const rawLines = text.split(/\r\n|\r|\n/);
  const totalLines = rawLines.length;

  // Lines that actually participate in dedup comparison — empty/blank
  // lines are excluded entirely when ignoreEmptyLines is on, regardless
  // of the trimWhitespace comparison setting (a whitespace-only line is
  // still "empty" for this purpose).
  const candidateOriginalIndices: number[] = [];
  const candidateKeys: string[] = [];
  rawLines.forEach((line, index) => {
    if (ignoreEmptyLines && line.trim() === '') return;
    candidateOriginalIndices.push(index);
    candidateKeys.push(buildComparisonKey(line, caseSensitive, trimWhitespace));
  });

  const survivingPositionByKey = new Map<string, number>();
  candidateKeys.forEach((key, position) => {
    if (keepFirst) {
      if (!survivingPositionByKey.has(key)) survivingPositionByKey.set(key, position);
    } else {
      survivingPositionByKey.set(key, position);
    }
  });

  const survivingPositions = new Set(survivingPositionByKey.values());
  let keptLines = candidateOriginalIndices
    .filter((_originalIndex, position) => survivingPositions.has(position))
    .map((originalIndex) => rawLines[originalIndex]!);

  if (sortOutput) {
    keptLines = [...keptLines].sort((a, b) => a.localeCompare(b));
  }

  const uniqueLines = keptLines.length;
  const consideredLines = candidateOriginalIndices.length;
  const duplicatesRemoved = consideredLines - uniqueLines;

  return {
    result: keptLines.join('\n'),
    totalLines,
    uniqueLines,
    duplicatesRemoved,
  };
}
