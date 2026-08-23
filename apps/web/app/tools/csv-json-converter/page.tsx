import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CsvJsonConverter } from './CsvJsonConverter';

const TITLE = 'CSV to JSON Converter (and back) - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Convert CSV to JSON or JSON to CSV — paste, upload, or drag a file, entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/csv-json-converter';

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

export default function CsvJsonConverterPage() {
  return (
    <ToolShell
      title="CSV ↔ JSON Converter"
      description="Convert CSV to JSON or JSON to CSV — paste, upload, or drag a file, entirely in your browser."
      category="data-files"
      tier="free"
      relatedTools={['json-formatter', 'csv-viewer', 'base64-tool']}
      faq={[
        {
          question: 'How does JSON → CSV handle nested objects and arrays?',
          answer:
            'Nested objects are flattened into dot-notation column names — a JSON field like address.city becomes a column literally named "address.city". Arrays of plain values (strings, numbers) are joined into a single cell using the separator you choose (a semicolon by default). Arrays of objects are flattened using index notation instead, so items in an "items" array become columns like items.0.name and items.1.name. This is the one place the tool makes an opinionated choice about ambiguous data — if your JSON has deeply nested arrays of objects, expect a wide result with one column per field per index.',
        },
        {
          question: 'How do CSV headers map to JSON keys?',
          answer:
            'With "First row is header" on, each header cell becomes the property name for that column in every output object. With it off, generic names like "Column 1", "Column 2" are used instead. Values are matched to keys by column position, not by content.',
        },
        {
          question: 'What happens with missing or inconsistent columns?',
          answer:
            'This is treated as normal, expected real-world data rather than an error. Converting CSV to JSON, a row with fewer cells than the header just gets an empty string for the missing columns. Converting JSON to CSV, the header row is built from the union of every key seen across all objects — an object missing a given key simply gets an empty cell there.',
        },
        {
          question: 'Is anything I paste or upload here sent anywhere?',
          answer:
            'No. Parsing and conversion happen entirely in your browser — for large files, in a background Web Worker so the page stays responsive. Nothing you paste or upload is transmitted, logged, or stored.',
        },
      ]}
    >
      <CsvJsonConverter />
    </ToolShell>
  );
}
