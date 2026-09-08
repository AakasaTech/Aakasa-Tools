/**
 * Pure Markdown→HTML conversion — wraps `marked` for parsing and
 * `dompurify` for sanitizing. Returns BOTH the raw generated HTML (for the
 * HTML-source view, shown as inert text) and the sanitized HTML (for the
 * live preview, which actually renders as markup via
 * `dangerouslySetInnerHTML` and so must never see attacker-controlled
 * script/event-handler content).
 *
 * IMPORTANT: `DOMPurify.sanitize()` silently no-ops — returning its input
 * completely UNCHANGED — in any environment without a `window`/`document`
 * (Node, and therefore Next.js's server-side render pass). Calling this
 * function during SSR would silently skip sanitization rather than erroring,
 * so callers must only ever invoke it client-side (e.g. from a `useEffect`,
 * never directly in a component's render body), matching this codebase's
 * existing pattern for other DOM-dependent conversions (see
 * html-entity-tool's `encodeEntities`/`decodeEntities` usage).
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface MarkdownConvertOptions {
  /** GitHub Flavored Markdown extensions: tables, task lists, strikethrough. */
  gfm: boolean;
  /** When true, a single newline becomes `<br>`; when false (the
   * CommonMark-standard behavior), a blank line is required to start a new
   * paragraph and single newlines are ignored. */
  breaks: boolean;
}

export interface MarkdownConvertResult {
  /** The exact HTML `marked` generated, unsanitized — safe to display as
   * text (e.g. in a `<pre>` or textarea) but never to render as markup. */
  rawHtml: string;
  /** `rawHtml` run through DOMPurify — safe to render live via
   * `dangerouslySetInnerHTML`. */
  sanitizedHtml: string;
}

export function convertMarkdownToHtml(markdown: string, options: MarkdownConvertOptions): MarkdownConvertResult {
  if (!markdown.trim()) {
    return { rawHtml: '', sanitizedHtml: '' };
  }

  const rawHtml = marked.parse(markdown, { gfm: options.gfm, breaks: options.breaks, async: false });
  const sanitizedHtml = DOMPurify.sanitize(rawHtml);

  return { rawHtml, sanitizedHtml };
}
