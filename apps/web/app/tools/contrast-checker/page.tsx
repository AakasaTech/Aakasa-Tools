import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ContrastChecker } from './ContrastChecker';

const TITLE = 'Contrast Checker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Check color contrast against WCAG accessibility standards — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/contrast-checker';

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

export default function ContrastCheckerPage() {
  return (
    <ToolShell
      title="Contrast Checker"
      description="Check color contrast against WCAG accessibility standards — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['color-palette', 'css-gradient-generator']}
      faq={[
        {
          question: 'What is contrast ratio, and why does it matter?',
          answer:
            "Contrast ratio measures how different two colors are in relative brightness, expressed as a number from 1:1 (identical, illegible) to 21:1 (pure black on pure white, maximum possible). It matters because text needs enough contrast against its background to be readable — for users with low vision or certain forms of color blindness especially, low-contrast text can be genuinely unreadable, not just harder to read.",
        },
        {
          question: 'What are the actual WCAG thresholds this tool checks?',
          answer:
            'WCAG 2.1 level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. Level AAA, the stricter standard, requires 7:1 for normal text and 4.5:1 for large text. This tool checks your color pair against all four.',
        },
        {
          question: 'What counts as "large text" for the relaxed threshold?',
          answer:
            'WCAG defines large text precisely: 18pt (24px) or larger at regular weight, or 14pt (18.66px) or larger at bold weight. Anything smaller than that — including most body text — is held to the stricter "normal text" threshold, regardless of how it looks.',
        },
        {
          question: 'Is my color data sent anywhere?',
          answer: 'No. Every calculation — contrast ratio, the pass/fail checks, the color suggestions, the color vision simulation — runs locally in your browser.',
        },
      ]}
    >
      <ContrastChecker />
    </ToolShell>
  );
}
