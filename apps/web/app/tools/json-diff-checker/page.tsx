import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { JsonDiffChecker } from './JsonDiffChecker';

const TITLE = 'JSON Diff Checker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Compare two JSON documents and see exactly what changed, by structure not text. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/json-diff-checker';

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

export default function JsonDiffCheckerPage() {
  return (
    <ToolShell
      title="JSON Diff Checker"
      description="Compare two JSON documents and see exactly what changed, by structure not text."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'diff-tool', 'json-to-typescript']}
      faq={[
        {
          question: 'How is this different from a regular text diff?',
          answer:
            "A text diff compares two files line by line, so it flags every difference in whitespace, indentation, or key order — even when the underlying data is identical. This tool parses both documents and compares their JSON structure and values directly, so two documents that are formatted completely differently but represent the same data show zero differences. Use this tool when you care about the data; use a plain text diff when you care about the exact bytes.",
        },
        {
          question: 'How are arrays compared?',
          answer:
            "By default, arrays are compared by index — item 0 in the original is compared against item 0 in the changed document, item 1 against item 1, and so on, since JSON arrays are ordered. If items were reordered without any actual change to their content, by-index comparison reports them as changed even though nothing meaningfully differs. Switching to \"by value\" matches items by their content instead of their position, so reordered-but-identical items show no difference — but this mode can't distinguish a genuine edit from a reorder as precisely, since it matches on value alone.",
        },
        {
          question: 'What does "ignore key order" actually affect?',
          answer:
            'It only changes how keys are ordered in the tree view display — it does not affect which differences are detected. A structural diff already treats key order as insignificant when comparing two objects, so {"a":1,"b":2} and {"b":2,"a":1} are identical either way; this toggle just controls whether the tree shows keys in each document\'s original order or sorted alphabetically.',
        },
        {
          question: 'Does this tool store or upload my JSON anywhere?',
          answer: 'No. Parsing and comparison run entirely in your browser using JavaScript. Nothing you paste here is sent to a server, logged, or saved.',
        },
      ]}
    >
      <JsonDiffChecker />
    </ToolShell>
  );
}
