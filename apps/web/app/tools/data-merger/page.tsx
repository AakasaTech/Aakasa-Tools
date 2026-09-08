import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { DataMerger } from './DataMerger';

const TITLE = 'CSV & JSON Data Merger - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Combine multiple CSV or JSON files into one dataset, free.';
const CANONICAL_URL = 'https://aakasa.dev/tools/data-merger';

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

export default function DataMergerPage() {
  return (
    <ToolShell
      title="CSV & JSON Data Merger"
      description="Combine multiple CSV or JSON files into one dataset, free."
      category="data-files"
      tier="free"
      relatedTools={['csv-json-converter', 'csv-viewer', 'csv-to-excel']}
      faq={[
        {
          question: 'What does this tool do?',
          answer:
            'It combines multiple CSV and/or JSON files — with the same or similar structure — into one unified dataset, previewed as a table and downloadable as CSV or JSON. Mixed file types are fine in the same merge: each file is parsed according to its own format, then everything is worked with as the same row/column shape from that point on.',
        },
        {
          question: 'What are "Stack rows" and "Join on key", and how do I choose?',
          answer:
            'These are two different, genuinely common ways to combine data. "Stack rows" appends every file\'s rows into one longer list — use it when your files are separate batches of the same kind of record (e.g. exports from different months). "Join on key" is a relational join: it lines up rows ACROSS files that share the same value in a column you pick (like "id" or "email") — use it when your files describe the same set of things but each contributes different columns (e.g. one file has contact info, another has order history, joined on a shared customer ID). Stacking multiplies rows; joining multiplies columns.',
        },
        {
          question: "What happens if my files' columns don't quite match?",
          answer:
            'For "Stack rows": columns that only appear in some files are still included — the union of every column across all files — and rows from a file that lacked a given column simply get an empty cell for it, rather than the tool dropping the column or misaligning data. For "Join on key": the join column has to be common to every file (rename columns first if they\'re named differently, like "email" vs. "Email Address" — this tool includes a simple per-file rename step for exactly that). A left join keeps every row from the first file even when a match isn\'t found elsewhere; an inner join keeps only rows that matched everywhere.',
        },
        {
          question: 'Is anything I upload sent anywhere?',
          answer: 'No — every file is parsed, merged, and previewed entirely in your browser. Nothing is uploaded to a server.',
        },
      ]}
    >
      <DataMerger />
    </ToolShell>
  );
}
