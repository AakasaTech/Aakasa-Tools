import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { MarkdownToHtml } from './MarkdownToHtml';

const TITLE = 'Markdown to HTML Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert Markdown to HTML instantly, with live preview.';
const CANONICAL_URL = 'https://aakasa.dev/tools/markdown-to-html';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL_URL,
    siteName: 'Aakasa Toolbox',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function MarkdownToHtmlPage() {
  return (
    <ToolShell
      title="Markdown to HTML Converter"
      description="Convert Markdown to HTML instantly, with live preview."
      category="text-writing"
      tier="free"
      relatedTools={['html-to-markdown', 'html-entity-tool', 'json-formatter']}
      faq={[
        {
          question: 'What is Markdown, and what is it used for?',
          answer:
            "Markdown is a lightweight, plain-text formatting syntax — things like **bold** or a heading are written with a few extra characters instead of a rich-text toolbar. It's the standard for GitHub README files, technical documentation, and formatting messages in tools like Slack, Discord, and countless forums, precisely because it stays readable as plain text while still converting cleanly into properly formatted HTML.",
        },
        {
          question: 'Which flavor of Markdown does this support?',
          answer:
            'This tool uses `marked`, a fast and well-established parser that supports GitHub Flavored Markdown (GFM) — original Markdown plus extensions GitHub added, including tables, task lists (`- [ ]` / `- [x]`), fenced code blocks, and strikethrough (`~~text~~`). The GFM extensions toggle lets you turn those off to see plain/vanilla Markdown behavior instead.',
        },
        {
          question: 'Is raw HTML in my Markdown a security risk?',
          answer:
            "Markdown allows raw HTML to be embedded directly in the source, and by default that HTML would be included as-is in the output — which matters because the live Preview pane actually renders that output as real markup, not as text. So before anything reaches the Preview, this tool runs the generated HTML through DOMPurify to strip anything dangerous (like a <script> tag or an onerror handler). The separate HTML-source view shows the true, unsanitized HTML that was generated, since displaying it as plain text there carries no risk — only rendering it live does.",
        },
        {
          question: 'Is anything I type here uploaded anywhere?',
          answer: 'No — parsing, sanitizing, and rendering all happen locally in your browser.',
        },
      ]}
    >
      <MarkdownToHtml />
    </ToolShell>
  );
}
