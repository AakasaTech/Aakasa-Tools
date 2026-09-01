import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CollageMaker } from './CollageMaker';

const TITLE = 'Collage Maker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Combine multiple photos into one collage layout — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/collage-maker';

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

export default function CollageMakerPage() {
  return (
    <ToolShell
      title="Collage Maker"
      description="Combine multiple photos into one collage layout — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-resizer', 'image-compressor', 'format-converter']}
      faq={[
        {
          question: 'How do I make a collage with this tool?',
          answer:
            'Pick a layout template (each one has a fixed number of photo cells), drop or click to add a photo into each cell, then adjust how each photo is cropped, add spacing or corner rounding if you want, and download the result.',
        },
        {
          question: "Why is my photo cropped instead of showing the whole thing?",
          answer:
            "Every cell in a layout has its own fixed shape, and your source photos will rarely match that shape exactly — so each photo is scaled to fill its cell completely, cropping whatever doesn't fit, rather than leaving empty gaps or squashing the image out of proportion. This is standard collage behavior. You can drag within a cell to choose which part of the photo stays visible, and use the zoom slider for more control.",
        },
        {
          question: 'Is my photo uploaded anywhere?',
          answer: 'No. Every photo you add and the final collage you download are composited entirely on your device — nothing is sent to a server.',
        },
      ]}
    >
      <CollageMaker />
    </ToolShell>
  );
}
