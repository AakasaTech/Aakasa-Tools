import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { AsciiArtGenerator } from './AsciiArtGenerator';

const TITLE = 'Text to ASCII Art Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert text into ASCII art banners instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/ascii-art-generator';

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

export default function AsciiArtGeneratorPage() {
  return (
    <ToolShell
      title="Text to ASCII Art Generator"
      description="Convert text into ASCII art banners instantly."
      category="text-writing"
      tier="free"
      relatedTools={['word-counter', 'case-converter', 'html-entity-tool']}
      faq={[
        {
          question: 'What are ASCII art text banners used for?',
          answer:
            'Common uses include code comment headers, terminal/CLI splash screens, README file headers on GitHub, and forum or email signatures — anywhere a plain-text environment could use a bit of visual flair that a real image can\'t be embedded into.',
        },
        {
          question: 'How many font styles are available?',
          answer:
            'This tool offers a curated selection of 20 distinct styles — spanning classic block letters, slim/compact styles, and a few playful, decorative ones — out of the hundreds bundled with the underlying font library, picked for genuine visual variety rather than overwhelming you with near-duplicates.',
        },
        {
          question: "Why doesn't the alignment look right when I paste it somewhere?",
          answer:
            "ASCII art depends entirely on every character occupying the same width — a monospace font. If you paste it into a context that uses a proportional font (many email clients, chat apps, or word processors by default) or that collapses whitespace, the careful alignment will visibly break. Paste it somewhere that preserves monospace formatting and whitespace exactly — a code block, a terminal, or a plain-text editor — to see it as intended.",
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer: 'No — every banner is generated locally in your browser.',
        },
      ]}
    >
      <AsciiArtGenerator />
    </ToolShell>
  );
}
