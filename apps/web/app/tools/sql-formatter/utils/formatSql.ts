/**
 * Wraps the `sql-formatter` library. No hand-rolled SQL parsing — dialect
 * differences and clause/keyword formatting rules are exactly what that
 * library exists to handle correctly.
 *
 * sql-formatter's `format()` is NOT best-effort: confirmed empirically
 * (not assumed) that it throws a real Error on SQL it can't parse — an
 * unclosed paren, garbage input, etc. — rather than silently emitting a
 * partial result. Every call here is wrapped accordingly. The thrown
 * message can run to hundreds of lines (an internal Nearley.js grammar
 * dump listing every production rule the parser was expecting), so only
 * the first line — which is consistently a complete, human-readable
 * summary in every case observed — is surfaced.
 */

import { format, supportedDialects, type FormatOptionsWithLanguage, type IndentStyle, type KeywordCase } from 'sql-formatter';

export { supportedDialects };
export type { IndentStyle, KeywordCase };

export interface FormatOptions {
  keywordCase: KeywordCase;
  indentSize: number;
  indentStyle: IndentStyle;
  /** Collapses the formatted result to a single line, for pasting into a log line or URL rather than reading. */
  compact: boolean;
}

export interface FormatResult {
  result: string;
  error?: string;
}

function extractErrorMessage(rawMessage: string): string {
  const firstLine = rawMessage.split('\n')[0]?.trim();
  return firstLine || 'Could not format this SQL.';
}

export function formatQuery(sql: string, dialect: string, options: FormatOptions): FormatResult {
  try {
    const config: FormatOptionsWithLanguage = {
      // `dialect` is only ever populated in this tool from `supportedDialects`
      // itself, so this cast is a boundary narrowing, not a guess.
      language: dialect as FormatOptionsWithLanguage['language'],
      keywordCase: options.keywordCase,
      tabWidth: options.indentSize,
      indentStyle: options.indentStyle,
    };
    const result = format(sql, config);
    return { result: options.compact ? result.replace(/\s+/g, ' ').trim() : result };
  } catch (err) {
    return { result: '', error: err instanceof Error ? extractErrorMessage(err.message) : 'Could not format this SQL.' };
  }
}

export function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const SAMPLE_SQL = `SELECT orders.id, customers.name, customers.email, SUM(order_items.quantity * order_items.price) AS total FROM orders JOIN customers ON orders.customer_id = customers.id JOIN order_items ON order_items.order_id = orders.id WHERE orders.status = 'completed' AND orders.created_at >= '2026-01-01' GROUP BY orders.id, customers.name, customers.email HAVING SUM(order_items.quantity * order_items.price) > 100 ORDER BY total DESC LIMIT 20;`;
