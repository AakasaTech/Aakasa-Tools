import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ColorConverter } from './ColorConverter';

const TITLE = 'Color Format Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert colors between HEX, RGB, HSL, and CMYK instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/color-converter';

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

export default function ColorConverterPage() {
  return (
    <ToolShell
      title="Color Format Converter"
      description="Convert colors between HEX, RGB, HSL, and CMYK instantly."
      category="color-design"
      tier="free"
      relatedTools={['color-palette', 'contrast-checker', 'css-gradient-generator']}
      faq={[
        {
          question: 'What are HEX, RGB, HSL, and CMYK, and when is each used?',
          answer:
            'HEX (like #3B82F6), RGB (red/green/blue, 0-255 each), and HSL (hue/saturation/lightness) all describe color the way screens actually produce it — light, added together — and are what you\'ll use in CSS, design tools, and anywhere else on the web. CMYK (cyan/magenta/yellow/black percentages) is different: it\'s how printers mix ink, a subtractive process, and is the format print shops and print-design software expect.',
        },
        {
          question: 'How accurate is the CMYK conversion?',
          answer:
            "It's a reasonable approximation, not an exact print-color match. Screens create color by emitting light (additive — RGB) and printers create color by mixing ink on paper (subtractive — CMYK), and those two processes simply don't reproduce color the same way. A true, exact conversion needs a real color-managed workflow with ICC profiles calibrated to a specific printer and paper stock — something a browser-based calculator can't replicate. Use this conversion as a solid reference starting point, not a guarantee that what you see on screen is exactly what will print.",
        },
        {
          question: 'Can I type a value directly instead of using the color picker?',
          answer:
            "Yes — every format's fields accept direct typing or pasting, not just the color picker. That's the more common real use case: you already have a color value from somewhere (a design spec, a style guide, another tool) in one format and need it in another, so just type or paste it into that format's field and every other format updates immediately.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every conversion happens locally in your browser.',
        },
      ]}
    >
      <ColorConverter />
    </ToolShell>
  );
}
