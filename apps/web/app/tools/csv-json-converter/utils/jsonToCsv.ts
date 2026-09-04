/**
 * Pure JSON→CSV logic — no DOM, no React. Safe to call from the main thread
 * or from convert.worker.ts. Uses PapaParse's `unparse` for the actual CSV
 * serialization (correct quoting of fields containing the delimiter, a
 * quote character, or a newline is exactly the kind of "looks simple,
 * isn't" problem hand-rolling would get wrong) — this file's own job is
 * only the flattening decision, not CSV syntax.
 */

import Papa from 'papaparse';

export interface JsonToCsvOptions {
  /** Separator used to join an array of primitive values into a single cell, e.g. "; ". */
  arrayJoinSeparator: string;
}

export interface JsonToCsvStats {
  rowCount: number;
  columnCount: number;
}

export interface JsonToCsvResult {
  data: string;
  error?: string;
  stats?: JsonToCsvStats;
}

// --- JSON syntax error location -------------------------------------------
// Mirrors json-formatter/utils/jsonFormat.ts's parseJson error-location
// behavior (line/column instead of a raw byte offset) so both tools report
// JSON errors the same way. Kept as a local, private copy rather than a
// cross-tool import — if a third tool ends up needing this, that's the
// signal to promote it into a shared package rather than JSON Formatter's
// own tool folder.

interface JsonSyntaxLocation {
  message: string;
  line: number;
  column: number;
}

function isJsonWhitespace(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9';
}

class JsonSyntaxError extends Error {
  position: number;
  constructor(message: string, position: number) {
    super(message);
    this.position = position;
  }
}

function locateJsonSyntaxError(input: string): { message: string; position: number } {
  let i = 0;
  const len = input.length;

  const fail = (message: string): never => {
    throw new JsonSyntaxError(message, i);
  };

  const skipWhitespace = () => {
    while (i < len && isJsonWhitespace(input[i])) {
      i += 1;
    }
  };

  const parseValue = (): void => {
    skipWhitespace();
    const ch = input[i];
    if (ch === undefined) fail('Unexpected end of input');
    else if (ch === '{') parseObject();
    else if (ch === '[') parseArray();
    else if (ch === '"') parseString();
    else if (ch === '-' || isDigit(ch)) parseNumber();
    else if (input.startsWith('true', i)) i += 4;
    else if (input.startsWith('false', i)) i += 5;
    else if (input.startsWith('null', i)) i += 4;
    else fail(`Unexpected token '${ch}'`);
  };

  const parseObject = (): void => {
    i += 1;
    skipWhitespace();
    if (input[i] === '}') {
      i += 1;
      return;
    }
    for (;;) {
      skipWhitespace();
      if (input[i] !== '"') fail('Expected a double-quoted property name');
      parseString();
      skipWhitespace();
      if (input[i] !== ':') fail("Expected ':' after property name");
      i += 1;
      parseValue();
      skipWhitespace();
      if (input[i] === ',') {
        i += 1;
        skipWhitespace();
        if (input[i] === '}') fail('Trailing comma is not allowed before "}"');
        continue;
      }
      if (input[i] === '}') {
        i += 1;
        return;
      }
      fail("Expected ',' or '}'");
    }
  };

  const parseArray = (): void => {
    i += 1;
    skipWhitespace();
    if (input[i] === ']') {
      i += 1;
      return;
    }
    for (;;) {
      parseValue();
      skipWhitespace();
      if (input[i] === ',') {
        i += 1;
        skipWhitespace();
        if (input[i] === ']') fail('Trailing comma is not allowed before "]"');
        continue;
      }
      if (input[i] === ']') {
        i += 1;
        return;
      }
      fail("Expected ',' or ']'");
    }
  };

  const parseString = (): void => {
    i += 1;
    while (i < len && input[i] !== '"') {
      if (input[i] === '\\') i += 1;
      i += 1;
    }
    if (i >= len) fail('Unterminated string');
    i += 1;
  };

  const parseNumber = (): void => {
    const start = i;
    if (input[i] === '-') i += 1;
    if (input[i] === '0') {
      i += 1;
    } else if (isDigit(input[i])) {
      while (isDigit(input[i])) i += 1;
    } else {
      fail('Invalid number');
    }
    if (input[i] === '.') {
      i += 1;
      if (!isDigit(input[i])) fail('Invalid number');
      while (isDigit(input[i])) i += 1;
    }
    if (input[i] === 'e' || input[i] === 'E') {
      i += 1;
      if (input[i] === '+' || input[i] === '-') i += 1;
      if (!isDigit(input[i])) fail('Invalid number');
      while (isDigit(input[i])) i += 1;
    }
    if (start === i) fail('Invalid number');
  };

  try {
    parseValue();
    skipWhitespace();
    if (i < len) fail('Unexpected trailing content after JSON value');
    return { message: 'Invalid JSON', position: len };
  } catch (err) {
    if (err instanceof JsonSyntaxError) {
      return { message: err.message, position: err.position };
    }
    return { message: 'Invalid JSON', position: 0 };
  }
}

