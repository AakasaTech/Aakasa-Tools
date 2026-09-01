import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { WatermarkAdder } from './WatermarkAdder';

const TITLE = 'Watermark Adder - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Add a text or image watermark to your photos — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/watermark-adder';

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

export default function WatermarkAdderPage() {
  return (
    <ToolShell
      title="Watermark Adder"
      description="Add a text or image watermark to your photos — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-compressor', 'image-resizer', 'format-converter']}
      faq={[
        {
          question: 'Why would I add a watermark to my photos?',
          answer:
            "The two most common reasons: protecting your ownership or attribution on photos you share publicly (a name, © notice, or website URL embedded in the image itself, not just the caption), and branding — putting a logo on photos so they're recognizably yours wherever they end up.",
        },
        {
          question: 'Should I use a subtle tiled watermark or a bold single one?',
          answer:
            "It's a genuine trade-off. A single bold watermark in one corner is the most visible deterrent and clearly communicates ownership, but it's also the easiest to crop out entirely. A subtle, tiled/repeated watermark across the whole image is far more resistant to simple cropping — removing it would require covering or editing large parts of the photo — but it's more visually intrusive and covers more of the image. Pick based on whether visibility or resistance-to-removal matters more for your use case.",
        },
        {
          question: 'Will a watermark stop someone determined from removing it?',
          answer:
            "Being honest here: no watermark is fully tamper-proof. Someone determined enough — with enough time and the right editing tools — can crop, clone-stamp, or AI-inpaint around most watermarks, including tiled ones. What a watermark actually does well is deter casual reuse and make ownership obvious to anyone who isn't specifically trying to strip it out. Treat it as a deterrent and an attribution marker, not a security measure.",
        },
        {
          question: 'Are my photos or logo uploaded anywhere?',
          answer:
            'No. Reading your photos, compositing the watermark, and generating the final downloads all happen entirely on your device using the Canvas API — nothing is uploaded to a server, including any logo image you use as a watermark.',
        },
      ]}
    >
      <WatermarkAdder />
    </ToolShell>
  );
}
