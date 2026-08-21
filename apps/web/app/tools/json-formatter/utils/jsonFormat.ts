/**
 * Pure JSON parsing/formatting/tree-building logic for the JSON Formatter
 * tool. No React, no DOM — safe to call from the main thread or a Web
 * Worker, and reusable by future tools (JSON tree viewer, JSON-to-TS).
 */

export type IndentOption = 2 | 4 | 'tab';

export interface JsonParseError {
  message: string;
  line: number;
  column: number;
  position: number;
}

export type JsonParseResult =
  | { success: true; value: unknown }
  | { success: false; error: JsonParseError };

export function parseJson(input: string): JsonParseResult {
  try {
    return { success: true, value: JSON.parse(input) as unknown };
  } catch {
    // We deliberately don't parse the native error's message text: Chrome,
    // Firefox, and Safari each phrase JSON.parse errors differently (and
    // Chrome alone has changed format across versions) — none of them are a
    // stable contract to scrape a position out of. Instead we re-walk the
    // JSON grammar ourselves to find exactly where it breaks, so the
    // reported line/column is reliable regardless of which browser runs it.
    const { message, position } = locateSyntaxError(input);
    const { line, column } = offsetToLineColumn(input, position);

    return {
      success: false,
      error: { message, line, column, position },
    };
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

/**
 * A minimal recursive-descent JSON validator whose only job is to find
 * *where* a syntax error is, with a human-readable reason — it never needs
 * to succeed, since it's only called after the native `JSON.parse` already
 * rejected the input.
 */
function locateSyntaxError(input: string): { message: string; position: number } {
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
    i += 1; // '{'
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
    i += 1; // '['
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
    i += 1; // opening quote
    while (i < len && input[i] !== '"') {
      if (input[i] === '\\') i += 1;
      i += 1;
    }
    if (i >= len) fail('Unterminated string');
    i += 1; // closing quote
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
    // Our lenient grammar walk found nothing wrong even though JSON.parse
    // rejected the input (e.g. a malformed \u escape we don't validate) —
    // point at the end of the input rather than guessing.
    return { message: 'Invalid JSON', position: len };
  } catch (err) {
    if (err instanceof JsonSyntaxError) {
      return { message: err.message, position: err.position };
    }
    return { message: 'Invalid JSON', position: 0 };
  }
}

export function formatJson(value: unknown, indent: IndentOption): string {
  const space = indent === 'tab' ? '\t' : indent;
  return JSON.stringify(value, null, space);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

export function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonTreeNode {
  /** Property key or array index (stringified); null for the root node. */
  key: string | null;
  type: JsonNodeType;
  /** Set for leaf nodes only — objects/arrays carry their data in `children`. */
  value: string | number | boolean | null;
  children?: JsonTreeNode[];
}

/** Converts a parsed JSON value into a plain tree structure for recursive rendering. */
export function buildJsonTree(value: unknown, key: string | null = null): JsonTreeNode {
  if (value === null) {
    return { key, type: 'null', value: null };
  }

  if (Array.isArray(value)) {
    return {
      key,
      type: 'array',
      value: null,
      children: value.map((item, index) => buildJsonTree(item, String(index))),
    };
  }

  if (typeof value === 'object') {
    return {
      key,
      type: 'object',
      value: null,
      children: Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) =>
        buildJsonTree(childValue, childKey)
      ),
    };
  }

  if (typeof value === 'string') {
    return { key, type: 'string', value };
  }

  if (typeof value === 'number') {
    return { key, type: 'number', value };
  }

  if (typeof value === 'boolean') {
    return { key, type: 'boolean', value };
  }

  return { key, type: 'null', value: null };
}

export const SAMPLE_JSON = `{
  "name": "Aakasa Toolbox",
  "version": 1,
  "isActive": true,
  "tags": ["json", "formatter", "developer-tools"],
  "author": {
    "name": "Aakasa",
    "url": "https://aakasa.dev"
  },
  "releaseDate": null
}`;
