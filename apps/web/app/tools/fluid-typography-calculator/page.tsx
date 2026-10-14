import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FluidTypographyCalculator } from './FluidTypographyCalculator';

const TITLE = 'Fluid Typography Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate responsive CSS clamp() font sizes that scale smoothly with viewport width, right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/fluid-typography-calculator';

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

export default function FluidTypographyCalculatorPage() {
  return (
    <ToolShell
      title="Fluid Typography Calculator"
      description="Generate responsive CSS clamp() font sizes that scale smoothly with viewport width."
      category="color-design"
      tier="free"
      relatedTools={['flexbox-grid-playground', 'css-gradient-generator', 'font-pairing']}
      faq={[
        {
          question: 'What is fluid typography, and why use clamp() for it?',
          answer:
            'Fluid typography scales font size smoothly across the whole range of viewport widths, instead of jumping abruptly at fixed breakpoints the way media-query-based responsive type does. A single CSS clamp() declaration — clamp(minimum, preferred, maximum) — replaces what would otherwise take several media queries: the preferred value grows linearly with viewport width, while the minimum and maximum bounds keep it from ever getting too small or too large.',
        },
        {
          question: 'How does the underlying math work?',
          answer:
            "The preferred value is a straight line as a function of viewport width, pinned to hit exactly your minimum font size at your minimum viewport width and exactly your maximum font size at your maximum viewport width. That line has a slope (how fast the size grows per pixel of viewport) and a y-intercept (what the line's value would be at a viewport width of zero) — CSS expresses the slope as a vw-based term, since 1vw is always 1% of the current viewport width, and the y-intercept as a fixed rem offset added to it. That rem offset assumes a 16px root font size (the standard browser default) when converting between px and rem — if a page sets a different root size, the rem-expressed bounds will represent a different absolute pixel size than intended.",
        },
        {
          question: 'Is clamp() supported in browsers I need to support?',
          answer:
            "Yes — clamp() has had broad support across all major browsers (Chrome, Firefox, Safari, Edge) since 2020, so it's safe to use in production for the vast majority of real-world audiences today.",
        },
        {
          question: 'Does this tool store or upload anything I enter?',
          answer: 'No. Every calculation — the clamp() formula, the live preview, the type scale — runs entirely in your browser. Nothing is sent to a server, logged, or saved.',
        },
      ]}
    >
      <FluidTypographyCalculator />
    </ToolShell>
  );
}
