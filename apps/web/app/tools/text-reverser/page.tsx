import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { TextReverser } from './TextReverser';

const TITLE = 'Text Reverser & Palindrome Checker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = "Reverse text and check if it's a palindrome, instantly.";
const CANONICAL_URL = 'https://aakasa.dev/tools/text-reverser';

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

export default function TextReverserPage() {
  return (
    <ToolShell
      title="Text Reverser & Palindrome Checker"
      description="Reverse text and check if it's a palindrome, instantly."
      category="text-writing"
      tier="free"
      relatedTools={['word-counter', 'case-converter', 'regex-tester']}
      faq={[
        {
          question: 'What is a palindrome?',
          answer: 'Text that reads the same forwards and backwards — "racecar" and "level" are simple examples.',
        },
        {
          question: 'How does the palindrome check handle spaces, punctuation, and capitalization?',
          answer:
            'By default, this tool ignores spaces, punctuation, and case — the everyday, human sense of "palindrome" that most people mean, under which something like "A man, a plan, a canal: Panama" counts as a palindrome even though it\'s not literally identical to its own reversal character-for-character. A "strict" mode is also available for when you want an exact, character-for-character comparison instead, including spacing, punctuation, and case — under strict rules, that same phrase is NOT a palindrome.',
        },
        {
          question: 'Why do the different reversal modes matter?',
          answer:
            'Reversing an entire string, reversing the ORDER of its words, and reversing the letters WITHIN each word (while keeping word order intact) are three genuinely different operations with different uses — full reversal for a novelty/cipher effect, word-order reversal for restructuring a phrase, and per-word letter reversal for a specific stylistic effect while keeping the sentence readable in structure.',
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer: 'No — every operation happens locally in your browser.',
        },
      ]}
    >
      <TextReverser />
    </ToolShell>
  );
}
