/**
 * Pure XML parsing/formatting logic, built entirely on native DOMParser /
 * XMLSerializer-adjacent DOM APIs — no XML library. Client-only (DOMParser
 * requires a browser), but no DOM node is ever attached to the page, so
 * nothing here can execute scripts or trigger loads regardless of input.
 *
 * The one non-obvious fact this whole module is built around: DOMParser
 * does NOT throw a JS exception for malformed XML. It always returns a
 * Document — for invalid input, that document contains a `<parsererror>`
 * element instead of the real content. A bare try/catch around
 * `parseFromString` would silently "succeed" on garbage input, so every
 * parse here explicitly checks for that element.
 */

export interface XmlParseError {
  message: string;
  line?: number;
  column?: number;
}

export interface XmlParseResult {
  doc: Document | null;
  error?: XmlParseError;
}

const XML_DECLARATION_PATTERN = /^\s*<\?xml[^?]*\?>/i;

/** Extracts the `<?xml ...?>` declaration verbatim from the source text, if present — kept as literal source text (not reconstructed from parsed properties) so formatting never subtly changes its casing/spacing/attribute order. */
export function extractXmlDeclaration(xml: string): string | null {
  const match = XML_DECLARATION_PATTERN.exec(xml);
  return match ? match[0].trim() : null;
}

function parseErrorLineColumn(rawMessage: string): { line?: number; column?: number } {
  const match = /line\s*(?:number)?\s*(\d+)[,:]?\s*(?:at\s*)?column\s*(\d+)/i.exec(rawMessage);
  if (!match) {
    return {};
  }
  return { line: Number(match[1]), column: Number(match[2]) };
}

/**
 * The raw parsererror text is verbose and engine-specific boilerplate
 * wrapped around the one useful sentence — e.g. Chrome/WebKit's is "This
 * page contains the following errors:error on line 2 at column 28: <the
 * actual reason> Below is a rendering of the page up to the first error."
 * Since line/column are already extracted and shown separately, this
 * strips the redundant framing so only "<the actual reason>" is left.
 */
function cleanErrorMessage(rawMessage: string): string {
  return rawMessage
    .replace(/^this page contains the following errors:\s*/i, '')
    .replace(/^error on line \d+ at column \d+:\s*/i, '')
    .replace(/^xml parsing error:\s*/i, '')
    .replace(/\s*below is a rendering of the page up to the first error\.?\s*$/i, '')
    .replace(/\s*location:\s*$/i, '')
    .trim();
}

export function parseXml(xml: string): XmlParseResult {
  if (!xml.trim()) {
    return { doc: null, error: { message: 'Paste some XML to validate it.' } };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  // The parsererror element's namespace/placement varies by engine, but its
  // tag name doesn't — checking by tag name (rather than by namespace or
  // assuming it's the document root) works consistently across browsers.
  const parserErrorEl = doc.getElementsByTagName('parsererror')[0];
  if (parserErrorEl) {
    const rawMessage = (parserErrorEl.textContent ?? 'Invalid XML.').replace(/\s+/g, ' ').trim();
    const { line, column } = parseErrorLineColumn(rawMessage);
    const message = cleanErrorMessage(rawMessage) || rawMessage;
    return { doc: null, error: { message, line, column } };
  }

  return { doc };
}

function escapeXmlText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXmlAttributeValue(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;');
}

function formatAttributes(el: Element): string {
  const attrs = Array.from(el.attributes);
  if (attrs.length === 0) {
    return '';
  }
  return ' ' + attrs.map((attr) => `${attr.name}="${escapeXmlAttributeValue(attr.value)}"`).join(' ');
}

/** Child nodes that carry no information once formatting normalizes insignificant inter-tag whitespace — this is what makes a "formatter" a formatter rather than a verbatim copy. */
function isMeaningfulNode(node: ChildNode): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').trim() !== '';
  }
  return node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.CDATA_SECTION_NODE;
}

