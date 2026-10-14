import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { AspectRatioCalculator } from './AspectRatioCalculator';

const TITLE = 'Aspect Ratio Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Calculate and convert aspect ratios and dimensions instantly, right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/aspect-ratio-calculator';

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

export default function AspectRatioCalculatorPage() {
  return (
    <ToolShell
      title="Aspect Ratio Calculator"
      description="Calculate and convert aspect ratios and dimensions instantly."
      category="calculators"
      tier="free"
      relatedTools={['dpi-calculator', 'image-resizer', 'unit-converter']}
      faq={[
        {
          question: 'What is an aspect ratio?',
          answer:
            'The proportional relationship between a shape\'s width and height, written as two numbers separated by a colon. 16:9 is standard widescreen video, 4:3 was the standard for older TVs and monitors, and 1:1 (square) is common for social media posts — the actual pixel dimensions can vary widely while the ratio between width and height stays the same.',
        },
        {
          question: 'How do the two calculator modes work?',
          answer:
            '"Dimensions from ratio" takes a ratio (like 16:9) plus either a width or a height, and computes the other dimension so the pair matches that ratio exactly. "Ratio from dimensions" does the reverse: given a width and height, it reduces them to the simplest exact integer ratio using genuine GCD-based simplification — not a lookup against a fixed list of common ratios — so an unusual resolution like 2560×1600 correctly simplifies to 8:5 rather than being forced to the nearest familiar ratio like 16:9.',
        },
        {
          question: 'Why does the result show a "nearest common ratio" sometimes?',
          answer:
            'When your dimensions don\'t exactly match a well-known standard ratio, the tool shows which standard ratio is numerically closest — useful context for choosing a familiar target ratio — without ever pretending it\'s an exact match when it isn\'t.',
        },
        {
          question: 'Does this tool store or upload anything I enter?',
          answer: 'No. Every calculation happens entirely in your browser. Nothing is sent to a server, logged, or saved.',
        },
      ]}
    >
      <AspectRatioCalculator />
    </ToolShell>
  );
}
