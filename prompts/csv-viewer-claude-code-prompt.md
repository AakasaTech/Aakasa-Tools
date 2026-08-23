# Claude Code Prompt — Build Tool #15: CSV Viewer & Cleaner

Run this after tool-shell and tools #1-14 all exist and work. This closes
out your original MVP shortlist. It shares real infrastructure with CSV↔JSON
Converter (#8) — check that tool's utils before building anything fresh here.

---

```
Build the CSV Viewer & Cleaner tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/csv-viewer/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone, and other primitives
  from tools #1-14 — check what exists before writing anything new.
- IMPORTANT: check apps/web/app/tools/csv-json-converter/utils/csvToJson.ts
  FIRST. That tool already wraps PapaParse for CSV parsing with delimiter
  detection and worker-mode support — reuse that wrapper (or the shared
  parsing logic within it) rather than writing a second PapaParse
  integration from scratch. If the existing wrapper is too tightly coupled
  to CSV→JSON's specific needs, factor out the generic "parse CSV into rows"
  core into a shared location (propose packages/csv-utils if it's used by a
  third CSV-touching tool in the future, but for now just importing directly
  from csv-json-converter's utils folder is acceptable — don't over-engineer
  a new shared package for two consumers unless it's genuinely easy to do).
- 100% client-side. PapaParse (already a dependency from tool #8) for
  parsing; no new libraries needed for the core viewing/editing functionality.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Table/cell data renders in
  font-mono; UI chrome (buttons, labels) in font-body.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'csv-viewer', title: 'CSV Viewer & Cleaner',
    shortDescription: 'View, edit, and clean messy CSV data in a spreadsheet-like grid.',
    category: 'data-files', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "CSV Viewer & Cleaner - Free Online Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="CSV Viewer & Cleaner"
    description="View, edit, and clean messy CSV data in a spreadsheet-like grid — entirely in your browser."
    category="data-files"
    tier="free"
    relatedTools={['csv-json-converter', 'json-formatter', 'unit-converter']}
    faq={[...]}
  >
    <CsvViewer />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what "cleaning" operations this tool performs (trimming whitespace,
  removing duplicate rows, handling empty cells — be specific and accurate
  about what's actually implemented, don't oversell it as a full data-
  wrangling tool), whether large files are supported (mention the practical
  size guidance from Step 5), confirmation the tool doesn't alter the file
  on disk — edits happen to an in-browser copy and nothing is saved until
  the user explicitly exports, and confirmation no data is uploaded anywhere.

STEP 3 — CsvViewer.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- FileDropzone (reuse from packages/ui) accepting .csv/.tsv files, plus a
  "paste CSV text" alternative input for users without a file (textarea,
  parsed the same way as an uploaded file).
- Spreadsheet-like data grid displaying parsed rows/columns:
  - Sticky header row showing column names (editable — click to rename a
    column)
  - Row numbers in a fixed left column
  - Cell values editable inline (click a cell, edit, blur/enter to commit)
  - Virtualized rendering for large datasets (don't render 50,000 DOM rows
    at once — use a windowing approach, e.g. `@tanstack/react-virtual` or
    similar, rendering only visible rows) since this tool's whole purpose is
    handling data that might be large, and a naive full-DOM-render approach
    will make the browser tab unresponsive on anything beyond a few thousand
    rows
- Column-level actions (small menu per column header):
  - Sort ascending/descending
  - Trim whitespace from all values in this column
  - Remove this column entirely
  - Detect and offer to fix inconsistent formatting within a column when
    reasonably detectable (e.g. mixed date formats, inconsistent casing in
    what looks like a categorical column) — keep this heuristic and
    optional/suggested, not automatic silent changes; surface a suggestion
    the user can accept or dismiss, never mutate data without explicit
    confirmation
- Row-level actions:
  - Delete selected row(s) — support multi-row selection via checkboxes in
    the row-number column
  - "Remove duplicate rows" (whole-row exact match) as a one-click global
    action, with a summary of how many duplicates were found/removed before
    committing (show the count, let the user confirm, don't silently delete)
- Global cleaning actions (toolbar above the grid):
  - Trim whitespace from all cells
  - Remove entirely empty rows
  - Remove entirely empty columns
  - Find & replace across the whole dataset (simple text match, with an
    option for case-sensitive/insensitive, and a scope selector: current
    column only vs. entire dataset)
- Undo: since this tool performs destructive-feeling operations (delete row,
  remove duplicates, find & replace) on data the user may have spent effort
  cleaning, maintain a simple undo stack (last ~20 actions, in-memory only,
  not persisted) with a visible Undo button — this matters more here than in
  most prior tools because "oops, that deleted more than I meant" is a
  realistic outcome of a global find & replace or duplicate-removal action.
- Stats bar: row count, column count, detected empty cells count — updates
  live as the data is edited/cleaned.
- Export: Download as CSV (re-serialize current grid state, respecting any
  edits/deletions/renames) and Download as JSON (reuse CSV↔JSON Converter's
  csvToJson logic/output shape for consistency rather than building a
  second, possibly-inconsistent CSV-to-JSON conversion here).

STEP 4 — Performance:
- Virtualized grid rendering is non-negotiable for this tool specifically
  (see Step 3) — verify this actually works by testing with a genuinely
  large file (50,000+ rows), not just a small sample dataset, since the
  entire value proposition of a "CSV cleaner" is handling messy real-world
  files that are often large.
- Parsing itself should use PapaParse's worker mode (consistent with how
  CSV↔JSON Converter handles large files) for the initial file load, even
  though in-grid editing after that happens synchronously in the main
  thread (editing a single cell or running a targeted cleaning operation on
  already-parsed data doesn't need worker offloading — only the initial
  parse of a potentially-huge raw CSV string does).

STEP 5 — Practical limits:
Show a clear, honest warning (not a hard block) if a loaded file exceeds
roughly 100,000 rows or 50MB, noting that performance may degrade and
suggesting the user work with a subset if the browser tab becomes sluggish
— be honest about the practical ceiling of a client-side, in-memory tool
rather than implying unlimited scale.

STEP 6 — Logic separation:
Extract into apps/web/app/tools/csv-viewer/utils/:
  - csvGridOperations.ts — pure functions: trimWhitespace(data), removeEmptyRows(data),
    removeEmptyColumns(data), findDuplicateRows(data), findAndReplace(data,
    find, replace, options), sortColumn(data, columnKey, direction). Each
    takes the grid data structure in and returns a new one out (immutable,
    no in-place mutation) so the undo stack can simply keep prior snapshots.
  - undoStack.ts — a small typed undo/redo stack implementation, generic
    enough it could be reused by a future tool with similar destructive-edit
    concerns (not required to be generic now, just don't make it needlessly
    CSV-specific in its core mechanics).
  All pure, typed, no `any`.

STEP 7 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry. Test the full workflow with a deliberately messy sample:
inconsistent casing in a categorical column, some duplicate rows, some empty
rows/cells, and at least one column with mixed whitespace padding — confirm
each cleaning action behaves as described and undo correctly reverts each
one.

After building, tell me:
1. Confirm virtualized rendering was actually implemented and tested against
   a 50,000+ row file — state what library was used and roughly how it
   performed (smooth scroll vs. noticeable lag).
2. Confirm whether csv-json-converter's existing parsing logic was reused
   directly, or whether meaningful new parsing code was written here — if
   the latter, explain why the existing wrapper wasn't sufficient.
3. Confirm the undo stack correctly reverts a "remove duplicate rows" and a
   "find & replace across entire dataset" action specifically — these are
   the two highest-blast-radius operations in this tool and the ones where
   an undo bug would be most damaging to user trust.
```

---

## Notes

- **Virtualized rendering is the one non-negotiable technical requirement**
  — this tool's entire reason to exist is handling messier, often-larger CSV
  files than the average online tool bothers with. A non-virtualized grid
  will visibly choke well before it becomes actually useful for real-world
  "clean up this export from our CRM" use cases. Worth actually testing with
  a large file, not just trusting that the library was added.
- **Undo matters more here than in almost any prior tool** — "remove
  duplicate rows" and "find & replace across entire dataset" are exactly the
  kind of one-click actions a user might run, immediately regret, and need
  to walk back. Getting this right (and specifically verifying it on the two
  highest-risk operations) protects user trust in a way that's easy to
  underinvest in during a first build pass.
- **This closes your original 15-tool MVP shortlist.** Worth pausing here to
  decide whether to keep going sequentially through the fuller 100-tool list
  from your first message, or to prioritize based on whatever early traffic/
  usage signals you're seeing on the tools already live — a natural point to
  actually check analytics before committing to the next batch of build
  prompts blindly.
