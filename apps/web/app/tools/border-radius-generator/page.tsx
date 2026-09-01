import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { BorderRadiusGenerator } from './BorderRadiusGenerator';

const TITLE = 'CSS Border-Radius & Blob Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Design rounded corners and organic blob shapes with a visual editor — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/border-radius-generator';

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

export default function BorderRadiusGeneratorPage() {
  return (
    <ToolShell
      title="CSS Border-Radius & Blob Generator"
      description="Design rounded corners and organic blob shapes with a visual editor — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['box-shadow-generator', 'css-gradient-generator', 'color-palette']}
      faq={[
        {
          question: 'How does the border-radius shorthand actually work?',
          answer:
            'With one value, all four corners match. With up to four values, they apply in order: top-left, top-right, bottom-right, bottom-left. That covers most cases — but border-radius also supports a less commonly known 8-value form: two sets of up to four values separated by a slash, like "30% 70% 70% 30% / 30% 30% 70% 70%". The first set controls each corner\'s horizontal radius, the second controls its vertical radius, letting a single corner curve more in one direction than the other — that\'s exactly what this tool\'s Blob mode relies on to produce organic, non-circular corners.',
        },
        {
          question: 'What actually makes a shape read as an organic "blob" instead of a rounded rectangle?',
          answer:
            'A plain border-radius corner is a circular arc — set enough radius on all four corners and you get a uniform, geometric rounded shape, not something organic. A blob comes from giving each corner its own independent horizontal and vertical radius (the 8-value syntax above), randomized within a range that keeps the shape smooth rather than spiky. That asymmetry between corners, and between a corner\'s own horizontal and vertical curve, is what breaks up the geometric regularity into something that reads as a natural, hand-drawn silhouette.',
        },
        {
          question: 'Does every browser support this?',
          answer:
            'Yes — the basic border-radius property has been universally supported for well over a decade, and the 8-value elliptical syntax used for blob shapes has been supported in every major browser for just as long. There\'s no meaningful compatibility caveat here.',
        },
        {
          question: 'Is anything about my design sent anywhere?',
          answer: 'No. Every calculation and the entire preview render locally in your browser.',
        },
      ]}
    >
      <BorderRadiusGenerator />
    </ToolShell>
  );
}
