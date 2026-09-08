# Claude Code Prompt — Build Tool #70: CSV to Excel Converter

Run after tool-shell and tools #1-69 exist. Closes out this batch. First
tool producing a genuine binary Office file format — reuses CSV parsing
infrastructure already established, adds a new export target.

---

```
Build the CSV to Excel Converter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/csv-to-excel/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- Check apps/web/app/tools/csv-json-converter/utils/csvToJson.ts and
  apps/web/app/tools/csv-viewer/ FIRST — reuse existing PapaParse-based CSV
  parsing rather than a third implementation of it.
- 100% client-side. Use SheetJS (the `xlsx` npm package — install with
  `npm install xlsx`) for generating genuine .xlsx files client-side; this
  is the standard, well-established library for this exact task and is
  already listed as available in this environment's React/artifact
  context, so it should be a familiar, low-risk dependency to add here as
  a real npm package too. Do not attempt to hand-construct the .xlsx
  binary format — it's a genuinely complex ZIP-based XML container format,
  entirely unsuitable for reimplementing.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'csv-to-excel', title: 'CSV to Excel Converter',
    shortDescription: 'Convert CSV files to genuine Excel (.xlsx) spreadsheets, free.',
    category: 'data-files', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['csv-json-converter', 'csv-viewer', 'random-data-generator']. FAQ
(3-4 Q&A): what this tool does differently from just renaming a .csv file
to .xlsx (a genuine binary Excel file is a fundamentally different format
from a renamed text file — explain plainly that Excel can technically open
a .csv directly, but a real .xlsx offers proper cell typing, multiple
sheets, and native Excel formatting, which this tool produces correctly
rather than faking), how delimiter detection works (reuse the established
CSV parsing pattern from CSV↔JSON Converter), whether formulas or
formatting can be added (be honest: this is a straightforward data
conversion producing a plain data sheet, not a tool for building
formatted/formula-driven spreadsheets — that's a meaningfully bigger scope
this tool doesn't attempt), and the privacy note.

STEP 3 — CsvToExcel.tsx:
- Input: FileDropzone accepting .csv files, plus paste-CSV-text
  alternative (reuse patterns from CSV↔JSON Converter).
- Delimiter/header options consistent with CSV↔JSON Converter's established
  controls (first-row-is-header toggle, delimiter override).
- Multi-file support: allow uploading multiple CSV files and combining them
  as SEPARATE SHEETS within one output .xlsx workbook (each CSV becomes its
  own named sheet, named after the source filename) — this is a genuinely
  useful differentiator over a single-file-only converter, and SheetJS
  supports multi-sheet workbooks natively.
- Type inference toggle (default ON, consistent with CSV↔JSON Converter's
  established pattern) — numeric-looking CSV values become actual Excel
  number cells (enabling correct sorting/formulas/formatting in Excel)
  rather than being stored as text, when this option is enabled; off
  preserves everything as text (useful for data like phone numbers or
  zip codes with meaningful leading zeros that would be corrupted by
  numeric coercion — the same leading-zero tradeoff already explained in
  CSV↔JSON Converter's build, worth the same explanatory note here).
- Sheet name customization: if a single file is converted, let the user
  name the resulting sheet (default: "Sheet1" or the source filename);
  for multiple files, auto-name sheets from filenames with a note they can
  be renamed after download in Excel itself.
- Preview: show a small table preview of the parsed data before generating
  the final file, so users can confirm the parsing looks correct before
  committing to the conversion (reuse a table/grid display component if
  one is established from CSV Viewer, even a simplified non-editable
  version of it).
- "Generate & Download .xlsx" button.
- Row/column count summary, consistent with the stat-display pattern
  established elsewhere in the catalog.

STEP 4 — Logic separation: apps/web/app/tools/csv-to-excel/utils/
csvToExcel.ts — buildExcelWorkbook(csvDataSets: { sheetName: string;
rows: unknown[][] }[], options: { inferTypes: boolean }): Blob, wrapping
SheetJS's workbook/worksheet construction APIs, handling the type-inference
logic (parsing numeric-looking strings to actual numbers when enabled)
before building each worksheet. Import CSV parsing itself from the
existing csv-json-converter utilities rather than reimplementing. Typed, no
`any` beyond SheetJS's own loosely-typed API surface, narrowed at the
boundary.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the generated .xlsx file actually opens correctly in a real
   spreadsheet application (or at minimum, confirm it round-trips
   correctly if re-parsed by SheetJS itself, or note if genuine
   application-level testing wasn't possible in this environment) —
   state what verification was actually performed, since a binary file
   format issue wouldn't be obvious from just "the code ran without
   throwing."
2. Confirm the multi-sheet feature correctly creates separate, correctly-
   named sheets for multiple uploaded CSV files within one workbook — test
   with at least two files and confirm both appear as distinct sheets.
3. Confirm CSV parsing was imported/reused from csv-json-converter's
   existing utilities rather than reimplemented a third time in the
   codebase.
```

## Note
**Verifying the actual .xlsx output is genuinely valid is worth taking
seriously** — unlike most tools in this catalog where "the code runs
without errors" is a reasonable proxy for correctness, a binary file format
like .xlsx could produce a file that SheetJS's own writer considers
successful but that a real spreadsheet application struggles to open
correctly, especially around edge cases like special characters in sheet
names or unusual data types. If full application-level testing isn't
practical in the build environment, at minimum verify by reading the
generated file back through SheetJS's own parser as a round-trip sanity
check.
