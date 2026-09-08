import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { DuplicateLineRemover } from './DuplicateLineRemover';

const TITLE = 'Duplicate Line Remover - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Remove duplicate lines from a list or text block instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/duplicate-line-remover';

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

export default function DuplicateLineRemoverPage() {
  return (
    <ToolShell
      title="Duplicate Line Remover"
      description="Remove duplicate lines from a list or text block instantly."
      category="text-writing"
      tier="free"
      relatedTools={['text-sorter', 'word-counter', 'csv-viewer']}
      faq={[
        {
          question: 'How does duplicate detection work?',
          answer:
            "It compares lines exactly, one against another — with two configurable adjustments: case-sensitivity (off by default, so \"Example.com\" and \"example.com\" count as the same line) and whitespace trimming (on by default, so trailing spaces on an otherwise-identical line don't stop it being recognized as a duplicate). Whichever occurrence you choose to keep — first or last — always appears in the output with its own original text untouched, even when the comparison itself was case-insensitive or whitespace-trimmed.",
        },
        {
          question: 'What is this actually useful for?',
          answer:
            'Cleaning up an email or contact list that has accumulated repeats, deduplicating a list of URLs or keywords pulled from multiple sources, or tidying up exported data (a CSV export, a log file, a scraped list) before using it somewhere else.',
        },
        {
          question: 'Can I sort the list at the same time as deduplicating it?',
          answer:
            "Yes, but they're separate, optional steps — deduplication runs first, and alphabetical sorting is an independent toggle on top of it, since you might want one without the other.",
        },
        {
          question: 'Is anything I paste here sent anywhere?',
          answer: 'No — every comparison happens locally in your browser.',
        },
      ]}
    >
      <DuplicateLineRemover />
    </ToolShell>
  );
}
