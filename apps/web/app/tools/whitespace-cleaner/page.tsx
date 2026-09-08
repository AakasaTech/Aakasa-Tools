import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { WhitespaceCleaner } from './WhitespaceCleaner';

const TITLE = 'Line Break & Whitespace Cleaner - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Clean up extra spaces, line breaks, and whitespace from text, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/whitespace-cleaner';

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

export default function WhitespaceCleanerPage() {
  return (
    <ToolShell
      title="Line Break & Whitespace Cleaner"
      description="Clean up extra spaces, line breaks, and whitespace from text, instantly."
      category="text-writing"
      tier="free"
      relatedTools={['duplicate-line-remover', 'word-counter', 'html-entity-tool']}
      faq={[
        {
          question: 'Where does messy whitespace usually come from?',
          answer:
            "Copy-pasting is the usual culprit — text pulled from a PDF, an email, or a word processor often brings along extra spaces, inconsistent line breaks, or invisible characters that aren't obvious just by looking at it, but can cause confusing issues later (a search that mysteriously doesn't match, or code that doesn't parse) since the text \"looks right\" while behaving oddly.",
        },
        {
          question: 'What does each cleaning option actually do?',
          answer:
            'Trimming removes leading/trailing spaces from each line. Collapsing spaces turns multiple consecutive spaces into one. Blank-line handling either caps how many blank lines in a row are allowed or removes them entirely — pick one, not both, since applying both would be redundant. Removing line breaks joins everything into a single flowing paragraph, useful for text that was broken into short lines by whatever you copied it from. Normalizing line endings converts every \\r\\n and \\r to a plain \\n — invisible to the eye, but genuinely useful before pasting into code or anywhere line-ending consistency matters. And removing invisible characters strips things like non-breaking spaces and zero-width characters that can silently break search or string comparisons.',
        },
        {
          question: 'How does this handle text pasted from a Windows source?',
          answer:
            'Windows-originated text commonly uses \\r\\n line endings, while other sources may use plain \\n (or, rarely, a lone \\r). This tool normalizes all three consistently rather than only handling \\n and leaving stray \\r characters behind — so pasting from mixed sources doesn\'t leave a hidden mess in the output.',
        },
        {
          question: 'Is anything I paste here sent anywhere?',
          answer: 'No — every cleaning operation happens locally in your browser.',
        },
      ]}
    >
      <WhitespaceCleaner />
    </ToolShell>
  );
}
