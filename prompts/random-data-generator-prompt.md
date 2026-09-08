# Claude Code Prompt — Build Tool #57: Random Data Generator

Run after tool-shell and tools #1-56 exist. Genuinely useful developer/QA
tool for generating realistic-looking test datasets — pairs naturally with
CSV/JSON tools already in the catalog.

---

```
Build the Random Data Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/random-data-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `@faker-js/faker` npm package (the standard,
  well-maintained library for generating realistic fake data — names,
  addresses, emails, etc. — install with `npm install @faker-js/faker`).
  Do not hand-roll fake-name/address generation — faker.js's data
  templates are extensive and well-tested; reimplementing even a subset
  would be wasted effort for worse results. Note faker.js is a
  meaningfully sized dependency — check its tree-shaking support and
  import only the specific locale/modules needed rather than the entire
  library, if the package supports scoped imports (recent faker versions
  do support more granular imports — check current best practice for the
  installed version).
- Design tokens as established. Output uses font-mono.

STEP 1 — Register:
  { slug: 'random-data-generator', title: 'Random Data Generator',
    shortDescription: 'Generate realistic fake data for testing — names, emails, addresses, and more.',
    category: 'data-files', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['csv-json-converter', 'json-formatter', 'uuid-hash-generator']. FAQ
(3-4 Q&A): common use cases (populating test databases, mocking API
responses during development, UI/UX testing with realistic-looking
placeholder content), an explicit and important note that ALL generated
data is entirely fake/randomly generated and does not correspond to any
real person, place, or entity (state this plainly — worth being explicit
since generated names/addresses could coincidentally resemble real ones,
and clarifying they're synthetic is a reasonable, honest thing to state),
what fields/data types are supported (brief list), and the privacy note.

STEP 3 — RandomDataGenerator.tsx:
- Field builder: the user constructs a schema by adding fields, each with
  a name (e.g. "email", "user_id") and a data type selected from a
  supported set: Full Name, First Name, Last Name, Email, Phone Number,
  Street Address, City, Country, Company Name, Job Title, Date (with a
  range option: past/future/specific range), Boolean, Integer (with
  min/max range), Decimal/Float (with min/max and precision), UUID,
  Sentence/Paragraph (lorem-ipsum-style text), Avatar/Image URL
  (placeholder image URL), Color (hex).
- Add/remove/reorder fields (drag-to-reorder or simple up/down buttons).
- Number of records to generate (numeric input, with a reasonable upper
  bound warning — e.g. beyond 10,000 rows, warn that generation and
  browser rendering may be slow, consistent with practical-limits framing
  used elsewhere in the catalog like CSV Viewer).
- Output format selector: JSON (array of objects), CSV, or SQL INSERT
  statements (a nice differentiator for a developer audience — generates
  valid INSERT INTO statements with the field names as columns, genuinely
  useful for quickly seeding a test database table).
- Locale selector (faker.js supports multiple locales for realistic
  region-appropriate names/addresses — offer a reasonable subset, e.g.
  English/US, English/UK, generic — rather than the library's full locale
  list, to keep the UI manageable).
- Seed option: an optional numeric seed input for reproducible generation
  (faker.js supports seeding its random generator) — genuinely useful for
  anyone wanting the same "random" dataset again for consistent test
  fixtures, worth including since it's a small addition with real value
  for this tool's likely developer audience.
- Live preview: show a small sample (e.g. first 5 rows) of the generated
  data as the schema is being built, before committing to generating the
  full requested record count.
- Generate button (for larger record counts, do the generation in a Web
  Worker if it's slow enough to matter — check actual performance at
  realistic upper-bound record counts like 5,000-10,000 rows with several
  fields before deciding whether this is needed, don't add a worker
  speculatively if generation is fast enough to stay responsive without
  one).
- CopyButton and Download (matching format extension) on the generated
  output.

STEP 4 — Logic separation: apps/web/app/tools/random-data-generator/utils/:
- fieldTypes.ts — a typed registry mapping each supported field type to
  its corresponding faker.js generator function call, so adding new field
  types later is a matter of extending this registry rather than touching
  the generation logic itself.
- generateDataset.ts — generateRecords(schema: FieldSchema[], count:
  number, seed?: number): Record<string, unknown>[], the core generation
  loop, applying the seed if provided.
- exportFormatters.ts — formatAsJson(records), formatAsCsv(records)
  (reuse csv-json-converter's JSON-to-CSV logic if it's factored generically
  enough — check first rather than reimplementing), formatAsSqlInserts(
  records, tableName: string): string.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the seed option produces genuinely reproducible output — test by
   generating a dataset with a specific seed, regenerating with the same
   seed, and confirming the output is identical both times.
2. Confirm whether generateDataset needed a Web Worker at realistic upper-
   bound record counts, and state what was actually tested (record count,
   field count, approximate generation time observed).
3. Confirm the CSV export path reused csv-json-converter's existing
   formatting logic, or state why a separate implementation was needed if
   so.
```

## Note
**Reproducibility via seeding is a small feature but a real differentiator**
for this tool's likely developer/QA audience — "the same fake dataset every
time" matters for anyone using generated data in an automated test suite
or reproducible demo, and it's worth confirming this actually works as
advertised rather than being a decorative input that doesn't affect output
determinism.
