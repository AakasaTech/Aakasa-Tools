import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CssGradientGenerator } from './CssGradientGenerator';

const TITLE = 'CSS Gradient Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Design and export CSS gradients with a live visual editor — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/css-gradient-generator';

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

export default function CssGradientGeneratorPage() {
  return (
    <ToolShell
      title="CSS Gradient Generator"
      description="Design and export CSS gradients with a live visual editor — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['color-palette']}
      faq={[
        {
          question: "What's the difference between linear, radial, and conic gradients?",
          answer:
            "A linear gradient transitions in a straight line across a given angle — the most common type, used for backgrounds and buttons. A radial gradient transitions outward from a center point in a circle or ellipse, like a spotlight or a glow. A conic gradient sweeps around a center point like the hands of a clock, which makes it the natural choice for things like color wheels or pie-chart-style visuals.",
        },
        {
          question: 'What do color stops and stop positions actually control?',
          answer:
            "A color stop is a color plus a position along the gradient (0% to 100%). Between two adjacent stops, the color transitions smoothly from one to the other. Moving a stop's position changes where that color sits and how much of the gradient is spent transitioning into and out of it — bunching stops close together creates a sharp transition, while spreading them out creates a slow, soft blend.",
        },
        {
          question: 'Will these gradients work in every browser?',
          answer:
            "Yes — linear, radial, and conic CSS gradients are all supported in every modern browser at this point (conic gradients being the most recently added, but still broadly supported for several years now). No prefixes or fallbacks needed for typical use.",
        },
        {
          question: 'Is anything about my gradient sent anywhere?',
          answer: 'No. Every part of this tool — building, previewing, and exporting the CSS — runs locally in your browser.',
        },
      ]}
    >
      <CssGradientGenerator />
    </ToolShell>
  );
}
