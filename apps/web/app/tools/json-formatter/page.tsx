import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { JsonFormatter } from './JsonFormatter';

const TITLE = 'JSON Formatter & Validator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Format, validate, and minify JSON instantly in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/json-formatter';

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

export default function JsonFormatterPage() {
  return (
    <ToolShell
      title="JSON Formatter & Validator"
      description="Format, validate, and minify JSON instantly — right in your browser."
      category="developer"
      tier="free"
      relatedTools={['base64-tool', 'csv-json-converter', 'regex-tester']}
      faq={[
        {
          question: 'What does JSON formatting actually do?',
          answer:
            'It re-indents JSON text so nested objects and arrays are readable, with consistent spacing and line breaks. Minifying does the reverse: it strips all whitespace to produce the smallest possible payload for transmission or storage.',
        },
        {
          question: 'Why does validation matter?',
          answer:
            'A single misplaced comma or unclosed bracket makes JSON unparseable, and most parsers only report a byte offset, not a clear reason. This tool converts that offset into a line and column and describes the problem in plain language, so you can find and fix the issue directly in your editor.',
        },
        {
          question: 'Does this tool store or upload my JSON anywhere?',
          answer:
            'No. Parsing and formatting run entirely in your browser using JavaScript — for very large files, in a background Web Worker so the page stays responsive. Nothing you paste here is sent to a server, logged, or saved.',
        },
        {
          question: 'When would I use this?',
          answer:
            'Common cases: cleaning up a minified API response before reading it, checking a config file or webhook payload for syntax errors, or minifying a JSON payload before shipping it in a request.',
        },
      ]}
    >
      <JsonFormatter />
    </ToolShell>
  );
}
