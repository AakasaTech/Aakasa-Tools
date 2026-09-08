import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { HtmlToMarkdown } from './HtmlToMarkdown';

const TITLE = 'HTML to Markdown Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert HTML to clean Markdown instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/html-to-markdown';

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

export default function HtmlToMarkdownPage() {
  return (
    <ToolShell
      title="HTML to Markdown Converter"
      description="Convert HTML to clean Markdown instantly."
      category="text-writing"
      tier="free"
      relatedTools={['markdown-to-html', 'html-entity-tool', 'json-formatter']}
      faq={[
        {
          question: 'What is this useful for?',
          answer:
            "Common cases: pulling a web page's content, an exported email, or an HTML document into clean Markdown for a README, a note-taking app, or a CMS that prefers Markdown over rich HTML. It's also handy for cleaning up formatting copied from a rich-text editor into something plain and portable.",
        },
        {
          question: "What happens to HTML that doesn't have a direct Markdown equivalent?",
          answer:
            "Markdown is a much simpler format than HTML, so anything without a Markdown equivalent — complex tables with merged cells, embedded media or iframes, custom inline styling, form elements, and similar — gets converted as reasonably as possible or dropped entirely. This tool (built on the well-established `turndown` library) handles the common cases — headings, lists, links, emphasis, code blocks, simple tables — well, but it isn't a lossless converter for arbitrary, complex HTML. Always spot-check the output against unusual input.",
        },
        {
          question: 'Does the "Paste from clipboard" button read my HTML, not just plain text?',
          answer:
            "Yes — when you copy a rich-text selection from a web page, your clipboard actually holds both an HTML version and a plain-text version. Pasting normally (Ctrl+V) into a plain textarea only gets you the plain-text one, which loses bold, links, and structure. This button uses the browser's Clipboard API to read the HTML version specifically, so the conversion sees the real formatting. It needs clipboard permission, which your browser will prompt for — if it's denied or unsupported, the button falls back to telling you to paste manually instead.",
        },
        {
          question: 'Is anything I paste here uploaded anywhere?',
          answer: 'No — the conversion happens entirely locally in your browser.',
        },
      ]}
    >
      <HtmlToMarkdown />
    </ToolShell>
  );
}
