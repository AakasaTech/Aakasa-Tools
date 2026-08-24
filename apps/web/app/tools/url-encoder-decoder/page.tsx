import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { UrlEncoderDecoder } from './UrlEncoderDecoder';

const TITLE = 'URL Encoder & Decoder - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Encode and decode URLs, query strings, and individual components — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/url-encoder-decoder';

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

export default function UrlEncoderDecoderPage() {
  return (
    <ToolShell
      title="URL Encoder & Decoder"
      description="Encode and decode URLs, query strings, and individual components — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['base64-tool', 'json-formatter', 'utm-link-builder']}
      faq={[
        {
          question: 'What does percent-encoding actually do?',
          answer:
            'URLs can only safely contain a limited set of characters. Anything else — spaces, &, ?, #, and other reserved or unsafe characters — has to be escaped into a %XX form (its byte value in hex) so it can\'t be misread as part of the URL\'s own structure. A space becomes %20, & becomes %26, and so on. Without this, a value like "Q&A" inside a query parameter would be misread as two separate parameters instead of one value containing an ampersand.',
        },
        {
          question: "What's the difference between encodeURIComponent and encodeURI?",
          answer:
            'This is the most common source of bugs with this kind of tool. encodeURIComponent escapes everything, including characters like &, ?, and / that are meaningful in a URL\'s structure — use it for a single VALUE, like one query parameter. encodeURI leaves those structural characters alone, because it expects a complete URL, not a fragment of one. For example, encoding "a=1&b=2" with encodeURIComponent gives "a%3D1%26b%3D2" (correct for putting that whole string inside one query value) — but running the same text through encodeURI leaves it as "a=1&b=2" unchanged, because =, &, and the rest are valid, structural characters in a full URL. Both are correct — they\'re just answering different questions: this tool\'s "Component" mode is encodeURIComponent, and "Full URL" mode is encodeURI.',
        },
        {
          question: 'Why does decoding sometimes show an error?',
          answer:
            'Percent-encoding requires each "%" to be followed by exactly two valid hex digits. A stray "%" from messy pasted data — one that isn\'t followed by two hex digits, like a lone "%" or "%ZZ" — can\'t be decoded, and the browser\'s native decode functions throw an error rather than guessing. This tool catches that and points at roughly where the invalid sequence is, instead of failing silently or crashing.',
        },
        {
          question: 'Is anything typed here stored or sent anywhere?',
          answer:
            'No. All encoding, decoding, and parsing happens locally in your browser using native Web APIs. Nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <UrlEncoderDecoder />
    </ToolShell>
  );
}
