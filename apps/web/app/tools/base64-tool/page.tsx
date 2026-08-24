import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { Base64Tool } from './Base64Tool';

const TITLE = 'Base64 Encoder & Decoder - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Encode and decode Base64 — text, files, or images — entirely in your browser. No upload, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/base64-tool';

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

export default function Base64ToolPage() {
  return (
    <ToolShell
      title="Base64 Encoder / Decoder"
      description="Encode and decode Base64 — text, files, or images — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'uuid-hash-generator', 'url-encoder-decoder']}
      faq={[
        {
          question: 'What is Base64, and why use it?',
          answer:
            'Base64 turns arbitrary binary data into plain ASCII text, using only letters, digits, +, /, and = for padding. It exists because many formats — JSON, XML, URLs, email — are built to carry text safely but not raw binary. Base64 lets you embed an image, a file, or any byte sequence inside those formats: a data URI in CSS, an attachment in an email, a binary blob in a JSON field.',
        },
        {
          question: 'Is Base64 the same as encryption?',
          answer:
            'No — this is the most common misunderstanding. Base64 is encoding, not encryption. It provides zero confidentiality: anyone can decode it instantly with no key, no password, and no special tool (this page does it in your browser with two built-in functions). Never use Base64 to "hide" sensitive data — treat it as a format conversion, not a security measure.',
        },
        {
          question: 'How do I turn an image into a data URI?',
          answer:
            'Use the Image tab: drop in an image and it produces a full data:image/png;base64,... string (or the matching MIME type), ready to paste directly into an src attribute or a CSS background-image. This is most useful for small images — icons, small illustrations — since embedding a large image this way bloats the HTML or CSS file that contains it.',
        },
        {
          question: 'Is anything I upload here stored or sent anywhere?',
          answer:
            'No. All encoding and decoding — text, files, and images — happens locally in your browser using native Web APIs. Nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <Base64Tool />
    </ToolShell>
  );
}
