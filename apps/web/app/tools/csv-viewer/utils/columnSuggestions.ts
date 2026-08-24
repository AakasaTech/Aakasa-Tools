/**
 * Heuristic "this column looks inconsistent" detection. Deliberately
 * conservative: every suggestion here is surfaced to the user to accept or
 * dismiss, never applied automatically — see `applyColumnSuggestion`, which
 * only ever runs when the user explicitly clicks accept.
 */

import type { CsvGridData } from './csvGridOperations';

export type ColumnSuggestionType = 'inconsistent-casing' | 'inconsistent-date-format';

export interface ColumnSuggestion {
  columnIndex: number;
  type: ColumnSuggestionType;
  message: string;
}

// Detection scans at most this many rows per column — plenty to reliably spot
// a real inconsistency, and keeps detection fast even on a 100k-row file.
const SAMPLE_SIZE = 2000;
// A column only counts as "categorical" (and thus worth a casing suggestion)
// if distinct values are a minority of samples — otherwise a free-text or
// unique-ID column would get flagged for every legitimate casing difference.
const MAX_DISTINCT_RATIO_FOR_CASING = 0.5;
const MIN_SAMPLE_FOR_CASING = 5;

function getColumnSample(data: CsvGridData, columnIndex: number): string[] {
  const values: string[] = [];
  for (let i = 0; i < data.rows.length && values.length < SAMPLE_SIZE; i += 1) {
    const cell = data.rows[i]?.[columnIndex];
    if (cell !== undefined && cell.trim() !== '') {
      values.push(cell.trim());
    }
  }
  return values;
}

function detectInconsistentCasing(values: string[]): string | null {
  if (values.length < MIN_SAMPLE_FOR_CASING) {
    return null;
  }

  const variantsByLowerCase = new Map<string, Set<string>>();
  for (const value of values) {
    const key = value.toLowerCase();
    const variants = variantsByLowerCase.get(key) ?? new Set<string>();
    variants.add(value);
    variantsByLowerCase.set(key, variants);
  }

  const distinctRatio = variantsByLowerCase.size / values.length;
  if (distinctRatio > MAX_DISTINCT_RATIO_FOR_CASING) {
    return null;
  }

  for (const variants of variantsByLowerCase.values()) {
    if (variants.size > 1) {
      const [first, second] = [...variants];
      return `Inconsistent casing found (e.g. "${first}" vs "${second}") — normalize each group to its most common casing?`;
    }
  }

  return null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
const DASH_DATE = /^\d{1,2}-\d{1,2}-\d{4}$/;

function classifyDate(value: string): 'iso' | 'slash' | 'dash' | null {
  if (ISO_DATE.test(value)) return 'iso';
  if (SLASH_DATE.test(value)) return 'slash';
  if (DASH_DATE.test(value)) return 'dash';
  return null;
}

function detectInconsistentDateFormat(values: string[]): string | null {
  const classified = values.map(classifyDate);
  const dateLikeCount = classified.filter((c) => c !== null).length;
  if (dateLikeCount / values.length < 0.6) {
    return null;
  }

  const formatsSeen = new Set(classified.filter((c): c is 'iso' | 'slash' | 'dash' => c !== null));
  if (formatsSeen.size < 2) {
    return null;
  }

  const examples = ['iso', 'slash', 'dash']
    .filter((format) => formatsSeen.has(format as 'iso' | 'slash' | 'dash'))
    .map((format) => values[classified.indexOf(format as 'iso' | 'slash' | 'dash')])
    .join(' and ');

  return `Mixed date formats found (e.g. ${examples}) — normalize to YYYY-MM-DD? Ambiguous slash/dash dates are assumed to be month/day/year.`;
}

export function detectColumnSuggestions(data: CsvGridData): ColumnSuggestion[] {
  const suggestions: ColumnSuggestion[] = [];

  data.headers.forEach((_, columnIndex) => {
    const sample = getColumnSample(data, columnIndex);
    if (sample.length === 0) {
      return;
    }

    const casingMessage = detectInconsistentCasing(sample);
    if (casingMessage) {
      suggestions.push({ columnIndex, type: 'inconsistent-casing', message: casingMessage });
      return;
    }

    const dateMessage = detectInconsistentDateFormat(sample);
    if (dateMessage) {
      suggestions.push({ columnIndex, type: 'inconsistent-date-format', message: dateMessage });
    }
  });

  return suggestions;
}

function applyCasingFix(data: CsvGridData, columnIndex: number): CsvGridData {
  const counts = new Map<string, Map<string, number>>();
  for (const row of data.rows) {
    const cell = row[columnIndex];
    if (cell === undefined || cell.trim() === '') continue;
    const key = cell.trim().toLowerCase();
    const variantCounts = counts.get(key) ?? new Map<string, number>();
    variantCounts.set(cell, (variantCounts.get(cell) ?? 0) + 1);
    counts.set(key, variantCounts);
  }

  const canonicalByKey = new Map<string, string>();
  for (const [key, variantCounts] of counts) {
    let bestVariant = '';
    let bestCount = -1;
    for (const [variant, count] of variantCounts) {
      if (count > bestCount) {
        bestVariant = variant;
        bestCount = count;
      }
    }
    canonicalByKey.set(key, bestVariant);
  }

  return {
    headers: data.headers,
    rows: data.rows.map((row) => {
      const cell = row[columnIndex];
      if (cell === undefined || cell.trim() === '') return row;
      const canonical = canonicalByKey.get(cell.trim().toLowerCase());
      if (canonical === undefined || canonical === cell) return row;
      const next = row.slice();
      next[columnIndex] = canonical;
      return next;
    }),
  };
}

/** Normalizes slash/dash dates (assumed month/day/year) to ISO YYYY-MM-DD. Values that don't match a known date pattern are left untouched. */
function normalizeDateValue(value: string): string {
  const format = classifyDate(value);
  if (format === null || format === 'iso') {
    return value;
  }
  const separator = format === 'slash' ? '/' : '-';
  const parts = value.split(separator);
  const month = parts[0];
  const day = parts[1];
  const year = parts[2];
  if (!month || !day || !year) {
    return value;
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function applyDateFormatFix(data: CsvGridData, columnIndex: number): CsvGridData {
  return {
    headers: data.headers,
    rows: data.rows.map((row) => {
      const cell = row[columnIndex];
      if (cell === undefined) return row;
      const normalized = normalizeDateValue(cell);
      if (normalized === cell) return row;
      const next = row.slice();
      next[columnIndex] = normalized;
      return next;
    }),
  };
}

export function applyColumnSuggestion(data: CsvGridData, suggestion: ColumnSuggestion): CsvGridData {
  if (suggestion.type === 'inconsistent-casing') {
    return applyCasingFix(data, suggestion.columnIndex);
  }
  return applyDateFormatFix(data, suggestion.columnIndex);
}
