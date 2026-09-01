import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { BoxShadowGenerator } from './BoxShadowGenerator';

const TITLE = 'CSS Box-Shadow Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Design and export CSS box-shadows with a live visual editor — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/box-shadow-generator';

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

export default function BoxShadowGeneratorPage() {
  return (
    <ToolShell
      title="CSS Box-Shadow Generator"
      description="Design and export CSS box-shadows with a live visual editor — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['css-gradient-generator', 'color-palette']}
      faq={[
        {
          question: 'What does each box-shadow parameter actually control?',
          answer:
            'Offset X and Offset Y move the shadow horizontally and vertically relative to the element — positive Y pushes it down, negative pulls it up. Blur radius controls how soft and spread-out the shadow\'s edge is; 0 gives a hard-edged shadow, larger values feather it out. Spread radius grows or shrinks the shadow\'s size independently of the element itself, before blur is applied. Color (with opacity) sets the shadow\'s color and how strong it looks — real shadows are almost always semi-transparent, not solid black.',
        },
        {
          question: "What's the difference between an outer shadow and an inset shadow?",
          answer:
            'By default a box-shadow renders outside the element\'s edges, like light is casting a shadow behind it. Adding the "inset" keyword flips that — the shadow renders inside the element\'s border instead, which reads more like a carved-in or pressed-in effect. Same parameters, opposite direction.',
        },
        {
          question: 'Can I use more than one shadow at once?',
          answer:
            'Yes — CSS box-shadow accepts a comma-separated list of shadows, all rendered together, with later ones layering on top of earlier ones. Most polished, realistic-looking shadows in real interfaces are actually 2-3 stacked shadows with different blur/spread/opacity rather than a single one, which is exactly what this tool\'s multi-layer editor is built for.',
        },
        {
          question: 'Is anything about my design sent anywhere?',
          answer: 'No. The preview and the generated CSS are both built entirely in your browser.',
        },
      ]}
    >
      <BoxShadowGenerator />
    </ToolShell>
  );
}
