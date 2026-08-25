import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { XmlFormatter } from './XmlFormatter';

const TITLE = 'XML Formatter & Validator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Format, validate, and minify XML — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/xml-formatter';

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

export default function XmlFormatterPage() {
  return (
    <ToolShell
      title="XML Formatter & Validator"
      description="Format, validate, and minify XML — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'html-entity-tool', 'regex-tester']}
      faq={[
        {
          question: 'What does "well-formed" mean, and is that the same as "valid"?',
          answer:
            'Well-formed means the XML follows the basic syntax rules every XML document must follow: every tag is closed, tags are properly nested, there\'s exactly one root element, and attribute values are quoted. This tool checks well-formedness — it does not check "validity" in the stricter sense of conforming to a schema or DTD (a set of rules for which elements and attributes a specific document type is allowed to have). Well-formed XML can still be invalid against a particular schema; this tool has no way to know what schema, if any, your XML is meant to follow, so it doesn\'t attempt that check.',
        },
        {
          question: 'What kinds of errors does this catch?',
          answer:
            'The most common ones: an unclosed tag (<title>Book), mismatched opening and closing tags (<title>...</name>), more than one root element, and invalid characters like a bare & or < inside text content that should have been escaped as &amp; or &lt;. Each error is reported with the line and column where the parser gave up, when the browser\'s parser provides one.',
        },
        {
          question: 'Does formatting change my data, or just how it looks?',
          answer:
            'Formatting re-indents the structure and normalizes whitespace BETWEEN tags — the insignificant whitespace that exists purely for human readability, which is what makes a formatter useful in the first place. It does not change element names, attribute values, or actual text content, and it preserves an XML declaration (<?xml version="1.0"...?>) if your input has one, rather than dropping it.',
        },
        {
          question: 'Is my XML stored or transmitted anywhere?',
          answer:
            'No. Parsing, validation, formatting, and minification all happen locally in your browser using native Web APIs — nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <XmlFormatter />
    </ToolShell>
  );
}
