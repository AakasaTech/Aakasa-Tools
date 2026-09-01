import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { GifMaker } from './GifMaker';

const TITLE = 'GIF Maker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Create animated GIFs from a series of images — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/gif-maker';

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

export default function GifMakerPage() {
  return (
    <ToolShell
      title="GIF Maker"
      description="Create animated GIFs from a series of images — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-compressor', 'image-resizer', 'format-converter']}
      faq={[
        {
          question: 'How do I make a GIF with this tool?',
          answer:
            'Upload the sequence of images you want as frames, drag them into the order you want, set how long each frame should stay on screen (either one duration for all of them, or an individual override per frame), and generate. The result is a standard animated GIF you can download.',
        },
        {
          question: 'Why is my GIF file so large?',
          answer:
            "More frames, larger dimensions, and more colors all increase GIF file size significantly — that's an inherent property of the GIF format itself, not a limitation of this tool. GIF isn't an efficient format by modern standards (formats like WebP or APNG compress animation far better), so a long or large GIF can end up surprisingly big. Fewer/smaller frames and a shorter duration are the most effective ways to keep the file size down.",
        },
        {
          question: 'Why do my photos look banded or speckled in the output?',
          answer:
            'GIF supports at most 256 colors per frame, chosen from your image and shared across the whole frame. Source images with smooth gradients or photographic detail often have far more distinct colors than that, so some visible banding or dithering is expected, normal GIF behavior — not a bug in this tool. The dithering option can soften harsh banding at the cost of a slightly noisier look.',
        },
        {
          question: 'Are my images uploaded anywhere?',
          answer: 'No. Every frame is combined and encoded into the final GIF entirely in your browser — nothing is sent to a server.',
        },
      ]}
    >
      <GifMaker />
    </ToolShell>
  );
}
