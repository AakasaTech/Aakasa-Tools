import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ReadabilityAnalyzer } from './ReadabilityAnalyzer';

const TITLE = 'Readability Score Analyzer - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Check the readability of your text with Flesch-Kincaid and other scores.';
const CANONICAL_URL = 'https://aakasa.dev/tools/readability-analyzer';

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

export default function ReadabilityAnalyzerPage() {
  return (
    <ToolShell
      title="Readability Score Analyzer"
      description="Check the readability of your text with Flesch-Kincaid and other scores."
      category="text-writing"
      tier="free"
      relatedTools={['word-counter', 'meta-tag-previewer', 'social-post-previewer']}
      faq={[
        {
          question: 'What does a readability score actually measure?',
          answer:
            "How easy your text is to read, based purely on sentence length and word/syllable complexity — nothing more. It's worth stating plainly: a high readability score is not a measure of content quality, accuracy, or how engaging your writing is. Short, simple sentences can still be boring or wrong; long, complex ones can still be brilliant. This is a structural signal, not a grade on your writing.",
        },
        {
          question: 'What do Flesch Reading Ease and Flesch-Kincaid Grade Level mean?',
          answer:
            'Flesch Reading Ease is a 0–100 scale where higher means easier to read — 90–100 is "Very Easy" (roughly 5th grade), 60–70 is "Standard" (8th–9th grade), and below 30 is "Very Difficult" (college graduate level). Flesch-Kincaid Grade Level converts the same underlying sentence-length and word-complexity measurements into an approximate US school grade level instead — a score of 8.0 roughly corresponds to 8th-grade reading level.',
        },
        {
          question: 'How accurate is the syllable counting behind these scores?',
          answer:
            "It's a well-established heuristic (counting vowel groups, with adjustments for silent endings), not a dictionary lookup — and that's genuinely true of every tool that computes these scores, not a limitation unique to this one. English spelling doesn't map perfectly to pronunciation, so syllable counts (and the scores built on them) are close estimates, not exact measurements. They're reliable enough to be useful for comparing drafts or spotting overly dense paragraphs, not precise to the syllable.",
        },
        {
          question: 'Is anything I paste here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <ReadabilityAnalyzer />
    </ToolShell>
  );
}
