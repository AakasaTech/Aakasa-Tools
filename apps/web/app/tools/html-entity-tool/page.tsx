import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { HtmlEntityTool } from './HtmlEntityTool';

const TITLE = 'HTML Entity Encoder & Decoder - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Encode and decode HTML entities — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/html-entity-tool';

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

export default function HtmlEntityToolPage() {
  return (
    <ToolShell
      title="HTML Entity Encoder & Decoder"
      description="Encode and decode HTML entities — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'base64-tool', 'url-encoder-decoder']}
      faq={[
        {
          question: 'What are HTML entities, and why are they needed?',
          answer:
            'HTML entities are a way to represent characters that either have special meaning in HTML markup — like < and & and " — or fall outside the basic ASCII range, so they display correctly instead of being misread as part of the markup itself. For example, a literal "<" in text content could be misread by a browser as the start of a tag, so it\'s written as &lt; instead. This matters most whenever text isn\'t guaranteed to be "safe" HTML already — user-submitted comments, product names with an ampersand, or any text inserted into a page that could otherwise accidentally form real markup.',
        },
        {
          question: "What's the difference between a named entity and a numeric character reference?",
          answer:
            'A named entity uses a mnemonic name, like &amp; or &copy; — easier to read, but only a defined set of names exist. A numeric character reference uses the character\'s actual Unicode code point instead, either decimal (&#169;) or hexadecimal (&#x00A9;) — every character has one, since it\'s just a number, but it\'s less readable at a glance. Both decode to the exact same character (© in this example); this tool\'s "output format" option lets you choose named-where-available or always-numeric for the entities it produces, and decodes either form (or a mix of both) without needing to know which was used.',
        },
        {
          question: 'When does this actually matter in practice?',
          answer:
            'Two common cases: safely displaying text that came from somewhere untrusted (a user comment, a form submission) inside HTML, so a literal "<" or "&" in what someone typed can\'t accidentally form real markup; and embedding a character your keyboard or codebase encoding can\'t easily produce directly — a currency symbol, an accented letter, a special dash, or a symbol like © or ™ — as a reliable ASCII-safe reference instead.',
        },
        {
          question: 'Is anything I type here stored or sent anywhere?',
          answer:
            'No. All encoding and decoding happens locally in your browser — nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <HtmlEntityTool />
    </ToolShell>
  );
}
