import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { LoremIpsumGenerator } from './LoremIpsumGenerator';

const TITLE = 'Lorem Ipsum Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate placeholder Lorem Ipsum text for mockups and designs.';
const CANONICAL_URL = 'https://aakasa.dev/tools/lorem-ipsum-generator';

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

export default function LoremIpsumGeneratorPage() {
  return (
    <ToolShell
      title="Lorem Ipsum Generator"
      description="Generate placeholder Lorem Ipsum text for mockups and designs."
      category="text-writing"
      tier="free"
      relatedTools={['word-counter', 'placeholder-image-generator', 'html-entity-tool']}
      faq={[
        {
          question: 'What is Lorem Ipsum, and why use it instead of real text?',
          answer:
            "It's scrambled, derived Latin text used as placeholder content in design and typesetting. The point is that it reads as plausible body text — realistic word lengths, sentence rhythm, paragraph shape — without actually being readable in a way that distracts the eye. Real English text pulls a viewer's attention toward its meaning; Lorem Ipsum lets them focus on the layout, typography, and spacing instead, which is exactly what matters when you're mocking up a design.",
        },
        {
          question: 'Where does this text actually come from?',
          answer:
            'It traces back to a 1st-century-BC Latin text by Cicero, "De Finibus Bonorum et Malorum" — scrambled and assembled into this exact placeholder-text form by an unknown printer in the 1500s. The convention of using it for mockups has been standard practice ever since, long before desktop publishing existed, and the passage itself is public domain.',
        },
        {
          question: 'What\'s the "Corporate Buzzword" style?',
          answer:
            'A bonus, secondary option alongside the classic Latin default — placeholder text built from an original, made-for-this-tool set of business-jargon words and sentence templates, for when you want mockup copy with a bit more personality than Latin. It\'s entirely optional; Classic Latin remains the default.',
        },
        {
          question: 'Is anything I generate here sent anywhere?',
          answer: 'No — every bit of text is generated locally in your browser.',
        },
      ]}
    >
      <LoremIpsumGenerator />
    </ToolShell>
  );
}
