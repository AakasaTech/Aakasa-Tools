/**
 * Pure CSV→JSON logic — no DOM, no React. Wraps PapaParse (hand-rolled CSV
 * parsing reliably breaks on quoted commas, embedded newlines, and escaped
 * quotes, so this deliberately doesn't reimplement that). Safe to call from
 * the main thread or from convert.worker.ts.
 */

import Papa from 'papaparse';

export type CsvDelimiter = 'auto' | ',' | ';' | '\t' | '|';
export type CsvOutputShape = 'array-of-objects' | 'array-of-arrays' | 'keyed-by-column';

export interface CsvParseOptions {
  delimiter: CsvDelimiter;
  hasHeader: boolean;
  outputShape: CsvOutputShape;
  /** Required when outputShape is 'keyed-by-column' — a header label (or "Column N" if hasHeader is off) to key the output object by. */
  keyColumn?: string;
  /** When true, numeric-looking cells become numbers and "true"/"false" become booleans. When false, everything stays a string (safer for values like "0042" that would lose leading zeros). */
  typeInference: boolean;
}

export interface CsvParseStats {
  rowCount: number;
  columnCount: number;
  headers: string[];
}

export interface CsvToJsonResult {
  data: unknown;
  error?: string;
  stats?: CsvParseStats;
}

type CellValue = string | number | boolean;

function inferCell(raw: string): CellValue {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const trimmed = raw.trim();
  if (trimmed !== '' && /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (Number.isFinite(num)) {
      return num;
    }
  }
  return raw;
}

function resolveDelimiter(delimiter: CsvDelimiter): string {
  return delimiter === 'auto' ? '' : delimiter;
}

function generatedHeaders(columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
}

export function csvToJson(csvText: string, options: CsvParseOptions): CsvToJsonResult {
  if (!csvText.trim()) {
    return { data: null, error: 'No CSV data to convert.' };
  }

  const parsed = Papa.parse<string[]>(csvText, {
    delimiter: resolveDelimiter(options.delimiter),
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0]!;
    const rowInfo = first.row !== undefined ? ` (row ${first.row + 1})` : '';
    return { data: null, error: `${first.message}${rowInfo}` };
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return { data: null, error: 'No CSV data to convert.' };
  }

  const columnCount = Math.max(...rows.map((row) => row.length));
  const headers = options.hasHeader ? rows[0]! : generatedHeaders(columnCount);
  const dataRows = options.hasHeader ? rows.slice(1) : rows;

  const inferredRows: CellValue[][] = dataRows.map((row) =>
    row.map((cell) => (options.typeInference ? inferCell(cell) : cell))
  );

  const stats: CsvParseStats = {
    rowCount: dataRows.length,
    columnCount,
    headers,
  };

  if (options.outputShape === 'array-of-arrays') {
    return { data: inferredRows, stats };
  }

  const toObject = (row: CellValue[]): Record<string, CellValue> => {
    const obj: Record<string, CellValue> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? '';
    });
    return obj;
  };

  if (options.outputShape === 'array-of-objects') {
    return { data: inferredRows.map(toObject), stats };
  }

  // keyed-by-column
  const keyColumn = options.keyColumn;
  if (!keyColumn) {
    return { data: null, error: 'Choose a column to key the output by.', stats };
  }
  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex === -1) {
    return { data: null, error: `Column "${keyColumn}" was not found in the header row.`, stats };
  }

  const keyed: Record<string, Record<string, CellValue>> = {};
  dataRows.forEach((rawRow, rowIndex) => {
    // The lookup key always uses the raw (pre-type-inference) string so it's
    // predictable regardless of the type inference toggle — otherwise "042"
    // could become key "42" while a sibling row's key stays "042".
    const key = rawRow[keyIndex] ?? '';
    keyed[key] = toObject(inferredRows[rowIndex]!);
  });

  return { data: keyed, stats };
}

export const SAMPLE_CSV = `id,name,email,active
1,Ada Lovelace,ada@example.com,true
2,Alan Turing,alan@example.com,true
3,Grace Hopper,grace@example.com,false`;
