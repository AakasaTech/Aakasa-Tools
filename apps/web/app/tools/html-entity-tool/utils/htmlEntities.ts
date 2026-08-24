/**
 * DOM-based HTML entity encoding/decoding. Every function here calls
 * `document.createElement`, so this file is client-only — it must never be
 * imported into a server component. (It's only ever imported from
 * HtmlEntityTool.tsx, which is "use client", so this is naturally satisfied
 * today; this comment exists so it stays that way.)
 *
 * Decoding uses the browser's own HTML parser (via a detached, never-
 * appended element's innerHTML → textContent), which correctly handles the
 * complete HTML5 named character reference table plus decimal and hex
 * numeric references — no hand-maintained entity table needed, and no risk
 * of script execution, since content set via innerHTML on an element that's
 * never inserted into the document never runs (script tags are inert,
 * nothing loads, nothing renders).
 *
 * Encoding uses the browser's own HTML *serializer* (via textContent →
 * innerHTML) for the ordering-sensitive part — escaping &, <, >, and
 * non-breaking space is easy to get subtly wrong by hand (e.g. double-
 * escaping "&" if "<" is escaped first). Quotes aren't escaped by the
 * serializer in text-node context (only in attribute-value context), so
 * they're added as a small, unambiguous literal pass afterward. The
 * optional "encode all non-ASCII" mode iterates by Unicode code point (not
 * UTF-16 code unit) so multi-unit characters like emoji are never split.
 */

export type EntityFormat = 'named-or-numeric' | 'numeric-only';

export interface EncodeOptions {
  /** Also convert every non-ASCII character (accents, symbols, emoji) to an entity. */
  fullNonAscii: boolean;
  format: EntityFormat;
}

/** A small curated set of common named entities — used both for the "encode all non-ASCII" mode's named-form preference and the reference table below. Coverage is intentionally partial: anything not listed here still encodes correctly, just as a numeric reference instead of a named one. */
export const COMMON_ENTITIES: { char: string; name: string; label: string }[] = [
  { char: '©', name: 'copy', label: 'Copyright' },
  { char: '®', name: 'reg', label: 'Registered trademark' },
  { char: '™', name: 'trade', label: 'Trademark' },
  { char: ' ', name: 'nbsp', label: 'Non-breaking space' },
  { char: '–', name: 'ndash', label: 'En dash' },
  { char: '—', name: 'mdash', label: 'Em dash' },
  { char: '…', name: 'hellip', label: 'Horizontal ellipsis' },
  { char: '«', name: 'laquo', label: 'Left angle quote' },
  { char: '»', name: 'raquo', label: 'Right angle quote' },
  { char: '€', name: 'euro', label: 'Euro sign' },
  { char: '£', name: 'pound', label: 'Pound sign' },
  { char: '¥', name: 'yen', label: 'Yen sign' },
  { char: '¢', name: 'cent', label: 'Cent sign' },
  { char: '°', name: 'deg', label: 'Degree sign' },
  { char: '±', name: 'plusmn', label: 'Plus-minus sign' },
  { char: '×', name: 'times', label: 'Multiplication sign' },
  { char: '÷', name: 'divide', label: 'Division sign' },
  { char: 'é', name: 'eacute', label: 'e acute (é)' },
  { char: 'è', name: 'egrave', label: 'e grave (è)' },
  { char: 'ü', name: 'uuml', label: 'u umlaut (ü)' },
  { char: 'ö', name: 'ouml', label: 'o umlaut (ö)' },
  { char: 'ä', name: 'auml', label: 'a umlaut (ä)' },
  { char: 'ñ', name: 'ntilde', label: 'n tilde (ñ)' },
  { char: 'ç', name: 'ccedil', label: 'c cedilla (ç)' },
];

const CHAR_TO_NAMED_ENTITY: Record<string, string> = Object.fromEntries(
  COMMON_ENTITIES.map(({ char, name }) => [char, name])
);

/** The ordering-sensitive part (&, non-breaking space, <, >), delegated to the browser's own serializer. */
function domEscapeBasic(text: string): string {
  const container = document.createElement('div');
  container.textContent = text;
  return container.innerHTML;
}

/** The DOM only escapes quotes in attribute-value context, not text-node content — added explicitly since this tool's "special characters" set includes them. Safe as a second pass: `domEscapeBasic` never introduces a literal quote character, so this only ever touches quotes that were in the original text. */
function escapeQuotes(text: string, named: boolean): string {
  return text.replace(/"/g, named ? '&quot;' : '&#34;').replace(/'/g, '&#39;');
}

function toNumericFormat(text: string): string {
  return text.replace(/&amp;/g, '&#38;').replace(/&lt;/g, '&#60;').replace(/&gt;/g, '&#62;').replace(/&nbsp;/g, '&#160;');
}

/** Runs only when `fullNonAscii` is set. Iterates by Unicode code point (via `for...of`) so a surrogate pair (emoji, and other astral characters) is treated as one character, not corrupted into two. The string it scans only ever contains entity syntax made of ASCII characters plus whatever non-ASCII characters were in the original text, so this can't misinterpret an entity it already produced. */
function encodeNonAscii(text: string, named: boolean): string {
  let result = '';
  for (const ch of text) {
    const codePoint = ch.codePointAt(0)!;
    if (codePoint <= 127) {
      result += ch;
      continue;
    }
    const entityName = named ? CHAR_TO_NAMED_ENTITY[ch] : undefined;
    result += entityName ? `&${entityName};` : `&#${codePoint};`;
  }
  return result;
}

export function encodeEntities(text: string, options: EncodeOptions): string {
  const named = options.format === 'named-or-numeric';
  let result = domEscapeBasic(text);
  result = escapeQuotes(result, named);
  if (!named) {
    result = toNumericFormat(result);
  }
  if (options.fullNonAscii) {
    result = encodeNonAscii(result, named);
  }
  return result;
}

export function decodeEntities(text: string): string {
  const container = document.createElement('div');
  container.innerHTML = text;
  return container.textContent ?? '';
}