function formatNode(node: ChildNode, depth: number, indentUnit: string): string {
  const indent = indentUnit.repeat(depth);
  if (node.nodeType === Node.ELEMENT_NODE) {
    return formatElement(node as Element, depth, indentUnit);
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `${indent}<!--${node.textContent ?? ''}-->`;
  }
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${indent}<![CDATA[${node.textContent ?? ''}]]>`;
  }
  // Text node.
  return `${indent}${escapeXmlText((node.textContent ?? '').trim())}`;
}

function formatElement(el: Element, depth: number, indentUnit: string): string {
  const indent = indentUnit.repeat(depth);
  const attrs = formatAttributes(el);
  const openTag = `<${el.tagName}${attrs}`;
  const children = Array.from(el.childNodes).filter(isMeaningfulNode);

  if (children.length === 0) {
    return `${indent}${openTag}/>`;
  }

  const onlyChildIsText = children.length === 1 && children[0]!.nodeType === Node.TEXT_NODE;
  if (onlyChildIsText) {
    const text = escapeXmlText((children[0]!.textContent ?? '').trim());
    return `${indent}${openTag}>${text}</${el.tagName}>`;
  }

  const childLines = children.map((child) => formatNode(child, depth + 1, indentUnit)).join('\n');
  return `${indent}${openTag}>\n${childLines}\n${indent}</${el.tagName}>`;
}

function minifyNode(node: ChildNode): string {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return minifyElement(node as Element);
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `<!--${node.textContent ?? ''}-->`;
  }
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `<![CDATA[${node.textContent ?? ''}]]>`;
  }
  return escapeXmlText((node.textContent ?? '').trim());
}

function minifyElement(el: Element): string {
  const attrs = formatAttributes(el);
  const children = Array.from(el.childNodes).filter(isMeaningfulNode);
  if (children.length === 0) {
    return `<${el.tagName}${attrs}/>`;
  }
  const onlyChildIsText = children.length === 1 && children[0]!.nodeType === Node.TEXT_NODE;
  if (onlyChildIsText) {
    return `<${el.tagName}${attrs}>${escapeXmlText((children[0]!.textContent ?? '').trim())}</${el.tagName}>`;
  }
  return `<${el.tagName}${attrs}>${children.map(minifyNode).join('')}</${el.tagName}>`;
}

export type XmlIndentOption = 2 | 4 | 'tab';

/** Pretty-prints `xml`. Throws if `xml` isn't well-formed — callers should check `parseXml` first and only call this on input already known to be valid. */
export function formatXml(xml: string, indentSize: XmlIndentOption): string {
  const parsed = parseXml(xml);
  if (!parsed.doc) {
    throw new Error(parsed.error?.message ?? 'Invalid XML.');
  }
  const indentUnit = indentSize === 'tab' ? '\t' : ' '.repeat(indentSize);
  const declaration = extractXmlDeclaration(xml);
  const body = formatElement(parsed.doc.documentElement, 0, indentUnit);
  return declaration ? `${declaration}\n${body}` : body;
}

/** Strips insignificant whitespace. Throws if `xml` isn't well-formed, for the same reason as `formatXml`. */
export function minifyXml(xml: string): string {
  const parsed = parseXml(xml);
  if (!parsed.doc) {
    throw new Error(parsed.error?.message ?? 'Invalid XML.');
  }
  const declaration = extractXmlDeclaration(xml);
  const body = minifyElement(parsed.doc.documentElement);
  return declaration ? `${declaration}${body}` : body;
}

export function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101" available="true">
    <title>Learning XML</title>
    <author>Erik T. Ray</author>
    <price currency="USD">39.95</price>
  </book>
  <book id="bk102" available="false">
    <title>Aakasa Toolbox Guide</title>
    <author>Aakasa</author>
    <price currency="USD">0.00</price>
  </book>
</catalog>`;
