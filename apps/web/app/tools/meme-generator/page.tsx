import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { MemeGenerator } from './MemeGenerator';

const TITLE = 'Meme Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Create memes with custom text — no watermark, no signup, entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/meme-generator';

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

export default function MemeGeneratorPage() {
  return (
    <ToolShell
      title="Meme Generator"
      description="Create memes with custom text — no watermark, no signup, entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['watermark-adder', 'image-resizer', 'format-converter']}
      faq={[
        {
          question: 'How do I make a meme with this tool?',
          answer:
            'Upload your own image, then edit the top and bottom caption boxes that start pre-placed on it — or add as many additional text boxes as you want and drag each one anywhere on the image. Adjust font, size, color, and outline per box, then download the result as a PNG.',
        },
        {
          question: 'Do you provide meme templates I can pick from?',
          answer:
            "No — this tool is bring-your-own-image only. Most well-known meme templates are copyrighted photos, film stills, or images of real people, and we'd rather not bundle a gallery of those into the tool. You supply the base image (a photo you own or have the right to use), and the tool handles the text.",
        },
        {
          question: 'Can I add more than the classic top/bottom text?',
          answer:
            "Yes. The tool starts with the traditional top-text/bottom-text pair, but you can add extra text boxes and drag each one to any position on the image — useful for the many meme formats that don't stick to the classic top/bottom-only layout.",
        },
        {
          question: 'Is my image uploaded anywhere?',
          answer:
            'No. The image you upload, every text box you add, and the final rendered meme all stay on your device — everything is composited locally using the Canvas API, and nothing is sent to a server.',
        },
      ]}
    >
      <MemeGenerator />
    </ToolShell>
  );
}
