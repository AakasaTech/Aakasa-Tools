import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CsvToExcel } from './CsvToExcel';

const TITLE = 'CSV to Excel Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert CSV files to genuine Excel (.xlsx) spreadsheets, free.';
const CANONICAL_URL = 'https://aakasa.dev/tools/csv-to-excel';

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

export default function CsvToExcelPage() {
  return (
    <ToolShell
      title="CSV to Excel Converter"
      description="Convert CSV files to genuine Excel (.xlsx) spreadsheets, free."
      category="data-files"
      tier="free"
      relatedTools={['csv-json-converter', 'csv-viewer', 'random-data-generator']}
      faq={[
        {
          question: "How is this different from just renaming a .csv file to .xlsx?",
          answer:
            "Renaming the extension doesn't change the file's contents — it's still plain comma-separated text, and most spreadsheet apps will either refuse to open it or complain that the format doesn't match the extension. This tool builds a genuine binary .xlsx workbook (the same ZIP-based Open XML format Excel itself writes), with proper cell typing — numbers and booleans stored as real Excel number/boolean cells rather than text — and, when you upload more than one CSV, multiple named sheets in a single workbook. None of that is possible by editing a filename.",
        },
        {
          question: 'How does delimiter detection work?',
          answer:
            'CSV parsing is shared with our CSV ↔ JSON Converter tool — the same auto-detection (or manual comma/semicolon/tab/pipe override) and the same "first row is header" handling, so behavior stays consistent across both tools rather than each guessing differently.',
        },
        {
          question: 'Can this add formulas, cell colors, or other formatting?',
          answer:
            "No — this is a straightforward data conversion tool, not a formulas-and-formatting editor. It writes your CSV data into properly typed cells and nothing more. Adding formula support or styling would be a meaningfully bigger tool, and isn't something this one attempts.",
        },
        {
          question: 'Is my data uploaded anywhere?',
          answer:
            'No — every file you drop or paste in is parsed and converted entirely in your browser. Nothing is sent to a server.',
        },
      ]}
    >
      <CsvToExcel />
    </ToolShell>
  );
}
