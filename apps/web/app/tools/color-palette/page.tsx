import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ColorPaletteTool } from './ColorPaletteTool';

const TITLE = 'Color Palette Generator & Extractor - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate color palettes from color theory rules, or extract dominant colors from any image — instantly, in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/color-palette';

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

export default function ColorPalettePage() {
  return (
    <ToolShell
      title="Color Palette Generator & Extractor"
      description="Generate color palettes or extract them from any image — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['contrast-checker', 'css-gradient-generator', 'favicon-generator']}
      faq={[
        {
          question: 'How does palette generation work?',
          answer:
            'Pick a base color and a harmony rule, and the tool rotates that color\'s hue by fixed amounts to build the rest of the palette — the same color theory designers use by hand. Complementary picks the color directly opposite on the color wheel for high contrast. Analogous picks neighbors for a calmer, cohesive look. Triadic and tetradic space colors evenly around the wheel for balanced variety. Split-complementary softens a complementary pair by using the two colors next to the opposite hue instead of the opposite itself. Monochromatic keeps the same hue and varies only lightness.',
        },
        {
          question: 'How does color extraction from an image work?',
          answer:
            'The image is drawn to an off-screen canvas and its pixel data is read directly in your browser. Rather than listing every unique pixel color — which for a photo could be millions — the tool groups similar colors together using a technique called median-cut quantization and reports the handful of colors that best represent the image, ranked by how much of the image they cover.',
        },
        {
          question: 'What can I use these palettes for?',
          answer:
            'Common uses include picking a brand color scheme, theming a UI (buttons, backgrounds, accents), building a mood board from a reference photo, or pulling a cohesive palette out of a product photo or logo. Every swatch can be copied as hex, RGB, HSL, or a CSS custom property, so you can paste it directly into whatever you\'re building.',
        },
        {
          question: 'Is my uploaded image sent anywhere?',
          answer:
            'No. Images are read and processed entirely in your browser using the Canvas API — nothing is uploaded, logged, or transmitted. Closing or reloading the tab discards everything.',
        },
      ]}
    >
      <ColorPaletteTool />
    </ToolShell>
  );
}
