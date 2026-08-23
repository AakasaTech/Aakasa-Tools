import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ImageCompressor } from './ImageCompressor';

const TITLE = 'Free Image Compressor - Reduce File Size Online | Aakasa Toolbox';
const DESCRIPTION =
  'Compress JPG, PNG, and WebP images in your browser. Batch compression, no upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/image-compressor';

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

export default function ImageCompressorPage() {
  return (
    <ToolShell
      title="Image Compressor"
      description="Compress JPG, PNG, and WebP images — right in your browser, nothing uploaded."
      category="image"
      tier="free"
      relatedTools={[]}
      faq={[
        {
          question: 'Does this actually make images smaller without losing quality?',
          answer:
            'It depends on the format. JPEG and WebP compression here is lossy — it discards some image detail to shrink the file, and the quality slider controls how much. PNG is different: PNG re-encoding is closer to lossless optimization, since the format doesn’t support a quality setting at all — this tool just re-encodes the pixel data more efficiently, so PNG output looks identical to the original at a somewhat smaller size.',
        },
        {
          question: 'Why does the size reduction vary so much between images?',
          answer:
            'File size reduction depends heavily on image content. Photos with soft gradients, texture, and lots of color variation compress a lot, because lossy compression is very effective at approximating that kind of detail. Screenshots and graphics with sharp edges, flat colors, and text compress far less, since those features are exactly what lossy compression struggles to simplify without visible artifacts.',
        },
        {
          question: 'What quality setting should I use?',
          answer:
            'For most web use, a JPEG or WebP quality between 70 and 85 is a reasonable starting point — it usually looks visually identical to the original while cutting file size significantly. Go higher for images with fine detail (product photography, text-heavy screenshots) and lower for background or decorative images where some softness is not noticeable.',
        },
        {
          question: 'Are my images uploaded anywhere?',
          answer:
            'No. Every image is decoded, resized, and re-encoded entirely inside your browser using the Canvas API and a background Web Worker — nothing is sent to a server. This matters in particular for personal photos: you can compress them here without them ever leaving your device.',
        },
      ]}
    >
      <ImageCompressor />
    </ToolShell>
  );
}
