import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { TextSorter } from './TextSorter';

const TITLE = 'Text Sorter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Sort lines of text alphabetically, numerically, or by length, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/text-sorter';

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

export default function TextSorterPage() {
  return (
    <ToolShell
      title="Text Sorter"
      description="Sort lines of text alphabetically, numerically, or by length, instantly."
      category="text-writing"
      tier="free"
      relatedTools={['duplicate-line-remover', 'word-counter', 'csv-viewer']}
      faq={[
        {
          question: 'What sort modes are available?',
          answer:
            'Alphabetical (A–Z or Z–A, with an optional case-sensitivity toggle), natural/numeric sort (handles embedded numbers the way a person would expect — see the next question), by length (shortest to longest or the reverse), and a random shuffle for when you want a randomized order, like drawing names for a raffle.',
        },
        {
          question: 'What\'s the difference between alphabetical and "natural" sort?',
          answer:
            'Plain alphabetical sorting compares text character by character, which trips up on embedded numbers: sorting ["item2", "item10", "item1"] alphabetically produces ["item1", "item10", "item2"] — "item10" lands before "item2" because "1" comes before "2" as a character, regardless of the full number\'s value. Natural sort fixes this by comparing the numeric parts of each line as actual numbers, producing the order most people actually expect: ["item1", "item2", "item10"].',
        },
        {
          question: 'Why does alphabetical sort handle capital letters differently from a basic sort?',
          answer:
            'A naive character-code sort puts every uppercase letter before every lowercase one (since \'A\'–\'Z\' sit below \'a\'–\'z\' in character encoding), so a list like ["banana", "Apple", "apple", "Banana"] would sort as ["Apple", "Banana", "apple", "banana"] — all-capitalized words first, regardless of their actual letter. This tool uses locale-aware collation instead, which compares by the base letter first, so "apple" and "Apple" land next to each other the way a person alphabetizing a list actually would.',
        },
        {
          question: 'Is anything I paste here sent anywhere?',
          answer: 'No — every sort happens locally in your browser.',
        },
      ]}
    >
      <TextSorter />
    </ToolShell>
  );
}
