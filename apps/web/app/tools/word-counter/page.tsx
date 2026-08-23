import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { WordCounter } from './WordCounter';

const TITLE = 'Word & Character Counter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Count words, characters, sentences, and paragraphs, and estimate reading time — instantly, in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/word-counter';

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

export default function WordCounterPage() {
  return (
    <ToolShell
      title="Word & Character Counter"
      description="Count words, characters, sentences, and estimate reading time — instantly, in your browser."
      category="text-writing"
      tier="free"
      relatedTools={['json-formatter', 'regex-tester', 'meta-tag-previewer']}
      faq={[
        {
          question: 'How is word count calculated?',
          answer:
            'Words are counted by splitting text on whitespace — a simple token count, not a linguistic analysis. Hyphenated words count as one, and extra spaces between words don’t inflate the count.',
        },
        {
          question: 'How accurate is the reading time estimate?',
          answer:
            'Reading time assumes 200 words per minute, a commonly used baseline for adult silent reading of general text — actual speed varies a lot by content difficulty and reader, so treat it as a rough guide, not a precise measurement. Speaking time uses 130 words per minute, closer to a comfortable spoken pace for scripts and presentations.',
        },
        {
          question: 'Does this handle non-English or CJK text well?',
          answer:
            'Character counts work correctly for any script. Word counts are less meaningful for languages like Chinese or Japanese that don’t use spaces between words — the whitespace-based method will undercount words in those cases, so lean on the character count instead when working with CJK text.',
        },
        {
          question: 'Is anything I type here saved or sent anywhere?',
          answer:
            'No. Every statistic is computed locally in your browser as you type. Nothing is stored, logged, or transmitted — closing the tab clears everything.',
        },
      ]}
    >
      <WordCounter />
    </ToolShell>
  );
}
