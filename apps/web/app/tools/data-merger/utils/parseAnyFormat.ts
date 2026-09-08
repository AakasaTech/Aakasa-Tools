/**
 * Parses either a CSV or JSON file into a unified `Row[]` (array of plain
 * objects) representation, so the rest of the tool never has to care which
 * format a given file came from. CSV parsing itself is not reimplemented —
 * this delegates to the shared `@aakasa/csv-utils` `csvToJson` (the same
 * wrapper CSV↔JSON Converter, CSV Viewer, and CSV to Excel Converter all
 * use). JSON parsing uses the platform's own `JSON.parse`.
 */

import { csvToJson } from '@aakasa/csv-utils';

export type Row = Record<string, unknown>;

export interface ParsedFile {
  fileName: string;
  rows: Row[];
  /** Column names in first-seen order across every row (a union, since JSON
   * records aren't guaranteed to share identical keys). */
  columns: string[];
  error?: string;
}

function isPlainObject(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unionColumns(rows: Row[]): string[] {
  const seen = new Set<string>();
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
}

function parseJsonFile(fileName: string, text: string): ParsedFile {
  if (!text.trim()) {
    return { fileName, rows: [], columns: [], error: 'No JSON data to parse.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON.';
    return { fileName, rows: [], columns: [], error: `Could not parse JSON: ${message}` };
  }

  const records = Array.isArray(parsed) ? parsed : [parsed];
  if (records.length === 0) {
    return { fileName, rows: [], columns: [], error: 'This JSON file contains no records.' };
  }
  if (!records.every(isPlainObject)) {
    return {
      fileName,
      rows: [],
      columns: [],
      error: 'This JSON must be an array of objects (or a single object) to merge as tabular data.',
    };
  }

  return { fileName, rows: records, columns: unionColumns(records) };
}

function parseCsvFile(fileName: string, text: string): ParsedFile {
  const result = csvToJson(text, { delimiter: 'auto', hasHeader: true, outputShape: 'array-of-objects', typeInference: true });
  if (result.error || !Array.isArray(result.data)) {
    return { fileName, rows: [], columns: [], error: result.error ?? 'Could not parse this file as CSV.' };
  }
  const rows = result.data as Row[];
  return { fileName, rows, columns: result.stats?.headers ?? unionColumns(rows) };
}

/** Dispatches to CSV or JSON parsing based on the file's extension. */
export function parseAnyFormat(fileName: string, text: string): ParsedFile {
  return fileName.toLowerCase().endsWith('.json') ? parseJsonFile(fileName, text) : parseCsvFile(fileName, text);
}

/**
 * Renames columns per a per-file rename map (original name → new name) —
 * lets the user align differently-named-but-equivalent columns (e.g.
 * "email" in one file, "Email Address" in another) before merging. Keys
 * with no rename entry, or an empty/whitespace-only rename, pass through
 * unchanged.
 */
export function renameColumns(rows: Row[], renames: Record<string, string>): Row[] {
  const hasAnyRename = Object.values(renames).some((value) => value.trim() !== '');
  if (!hasAnyRename) return rows;

  return rows.map((row) => {
    const renamed: Row = {};
    for (const [key, value] of Object.entries(row)) {
      const newKey = renames[key]?.trim() || key;
      renamed[newKey] = value;
    }
    return renamed;
  });
}
