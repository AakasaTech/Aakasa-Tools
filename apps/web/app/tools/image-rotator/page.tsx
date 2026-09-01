import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ImageRotator } from './ImageRotator';

const TITLE = 'Image Rotator & Flipper - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Rotate and flip images instantly — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/image-rotator';

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

export default function ImageRotatorPage() {
  return (
    <ToolShell
      title="Image Rotator & Flipper"
      description="Rotate and flip images instantly — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-resizer', 'image-compressor', 'format-converter']}
      faq={[
        {
          question: 'What can this tool do?',
          answer:
            'Rotate an image in 90° increments, rotate by any custom angle, and flip it horizontally or vertically — any combination of these, applied to one image or a whole batch at once.',
        },
        {
          question: "Why does the image size sometimes change after rotating?",
          answer:
            "This only happens for a custom-angle rotation that isn't a multiple of 90°. Rotating a rectangle by, say, 37° produces a shape whose bounding box is genuinely larger than the original in both directions — to avoid cutting off the corners, the output canvas expands to fit the whole rotated image, so the exported file's pixel dimensions can differ from the source. Rotating by exactly 90°, 180°, or 270° never has this effect (at most it swaps width and height).",
        },
        {
          question: "What fills the empty corners after a custom-angle rotation?",
          answer:
            'Whatever you choose — by default those corners stay transparent (for PNG/WebP output), but you can turn on a fill color instead. JPEG has no transparency at all, so a fill color is always applied there, defaulting to white.',
        },
        {
          question: 'Is my image uploaded anywhere?',
          answer: 'No. Every rotation and flip happens locally in your browser using the Canvas API — your images are never sent to a server.',
        },
      ]}
    >
      <ImageRotator />
    </ToolShell>
  );
}
