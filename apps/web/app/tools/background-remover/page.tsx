import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { BackgroundRemover } from './BackgroundRemover';
import { ESTIMATED_DOWNLOAD_MB } from './utils/removeBackground';

const TITLE = 'Background Remover - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Remove image backgrounds automatically — free, and entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/background-remover';

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

export default function BackgroundRemoverPage() {
  return (
    <ToolShell
      title="Background Remover"
      description="Remove image backgrounds automatically — free, and entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-compressor', 'format-converter', 'watermark-adder']}
      faq={[
        {
          question: 'How does automatic background removal work?',
          answer:
            "An AI model looks at your photo, identifies the main subject, and separates it from everything behind it — producing a version of the image with the background made transparent. You don't need to manually trace or select anything.",
        },
        {
          question: 'Is my photo uploaded to a server?',
          answer:
            `No — and this is genuinely different from most free background-remover tools you'll find, which upload your photo to their server for processing. This tool downloads its AI model once (about ${ESTIMATED_DOWNLOAD_MB} MB, shown clearly before it starts) and then runs every image through it locally, in your browser. Your photos never leave your device.`,
        },
        {
          question: 'How good is the result — will it always look perfect?',
          answer:
            "It works best on a clear, distinct subject against a fairly uniform background — a person or product photo, for example. Being honest about the limits: fine detail like wispy or flyaway hair, semi-transparent objects (glass, smoke), and low-contrast edges where the subject blends into the background are all genuinely harder cases, and the result may need manual touch-up for those. It's a strong starting point, not a guaranteed-perfect one.",
        },
        {
          question: 'Why does it need to download something first?',
          answer:
            `The AI model that does the actual detection work is a real neural network, not a small script — it has to be downloaded to your browser before it can run. That download only happens once per visit (it's cached after that), and it only starts when you explicitly click to load it — never automatically the moment you land on the page, since that download is meaningfully larger than any other tool in this toolbox and we'd rather you choose that trade-off knowingly, especially on a limited connection.`,
        },
      ]}
    >
      <BackgroundRemover />
    </ToolShell>
  );
}
