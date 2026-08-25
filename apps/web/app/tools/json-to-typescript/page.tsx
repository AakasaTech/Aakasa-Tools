import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { JsonToTypescript } from './JsonToTypescript';

const TITLE = 'JSON to TypeScript Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate TypeScript interfaces from JSON — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/json-to-typescript';

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

export default function JsonToTypescriptPage() {
  return (
    <ToolShell
      title="JSON to TypeScript Generator"
      description="Generate TypeScript interfaces from JSON — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'csv-json-converter', 'regex-tester']}
      faq={[
        {
          question: 'How are nested objects handled?',
          answer:
            'Every nested object becomes its own separate, named interface — hoisted above the interface that references it — rather than an inline anonymous type. The name is auto-derived from the key that holds it, PascalCased: an address key becomes an Address interface, referenced as address: Address. If the exact same object shape appears again under a different key elsewhere in the JSON, this tool reuses the interface it already generated instead of creating a near-identical duplicate.',
        },
        {
          question: 'How are arrays typed, especially when the objects inside them don\'t all match?',
          answer:
            'An array of primitives becomes T[] (or a union like (string | number)[] if the values are mixed). An array of objects that all share the same shape becomes a single interface array, e.g. items: Item[]. When array items have genuinely different shapes — some fields overlap, some don\'t — this is the trickiest case: rather than silently using just the first item\'s shape (which would hide real data and produce a type that lies about some items), this tool generates one interface per distinct shape and combines them into a union, e.g. (ItemVariant1 | ItemVariant2)[]. If an array has more than a handful of genuinely distinct shapes, enumerating each one stops being useful, so it falls back to a clearly-commented generic type instead of an unreadable union.',
        },
        {
          question: 'How are null and missing values handled?',
          answer:
            'These are two different situations, typed differently on purpose. A key that\'s sometimes entirely missing (common when array items don\'t all have the same fields) becomes an optional field: name?: string. A key that\'s always present but sometimes holds a literal null value becomes a union with null instead: name: string | null — the field always exists, its value just isn\'t always a string. A field only ever observed as null, with no other type information available, becomes name: unknown, since there\'s nothing to honestly infer beyond "we don\'t know."',
        },
        {
          question: 'Is my JSON stored or transmitted anywhere?',
          answer:
            'No. Parsing and type generation both happen entirely in your browser — nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <JsonToTypescript />
    </ToolShell>
  );
}
