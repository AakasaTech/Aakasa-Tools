import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { BarcodeGenerator } from './BarcodeGenerator';

const TITLE = 'Barcode Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate barcodes in multiple formats — Code 128, EAN, UPC, and more — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/barcode-generator';

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

export default function BarcodeGeneratorPage() {
  return (
    <ToolShell
      title="Barcode Generator"
      description="Generate barcodes in multiple formats — Code 128, EAN, UPC, and more — entirely in your browser."
      category="seo-marketing"
      tier="free"
      relatedTools={['qr-code-generator', 'utm-link-builder', 'meta-tag-previewer']}
      faq={[
        {
          question: 'How is a barcode different from a QR code?',
          answer:
            "Traditional barcodes are 1D (a series of parallel lines) and typically encode a short numeric or alphanumeric string — the kind of thing printed on retail products, inventory labels, and shipping packages. QR codes are 2D and can hold far more data, including full URLs, which is why they're common for things like linking to a website from a poster.",
        },
        {
          question: 'Which barcode format should I use?',
          answer:
            "CODE128 is the flexible general-purpose choice — any length, almost any character, no check digit to worry about. EAN-13 and UPC-A are the standard retail product formats (the ones on virtually every packaged product), with a fixed digit count and a specific check-digit calculation. Use EAN-13/UPC-A/EAN-8/ITF-14 when you need a barcode that matches an existing retail or shipping standard; CODE128 or CODE39 otherwise.",
        },
        {
          question: 'What is a check digit?',
          answer:
            "It's a single extra digit, mathematically derived from the rest of the number, appended so a scanner can catch a misread digit. EAN-13, UPC-A, EAN-8, and ITF-14 all use one. This tool computes it for you automatically if you leave it off — see the guidance shown under the format selector for the exact digit count each format expects.",
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer: 'No. Every barcode is generated entirely in your browser — the values you enter are never uploaded to a server.',
        },
      ]}
    >
      <BarcodeGenerator />
    </ToolShell>
  );
}
