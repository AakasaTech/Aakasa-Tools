/**
 * Pure grid-mutation logic for the CSV Viewer & Cleaner tool. No React, no
 * DOM — every function takes a `CsvGridData` in and returns a new one out
 * (nothing is mutated in place), so the undo stack can just keep prior
 * snapshots by reference rather than needing to clone defensively itself.
 *
 * Row/column identity is positional (array index), not by any stable id —
 * simpler and sufficient here since every operation that reorders or
 * removes rows/columns returns a brand new array anyway, and the component
 * clears row selection after any such operation rather than trying to
 * track identity across a resort or filter.
 */

import Papa from 'papaparse';
import { csvToJson } from '@aakasa/csv-utils';

export interface CsvGridData {
  headers: string[];
  rows: string[][];
}

export interface ParseCsvGridResult {
  data: CsvGridData | null;
  error?: string;
  rowCount?: number;
}

/**
 * Parses raw CSV/TSV text into grid data by reusing the shared
 * `@aakasa/csv-utils` `csvToJson` wrapper around PapaParse — deliberately
 * not a second PapaParse integration. Delimiter is auto-detected (covers
 * comma, tab, semicolon, pipe) and type inference is off so every cell
 * stays the exact string it was in the source file (a numeric-looking ID
 * like "0042" must round-trip unchanged through edit + re-export).
 */
export function parseCsvGrid(csvText: string): ParseCsvGridResult {
  const result = csvToJson(csvText, {
    delimiter: 'auto',
    hasHeader: true,
    outputShape: 'array-of-arrays',
    typeInference: false,
  });

  if (result.error || !result.stats) {
    return { data: null, error: result.error ?? 'Could not parse this file as CSV.' };
  }

  const rows = (result.data as string[][] | null) ?? [];
  return {
    data: { headers: result.stats.headers, rows },
    rowCount: result.stats.rowCount,
  };
}

/** Re-serializes grid data back into CSV text, correctly quoting cells that contain commas, quotes, or newlines. */
export function serializeCsvGrid(data: CsvGridData): string {
  return Papa.unparse({ fields: data.headers, data: data.rows });
}

/**
 * Converts current grid state to JSON using the same `csvToJson` shape as
 * CSV↔JSON Converter (round-tripping through CSV text) rather than mapping
 * headers/rows to objects independently here — keeps the two tools'
 * "array of objects" output identical rather than two subtly different
 * implementations drifting apart over time.
 */
export function gridToJson(data: CsvGridData): unknown {
  const csvText = serializeCsvGrid(data);
  const result = csvToJson(csvText, {
    delimiter: ',',
    hasHeader: true,
    outputShape: 'array-of-objects',
    typeInference: false,
  });
  return result.data;
}

function isEmptyCell(value: string | undefined): boolean {
  return (value ?? '').trim() === '';
}

export function countEmptyCells(data: CsvGridData): number {
  let count = 0;
  for (const row of data.rows) {
    for (let col = 0; col < data.headers.length; col += 1) {
      if (isEmptyCell(row[col])) {
        count += 1;
      }
    }
  }
  return count;
}

/** Trims leading/trailing whitespace from every cell in every row (headers are untouched). */
export function trimWhitespace(data: CsvGridData): CsvGridData {
  return { headers: data.headers, rows: data.rows.map((row) => row.map((cell) => cell.trim())) };
}

/** Trims leading/trailing whitespace from every value in a single column. */
export function trimColumnWhitespace(data: CsvGridData, columnIndex: number): CsvGridData {
  return {
    headers: data.headers,
    rows: data.rows.map((row) => {
      if (columnIndex >= row.length) {
        return row;
      }
      const next = row.slice();
      next[columnIndex] = (row[columnIndex] ?? '').trim();
      return next;
    }),
  };
}

/** Removes rows where every cell is empty (or whitespace-only). */
export function removeEmptyRows(data: CsvGridData): CsvGridData {
  return { headers: data.headers, rows: data.rows.filter((row) => !row.every((cell) => isEmptyCell(cell))) };
}

/** Removes columns where every row's value in that position is empty (or whitespace-only). */
export function removeEmptyColumns(data: CsvGridData): CsvGridData {
  const keepIndices = data.headers
    .map((_, columnIndex) => columnIndex)
    .filter((columnIndex) => !data.rows.every((row) => isEmptyCell(row[columnIndex])));

  return {
    headers: keepIndices.map((index) => data.headers[index]!),
    rows: data.rows.map((row) => keepIndices.map((index) => row[index] ?? '')),
  };
}

