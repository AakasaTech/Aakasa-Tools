import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { PlaceholderImageGenerator } from './PlaceholderImageGenerator';

const TITLE = 'Placeholder Image Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate placeholder images with custom dimensions, colors, and text — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/placeholder-image-generator';

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

export default function PlaceholderImageGeneratorPage() {
  return (
    <ToolShell
      title="Placeholder Image Generator"
      description="Generate placeholder images with custom dimensions, colors, and text — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['color-palette', 'favicon-generator', 'contrast-checker']}
      faq={[
        {
          question: 'What is this actually useful for?',
          answer:
            'Mockups, wireframes, and testing a layout before real assets exist — dropping in an image with the right dimensions so you can check how a page, card grid, or responsive breakpoint actually looks and behaves, without waiting on final photography or design.',
        },
        {
          question: 'How do the dimension, text, and color options work?',
          answer:
            "Set a width and height (or pick a common preset — square, 16:9, an Open Graph image size, common social sizes), choose a solid color, two-color gradient, or a subtle pattern for the background, and optionally add your own label text — left blank, it defaults to showing the image's own dimensions (e.g. \"800 × 600\"), the standard placeholder-image convention.",
        },
        {
          question: 'Does this give me a stable image URL I can link to, like placeholder.com?',
          answer:
            "No — this generates a downloadable image file, entirely in your browser. It doesn't host anything or provide a persistent URL the way a server-backed placeholder service does. If you need a URL you can drop straight into an <img src>  without hosting the file yourself, that's a different category of tool than what this one offers.",
        },
        {
          question: 'Is anything I create here uploaded anywhere?',
          answer: 'No. The image is rendered and exported entirely on your device — nothing is sent anywhere.',
        },
      ]}
    >
      <PlaceholderImageGenerator />
    </ToolShell>
  );
}
