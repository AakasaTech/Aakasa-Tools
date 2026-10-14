import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { NumberBaseConverter } from './NumberBaseConverter';

const TITLE = 'Number Base Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert numbers between binary, octal, decimal, and hexadecimal, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/number-base-converter';

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

export default function NumberBaseConverterPage() {
  return (
    <ToolShell
      title="Number Base Converter"
      description="Convert numbers between binary, octal, decimal, and hexadecimal, instantly."
      category="developer"
      tier="free"
      relatedTools={['uuid-hash-generator', 'timestamp-converter', 'base64-tool']}
      faq={[
        {
          question: 'What are binary, octal, decimal, and hexadecimal used for?',
          answer:
            'Decimal (base 10) is the everyday number system. Binary (base 2) is how computers represent data at the lowest level — bytes, flags, and bitwise logic. Hexadecimal (base 16) is a compact, human-friendly stand-in for binary — 4 bits per hex digit — and shows up constantly in memory addresses, color codes, and hash values. Octal (base 8) is less common today but still shows up in Unix file permissions (like chmod 755).',
        },
        {
          question: 'Why does this matter for really large numbers?',
          answer:
            "JavaScript's regular numbers can only represent whole numbers exactly up to 2^53 − 1 (Number.MAX_SAFE_INTEGER) — a 64-bit hex value or a large binary number can easily exceed that, and a naive converter built on regular numbers would silently round it to the wrong value. This tool uses BigInt throughout instead, which has no such limit, so conversions stay exact no matter how large the number is.",
        },
        {
          question: "What's the bitwise / two's-complement panel for?",
          answer:
            "It's a hands-on way to see and edit the actual bit pattern behind a value at a chosen width (8/16/32/64-bit), and specifically how negative numbers are stored using two's complement — the scheme essentially all real computers use, where a negative number's bit pattern is very different from just its positive counterpart with a minus sign. Click any bit to flip it and watch every other field update live.",
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer: 'No — every conversion happens locally in your browser.',
        },
      ]}
    >
      <NumberBaseConverter />
    </ToolShell>
  );
}
