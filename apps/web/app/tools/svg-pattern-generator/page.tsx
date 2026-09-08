import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { SvgPatternGenerator } from './SvgPatternGenerator';

const TITLE = 'SVG Pattern Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Design seamless, tileable SVG background patterns, free.';
const CANONICAL_URL = 'https://aakasa.dev/tools/svg-pattern-generator';

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

export default function SvgPatternGeneratorPage() {
  return (
    <ToolShell
      title="SVG Pattern Generator"
      description="Design seamless, tileable SVG background patterns, free."
      category="color-design"
      tier="free"
      relatedTools={['css-gradient-generator', 'color-palette', 'border-radius-generator']}
      faq={[
        {
          question: 'What makes a pattern "seamless" or "tileable"?',
          answer:
            "It means the pattern's edges align perfectly with the next repetition of itself — so when it's repeated over and over to fill a large area, there's no visible seam line or break where one copy ends and the next begins. Every pattern this tool generates is built specifically to satisfy that: each shape is drawn so it lines up exactly with its own repeat, both left-to-right and top-to-bottom.",
        },
        {
          question: 'What are these patterns typically used for?',
          answer:
            'Common uses include website and app backgrounds, subtle textures behind content sections, decorative fills in design mockups, and print or packaging design elements. A seamless pattern is specifically useful anywhere you need to fill an area of unknown or flexible size without the repetition becoming visually obvious.',
        },
        {
          question: 'How do I actually use the pattern I export?',
          answer:
            'The "Copy as CSS" snippet is the most direct route for a website: paste it onto any element and it sets `background-image` to the pattern (encoded as a data URI, so there\'s no separate image file to host) plus `background-repeat: repeat`, which tiles it automatically to fill the element. The downloaded SVG file is useful when you want an actual image file — for a design tool, a print layout, or anywhere that expects a real file rather than inline CSS. The PNG export renders the same pattern as a raster image at a chosen size, for contexts that need a bitmap instead of vector/CSS.',
        },
        {
          question: 'Is anything I design here uploaded anywhere?',
          answer: 'No — every pattern is generated and rendered entirely in your browser.',
        },
      ]}
    >
      <SvgPatternGenerator />
    </ToolShell>
  );
}