export interface DuplicateRowsResult {
  /** Indices (into the current row array) of duplicate occurrences — the first occurrence of each duplicate value is kept out of this list. */
  duplicateIndices: number[];
}

/** Finds duplicate rows by whole-row exact match. Detection only — does not remove anything. */
export function findDuplicateRows(data: CsvGridData): DuplicateRowsResult {
  const seen = new Map<string, number>();
  const duplicateIndices: number[] = [];

  data.rows.forEach((row, index) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicateIndices.push(index);
    } else {
      seen.set(key, index);
    }
  });

  return { duplicateIndices };
}

/** Removes rows at the given indices. Generic enough to power both "delete selected rows" and "remove duplicates". */
export function removeRows(data: CsvGridData, indices: number[]): CsvGridData {
  if (indices.length === 0) {
    return data;
  }
  const toRemove = new Set(indices);
  return { headers: data.headers, rows: data.rows.filter((_, index) => !toRemove.has(index)) };
}

export function removeColumn(data: CsvGridData, columnIndex: number): CsvGridData {
  return {
    headers: data.headers.filter((_, index) => index !== columnIndex),
    rows: data.rows.map((row) => row.filter((_, index) => index !== columnIndex)),
  };
}

export function renameColumn(data: CsvGridData, columnIndex: number, newName: string): CsvGridData {
  const headers = data.headers.slice();
  headers[columnIndex] = newName;
  return { headers, rows: data.rows };
}

export function setCellValue(data: CsvGridData, rowIndex: number, columnIndex: number, value: string): CsvGridData {
  const rows = data.rows.slice();
  const targetRow = rows[rowIndex];
  if (!targetRow) {
    return data;
  }
  const nextRow = targetRow.slice();
  nextRow[columnIndex] = value;
  rows[rowIndex] = nextRow;
  return { headers: data.headers, rows };
}

export type SortDirection = 'asc' | 'desc';

function compareCells(a: string, b: string): number {
  const aTrimmed = a.trim();
  const bTrimmed = b.trim();
  const aNum = aTrimmed === '' ? NaN : Number(aTrimmed);
  const bNum = bTrimmed === '' ? NaN : Number(bTrimmed);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }
  return aTrimmed.localeCompare(bTrimmed);
}

/** Sorts rows by a single column's value. Numeric-looking values compare numerically; everything else falls back to locale string comparison. */
export function sortColumn(data: CsvGridData, columnIndex: number, direction: SortDirection): CsvGridData {
  const rows = data.rows.slice().sort((a, b) => {
    const result = compareCells(a[columnIndex] ?? '', b[columnIndex] ?? '');
    return direction === 'asc' ? result : -result;
  });
  return { headers: data.headers, rows };
}

export interface FindReplaceOptions {
  caseSensitive: boolean;
  scope: 'all' | 'column';
  columnIndex?: number;
}

export interface FindReplaceResult {
  data: CsvGridData;
  replacedCount: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceInCell(value: string, find: string, replace: string, caseSensitive: boolean): { value: string; count: number } {
  if (find === '') {
    return { value, count: 0 };
  }
  if (caseSensitive) {
    const count = value.split(find).length - 1;
    return count > 0 ? { value: value.split(find).join(replace), count } : { value, count: 0 };
  }
  const regex = new RegExp(escapeRegExp(find), 'gi');
  const matches = value.match(regex);
  const count = matches ? matches.length : 0;
  return count > 0 ? { value: value.replace(regex, replace), count } : { value, count: 0 };
}

/** Simple literal text find & replace (not a regex feature) across a column or the whole dataset. Returns how many occurrences were replaced so the caller can show a count before committing. */
export function findAndReplace(data: CsvGridData, find: string, replace: string, options: FindReplaceOptions): FindReplaceResult {
  let replacedCount = 0;

  const rows = data.rows.map((row) =>
    row.map((cell, columnIndex) => {
      if (options.scope === 'column' && columnIndex !== options.columnIndex) {
        return cell;
      }
      const result = replaceInCell(cell, find, replace, options.caseSensitive);
      replacedCount += result.count;
      return result.value;
    }),
  );

  return { data: { headers: data.headers, rows }, replacedCount };
}
