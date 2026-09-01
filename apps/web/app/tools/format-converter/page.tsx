import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FormatConverter } from './FormatConverter';

const TITLE = 'Image Format Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert images between PNG, JPG, WebP, and AVIF — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/format-converter';

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

export default function FormatConverterPage() {
  return (
    <ToolShell
      title="Image Format Converter"
      description="Convert images between PNG, JPG, WebP, and AVIF — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-compressor', 'image-resizer']}
      faq={[
        {
          question: "What's actually different between these formats?",
          answer:
            'PNG is lossless and supports transparency, but produces the largest files. JPEG is lossy, has no transparency support, and is generally the smallest choice for photos. WebP is a modern format that supports both lossy and lossless compression plus transparency, and is usually smaller than either PNG or JPEG at equivalent visual quality. AVIF is the newest of the four and typically produces the smallest files of all, but browser and tool support for encoding it — not just viewing it — is still less universal, which is why this tool checks for it directly rather than assuming it works.',
        },
        {
          question: "What happens if I convert a transparent image to JPEG?",
          answer:
            "JPEG has no alpha channel at all, so any transparency in the source is lost — this tool flattens it onto a background color you choose (white by default) rather than leaving it to an unpredictable default. If any of your images have transparency and JPEG is the target format, a warning appears with a color picker specifically for this.",
        },
        {
          question: 'Why is AVIF sometimes disabled?',
          answer:
            "This tool actually attempts an AVIF encode in your browser and checks the real result, rather than trusting a browser capability flag — some browsers report AVIF support but silently produce a different format anyway. If that check fails, AVIF is disabled here with a note, rather than offering an option that would quietly produce the wrong file.",
        },
        {
          question: 'Is anything uploaded anywhere?',
          answer: 'No. Every conversion happens locally in your browser — your images are never sent anywhere.',
        },
      ]}
    >
      <FormatConverter />
    </ToolShell>
  );
}
