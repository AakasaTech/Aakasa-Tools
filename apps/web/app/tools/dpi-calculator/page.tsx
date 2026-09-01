import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { DpiCalculator } from './DpiCalculator';

const TITLE = 'Image DPI & Dimension Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate print size, pixel dimensions, and DPI/PPI instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/dpi-calculator';

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

export default function DpiCalculatorPage() {
  return (
    <ToolShell
      title="Image DPI & Dimension Calculator"
      description="Calculate print size, pixel dimensions, and DPI/PPI instantly."
      category="calculators"
      tier="free"
      relatedTools={['image-resizer', 'unit-converter', 'placeholder-image-generator']}
      faq={[
        {
          question: 'What do DPI and PPI actually mean — are they the same thing?',
          answer:
            "In casual use, people say \"DPI\" to mean image resolution constantly, and this tool doesn't fight that — it's the term everyone reaches for. Technically, though, they're distinct: DPI (dots per inch) describes a physical output device, specifically how many ink dots a printer lays down per inch. PPI (pixels per inch) describes an image or screen's pixel density. When you're asking \"what resolution should my image be to print well,\" you're really asking about PPI, even though \"DPI\" is what everyone calls it — including, for simplicity, most of this tool's own labeling.",
        },
        {
          question: 'What DPI/PPI value should I actually use?',
          answer:
            '96 PPI is the traditional reference figure for web/screen display — though it\'s worth noting modern high-DPI ("Retina") displays actually render at far higher physical pixel densities than that; 96 persists mainly as a CSS/legacy reference point, not a literal description of any real screen today. For print, 300 DPI is the standard "looks sharp at normal viewing distance" figure for photos and documents; 600 DPI is used for fine detail work where the print will be viewed up close.',
        },
        {
          question: 'What is this tool actually calculating?',
          answer:
            'One simple relationship, rearranged three ways: pixel dimensions = physical size × DPI. Give it any two of pixel dimensions, physical print size, and DPI, and it solves for the third.',
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: "No — not that there's much to protect here, but for consistency: every calculation happens locally in your browser.",
        },
      ]}
    >
      <DpiCalculator />
    </ToolShell>
  );
}