function offsetToLineColumn(input: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const end = Math.min(offset, input.length);
  for (let i = 0; i < end; i += 1) {
    if (input[i] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function parseJsonInput(input: string): { success: true; value: unknown } | { success: false; error: JsonSyntaxLocation } {
  try {
    return { success: true, value: JSON.parse(input) as unknown };
  } catch {
    const { message, position } = locateJsonSyntaxError(input);
    const { line, column } = offsetToLineColumn(input, position);
    return { success: false, error: { message, line, column } };
  }
}

// --- Flattening -------------------------------------------------------------

type FlatRow = Record<string, string>;

function stringifyPrimitive(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Flattens one JSON value into `out` under `prefix`. Nested objects become
 * dot-notation keys (address.city). An array of primitives is joined into a
 * single cell with `separator`. An array of objects (or anything else
 * non-primitive) is flattened with index notation (items.0.name,
 * items.1.name) — this is the one place this tool makes an opinionated
 * choice about ambiguous data, and it's documented in the tool's FAQ.
 */
function flattenValue(value: unknown, prefix: string, separator: string, out: FlatRow): void {
  if (value === null || value === undefined) {
    out[prefix] = '';
    return;
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every((item) => item === null || typeof item !== 'object');
    if (allPrimitive) {
      out[prefix] = value.map(stringifyPrimitive).join(separator);
      return;
    }
    value.forEach((item, index) => {
      flattenValue(item, `${prefix}.${index}`, separator, out);
    });
    return;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      out[prefix] = '';
      return;
    }
    for (const [key, childValue] of entries) {
      flattenValue(childValue, prefix ? `${prefix}.${key}` : key, separator, out);
    }
    return;
  }

  out[prefix] = stringifyPrimitive(value);
}

/** Flattens one array element (a "row") into a single CSV row's cells. */
function flattenRow(row: unknown, separator: string): FlatRow {
  const out: FlatRow = {};

  if (row === null || row === undefined) {
    return out;
  }

  if (!isPlainObject(row) && !Array.isArray(row)) {
    out.value = stringifyPrimitive(row);
    return out;
  }

  if (Array.isArray(row)) {
    const allPrimitive = row.every((item) => item === null || typeof item !== 'object');
    if (allPrimitive) {
      out.value = row.map(stringifyPrimitive).join(separator);
      return out;
    }
    row.forEach((item, index) => flattenValue(item, String(index), separator, out));
    return out;
  }

  for (const [key, value] of Object.entries(row)) {
    flattenValue(value, key, separator, out);
  }
  return out;
}

/**
 * Converts an already-in-memory array of row objects to CSV — the shared
 * core `jsonToCsv` below uses after parsing JSON text. Exported separately
 * so callers that already have row objects (e.g. Random Data Generator's
 * generated records) can reuse this flattening + serialization logic
 * without a wasteful stringify-then-reparse round trip through JSON text.
 */
export function rowsToCsv(rows: unknown[], options: JsonToCsvOptions): JsonToCsvResult {
  if (rows.length === 0) {
    return { data: '', error: 'No rows to convert.' };
  }

  const flatRows = rows.map((row) => flattenRow(row, options.arrayJoinSeparator));

  // Union of all keys across all rows, in first-seen order. Rows missing a
  // given key just get an empty cell there — inconsistent columns across
  // real-world data is normal and shouldn't error out.
  const headers: string[] = [];
  const seenHeaders = new Set<string>();
  for (const row of flatRows) {
    for (const key of Object.keys(row)) {
      if (!seenHeaders.has(key)) {
        seenHeaders.add(key);
        headers.push(key);
      }
    }
  }

  const rowsAsArrays = flatRows.map((row) => headers.map((header) => row[header] ?? ''));

  const csv = Papa.unparse({ fields: headers, data: rowsAsArrays });

  return {
    data: csv,
    stats: { rowCount: rowsAsArrays.length, columnCount: headers.length },
  };
}

export function jsonToCsv(jsonText: string, options: JsonToCsvOptions): JsonToCsvResult {
  if (!jsonText.trim()) {
    return { data: '', error: 'No JSON data to convert.' };
  }

  const parsed = parseJsonInput(jsonText);
  if (!parsed.success) {
    return {
      data: '',
      error: `Line ${parsed.error.line}, column ${parsed.error.column}: ${parsed.error.message}`,
    };
  }

  // A bare object converts as a single-row CSV; an array converts as one
  // row per element (the common case).
  const rows: unknown[] = Array.isArray(parsed.value) ? parsed.value : [parsed.value];

  if (rows.length === 0) {
    return { data: '', error: 'JSON array is empty — nothing to convert.' };
  }

  return rowsToCsv(rows, options);
}

export const SAMPLE_JSON_FOR_CSV = `[
  {
    "id": "1",
    "name": "Ada Lovelace",
    "address": { "city": "London", "country": "UK" },
    "tags": ["math", "computing"]
  },
  {
    "id": "2",
    "name": "Alan Turing",
    "address": { "city": "Maida Vale", "country": "UK" },
    "tags": ["computing", "cryptography"]
  }
]`;
