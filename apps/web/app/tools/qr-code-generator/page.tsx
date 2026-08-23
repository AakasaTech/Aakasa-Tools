import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { QrCodeGenerator } from './QrCodeGenerator';

const TITLE = 'QR Code Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate QR codes for URLs, text, Wi-Fi, and contact cards — instantly, entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/qr-code-generator';

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

export default function QrCodeGeneratorPage() {
  return (
    <ToolShell
      title="QR Code Generator"
      description="Generate QR codes for URLs, text, Wi-Fi, contact cards, and more — entirely in your browser."
      category="seo-marketing"
      tier="free"
      relatedTools={['utm-link-builder', 'meta-tag-previewer']}
      faq={[
        {
          question: 'What does the error correction level mean, and which should I pick?',
          answer:
            'Error correction lets a QR code stay scannable even if part of it is damaged, dirty, or covered — like a logo placed in the middle. Level L recovers from about 7% data loss, M about 15%, Q about 25%, and H about 30%. Higher levels pack in more redundancy, which makes the code visually denser, so pick the lowest level that covers your situation: L or M for a clean code with nothing overlapping it, Q or H if you plan to add a logo or expect the print to get scuffed.',
        },
        {
          question: 'How small can I print a QR code and still have it scan reliably?',
          answer:
            "A common rule of thumb is at least 2 x 2 cm (about 0.8 x 0.8 inches) for close-range scanning, and larger the farther away the scanner will be — roughly 1 inch of code size for every 10 feet of scanning distance. Denser codes (higher error correction, or a lot of encoded data) need more room per module, so if you're printing small, keep the content short and the error correction level no higher than you actually need.",
        },
        {
          question: 'Do these QR codes expire, or do they need an account to keep working?',
          answer:
            "No. A QR code generated here encodes your data directly — the URL, Wi-Fi credentials, contact info, whatever you entered — with no redirect or tracking service in between, so there's nothing to expire and no account required. The one exception is self-inflicted: if you encode a shortened URL from a service that tracks or expires links, that service's own terms apply, not anything about the QR code itself.",
        },
        {
          question: 'Is anything I enter here uploaded or stored?',
          answer:
            'No. The QR code — including any logo image you add — is generated entirely in your browser. Nothing is sent to a server, logged, or saved anywhere; closing the tab clears everything.',
        },
      ]}
    >
      <QrCodeGenerator />
    </ToolShell>
  );
}
