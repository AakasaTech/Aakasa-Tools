/**
 * Pure CSV-rows→Excel-workbook logic — no DOM, no React. Wraps SheetJS
 * (`xlsx`) to build a genuine binary .xlsx workbook, one worksheet per
 * input CSV. CSV *parsing* itself is not reimplemented here — callers get
 * `rows` by running the shared `@aakasa/csv-utils` `csvToJson` with
 * `outputShape: 'array-of-arrays'`, which already wraps PapaParse and
 * already produces the string/number/boolean cell typing this module
 * expects.
 */

import * as XLSX from 'xlsx';

export type ExcelCellValue = string | number | boolean | null;

export interface CsvDataSet {
  sheetName: string;
  rows: unknown[][];
}

export interface BuildExcelOptions {
  /**
   * true: cells keep whatever JS type they already have (number/boolean
   * pass through as real Excel number/boolean cells). false: every cell is
   * forced to a string, regardless of its input type — the same
   * leading-zero-safe tradeoff CSV↔JSON Converter's own type-inference
   * toggle documents (an ID like "0042" would otherwise become the number
   * 42 and lose its leading zeros).
   */
  inferTypes: boolean;
}

const MAX_SHEET_NAME_LENGTH = 31;
// Excel forbids these characters anywhere in a sheet name.
const INVALID_SHEET_NAME_CHARS = /[:\\/?*[\]]/g;

/** Narrows an arbitrary cell value to what SheetJS's aoa_to_sheet accepts. */
function narrowCell(value: unknown, inferTypes: boolean): ExcelCellValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (!inferTypes) {
    return String(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return String(value);
}

/**
 * Makes `name` a valid, unique Excel sheet name: strips characters Excel
 * disallows (`: \ / ? * [ ]`), truncates to the 31-character limit, falls
 * back to "Sheet" when nothing usable is left, and disambiguates a
 * collision with an already-used name by appending " (2)", " (3)", etc.
 */
export function sanitizeSheetName(name: string, usedNames: Set<string>): string {
  const stripped = name.replace(INVALID_SHEET_NAME_CHARS, '').trim();
  const base = (stripped || 'Sheet').slice(0, MAX_SHEET_NAME_LENGTH);

  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  let suffix = 2;
  let candidate: string;
  do {
    const suffixText = ` (${suffix})`;
    candidate = base.slice(0, MAX_SHEET_NAME_LENGTH - suffixText.length) + suffixText;
    suffix += 1;
  } while (usedNames.has(candidate));

  usedNames.add(candidate);
  return candidate;
}

/**
 * Builds a multi-sheet .xlsx workbook — one worksheet per entry in
 * `csvDataSets`, in order — and returns it as a downloadable Blob.
 */
export function buildExcelWorkbook(csvDataSets: CsvDataSet[], options: BuildExcelOptions): Blob {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const dataSet of csvDataSets) {
    const narrowedRows: ExcelCellValue[][] = dataSet.rows.map((row) => row.map((cell) => narrowCell(cell, options.inferTypes)));
    const worksheet = XLSX.utils.aoa_to_sheet(narrowedRows);
    const sheetName = sanitizeSheetName(dataSet.sheetName, usedNames);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
