import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CsvViewer } from './CsvViewer';

const TITLE = 'CSV Viewer & Cleaner - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'View, edit, and clean messy CSV data in a spreadsheet-like grid — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/csv-viewer';

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

export default function CsvViewerPage() {
  return (
    <ToolShell
      title="CSV Viewer & Cleaner"
      description="View, edit, and clean messy CSV data in a spreadsheet-like grid — entirely in your browser."
      category="data-files"
      tier="free"
      relatedTools={['csv-json-converter', 'json-formatter', 'unit-converter']}
      faq={[
        {
          question: 'What "cleaning" operations does this tool actually perform?',
          answer:
            'It handles the specific, mechanical cleanup tasks that make messy exports annoying to work with: trimming leading/trailing whitespace (per cell, per column, or across the whole file), removing entirely empty rows or columns, finding and removing exact-duplicate rows, and find & replace across a column or the whole dataset. It also flags likely issues — inconsistent capitalization in what looks like a categorical column, or a mix of date formats — as suggestions you accept or dismiss, never as silent automatic changes. It is not a full data-wrangling or transformation tool: there is no formula support, type conversion, or column reshaping beyond what is listed here.',
        },
        {
          question: 'How large a file can this handle?',
          answer:
            "Comfortably into the tens of thousands of rows — the grid only renders the rows currently visible on screen, and large files are parsed in a background thread so the page doesn't freeze while loading. Past roughly 100,000 rows or 50MB, you'll see an honest warning: everything still works, but a browser tab holding that much data in memory can get sluggish, especially with the undo history active. If that happens, working with a smaller slice of the file is the practical fix — there's no artificial hard limit, but there is a real one.",
        },
        {
          question: 'Does this change the original file, and can I undo a mistake?',
          answer:
            "No — loading a file makes an in-browser copy; the file on your disk is never touched, and nothing is saved anywhere until you explicitly click Download. Within a session, every cleaning action (including removing duplicates or a find & replace) can be undone with the Undo button, which keeps roughly the last 20 actions in memory. Closing the tab or reloading the page clears everything, same as every other tool in this toolbox.",
        },
        {
          question: 'Is any of my data uploaded or sent anywhere?',
          answer:
            'No. Parsing, editing, and cleaning all happen locally in your browser — for large files, in a background Web Worker, but still entirely on your machine. Nothing you load, edit, or paste here is transmitted, logged, or stored on a server.',
        },
      ]}
    >
      <CsvViewer />
    </ToolShell>
  );
}
