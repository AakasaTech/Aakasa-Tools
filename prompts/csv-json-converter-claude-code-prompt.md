# Claude Code Prompt — Build Tool #8: CSV ↔ JSON Converter

Run this after tool-shell and tools #1-7 all exist and work. This pairs
naturally with your existing dev-tool audience and previews the data-handling
patterns the later CSV Viewer/Cleaner tool will also need.

---

```
Build the CSV ↔ JSON Converter tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/csv-json-converter/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone, and other primitives
  from tools #1-7 — check what exists before writing anything new.
- 100% client-side. Use PapaParse (already listed as an available library in
  this environment; if it's not yet a dependency in apps/web, add it —
  `npm install papaparse @types/papaparse`) for CSV parsing since hand-rolled
  CSV parsing reliably breaks on quoted commas, embedded newlines, and
  escaped quotes. Do not hand-roll CSV parsing — this is exactly the kind of
  "looks simple, isn't" problem a battle-tested library solves correctly.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Input/output panes use font-mono.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'csv-json-converter', title: 'CSV to JSON Converter',
    shortDescription: 'Convert between CSV and JSON formats instantly, both directions.',
    category: 'data-files', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "CSV to JSON Converter (and back) - Free Online Tool |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="CSV ↔ JSON Converter"
    description="Convert CSV to JSON or JSON to CSV — paste, upload, or drag a file, entirely in your browser."
    category="data-files"
    tier="free"
    relatedTools={['json-formatter', 'csv-viewer', 'base64-tool']}
    faq={[...]}
  >
    <CsvJsonConverter />
  </ToolShell>
  Note: check TOOL_REGISTRY first — 'csv-viewer' likely doesn't exist yet.
  Drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: how nested JSON is handled when converting to CSV (flattening
  strategy — explain simply that nested objects get dot-notation column
  names, e.g. address.city, and arrays get index-based or joined-string
  treatment, whichever this build implements), how CSV headers map to JSON
  keys, what happens with missing/inconsistent columns across rows, and
  confirmation nothing uploaded or pasted here leaves the browser.

STEP 3 — CsvJsonConverter.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Direction toggle: "CSV → JSON" / "JSON → CSV" (tabs or a clear switch
  control — this determines input format validation and which panel is
  editable vs. output).
- Input methods for the source data for whichever direction is active:
  - Paste directly into a textarea (font-mono)
  - FileDropzone (reuse from packages/ui) accepting .csv or .json files
    depending on active direction
  - A small "Load sample data" button for first-time users to see the tool
    working immediately
- Output panel (font-mono, read-only, syntax-appropriate — reuse
  JSON-Formatter's tree-view component if it's generic enough for JSON
  output; check apps/web/app/tools/json-formatter/ before building a new
  JSON display component from scratch).
- CSV → JSON specific options:
  - Delimiter selector (comma, semicolon, tab, pipe — PapaParse handles
    auto-detection but expose a manual override since real-world CSVs from
    e.g. European locales often use semicolons)
  - "First row is header" toggle (default on)
  - Output shape toggle: array of objects (default, most common) vs. array
    of arrays (raw rows) vs. object keyed by a chosen column (e.g. keyed by
    "id" column if present) — this last option is genuinely useful for
    turning a CSV into a lookup table and worth the extra effort
  - Type inference toggle: when on (default), attempt to parse numeric
    strings as numbers and "true"/"false" as booleans in the JSON output;
    when off, keep everything as strings (safer for IDs like "0042" that
    would lose leading zeros if coerced to a number — mention this tradeoff
    directly in the UI as a small helper note near the toggle)
- JSON → CSV specific options:
  - Flattening behavior for nested objects/arrays: implement dot-notation
    for nested objects (address.city) and for arrays of primitives, join
    with a configurable separator (default "; ") into a single cell; for
    arrays of objects, flatten using index notation (items.0.name,
    items.1.name) — document this behavior clearly in the FAQ since it's
    the one place this tool makes an opinionated choice that needs
    explaining
  - Handle inconsistent keys across array items gracefully: union all keys
    found across all objects to build the header row, leave cells empty for
    objects missing a given key (standard, expected CSV behavior — don't
    error out on this, it's normal real-world data)
- Row/column count summary for CSV data, key count for JSON — small stat
  line above the output, consistent with the stat-display pattern from Word
  Counter.
- CopyButton and Download button (.csv or .json, matching output format) on
  the output panel.
- Clear error handling: malformed CSV or invalid JSON input should produce a
  specific, human-readable error (PapaParse surfaces row/column info for CSV
  errors — surface that; JSON.parse errors should follow the same
  line/column pattern already established in JSON Formatter's utils).

STEP 4 — Performance:
Large files (>1MB or >5,000 rows) should be parsed/converted via a Web
Worker so the UI thread doesn't freeze. Put it at
apps/web/app/tools/csv-json-converter/workers/convert.worker.ts. PapaParse
itself supports worker-based parsing natively (its `worker: true` config
option) — check whether using that built-in capability is simpler than
hand-rolling a custom worker wrapper, and prefer PapaParse's native option
if it covers both directions cleanly; only build a custom worker if the
JSON→CSV direction needs logic PapaParse's worker mode doesn't cover.

STEP 5 — Logic separation:
Extract into apps/web/app/tools/csv-json-converter/utils/:
  - csvToJson.ts — csvToJson(csvText: string, options: CsvParseOptions):
    { data: unknown; error?: string }, wrapping PapaParse with this tool's
    specific option handling (delimiter, header toggle, output shape, type
    inference).
  - jsonToCsv.ts — jsonToCsv(jsonText: string, options: JsonToCsvOptions):
    { data: string; error?: string }, implementing the flattening logic
    described above as pure, typed functions (no `any` — use `unknown` and
    narrow appropriately given JSON's inherently dynamic shape).
  Both should be unit-testable independently of the UI.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Whether JSON Formatter's tree-view/output display component was reusable
   here as-is, or needed modification — and if modified, whether it should
   move into packages/ui as a generic <JsonOutput> component now that two
   tools need it.
2. Whether PapaParse's native worker mode (`worker: true`) was sufficient
   for both directions, or whether a custom worker wrapper was needed for
   the JSON→CSV flattening logic specifically.
3. Confirm the "keyed by column" output shape and the array-flattening
   behavior both handle a genuinely messy real-world sample (inconsistent
   columns, a nested array of objects, at least one missing value) correctly
   — test with a deliberately messy sample, not just a clean happy-path one.
```

---

## Notes

- **Do not let Claude Code hand-roll CSV parsing** — this is explicitly
  called out because naive split-on-comma parsing breaks immediately on
  quoted fields containing commas, embedded newlines inside quoted fields,
  and escaped quotes. PapaParse is a mature, well-tested library for exactly
  this problem; there's no upside to reimplementing it here.
- **The JSON→CSV flattening strategy is the one genuinely opinionated design
  decision in this tool** — dot-notation for objects, index-notation for
  arrays-of-objects, joined-string for arrays-of-primitives. This is a
  reasonable default but worth being aware it's a choice, not a standard,
  and the FAQ should say so plainly rather than presenting it as the only
  correct approach.
- This tool is a good candidate to **preview shared infrastructure** the
  later CSV Viewer/Cleaner tool (#15 in your original shortlist) will also
  need — worth revisiting whether `csvToJson.ts`'s PapaParse wrapper should
  move to a shared location once that tool gets built, similar to the
  color-utils question raised on tool #7.
