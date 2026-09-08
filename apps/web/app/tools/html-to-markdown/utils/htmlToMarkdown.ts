/**
 * Pure HTML→Markdown conversion — a thin typed wrapper around `turndown`.
 *
 * Unlike Markdown→HTML (tool #72), this direction needs no sanitization
 * step: the output is plain Markdown TEXT, never rendered as live HTML
 * here, so there's nothing for a malicious `<script>` or event handler to
 * execute — the XSS concern that applies to rendering sanitized HTML in a
 * preview pane doesn't apply symmetrically to producing text output.
 */

import TurndownService from 'turndown';

export type HeadingStyle = 'atx' | 'setext';
export type BulletListMarker = '-' | '*' | '+';
export type CodeBlockStyle = 'fenced' | 'indented';
export type LinkStyle = 'inlined' | 'referenced';

export interface HtmlToMarkdownOptions {
  headingStyle: HeadingStyle;
  bulletListMarker: BulletListMarker;
  codeBlockStyle: CodeBlockStyle;
  linkStyle: LinkStyle;
}

export function convertHtmlToMarkdown(html: string, options: HtmlToMarkdownOptions): string {
  if (!html.trim()) {
    return '';
  }

  const service = new TurndownService({
    headingStyle: options.headingStyle,
    bulletListMarker: options.bulletListMarker,
    codeBlockStyle: options.codeBlockStyle,
    linkStyle: options.linkStyle,
  });

  return service.turndown(html);
}
