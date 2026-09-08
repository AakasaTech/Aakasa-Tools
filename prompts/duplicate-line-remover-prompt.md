# Claude Code Prompt — Build Tool #63: Duplicate Line Remover

Run after tool-shell and tools #1-62 exist. Trivial logic, one small but
genuinely important UX decision around case-sensitivity and whitespace
handling.

---

```
Build the Duplicate Line Remover for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/duplicate-line-remover/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string processing — no library needed.
- Design tokens as established. Input/output in font-mono.

STEP 1 — Register:
  { slug: 'duplicate-line-remover', title: 'Duplicate Line Remover',
    shortDescription: 'Remove duplicate lines from a list or text block instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['text-sorter', 'word-counter', 'csv-viewer'] (check TOOL_REGISTRY, drop
unregistered). FAQ (3-4 Q&A): how duplicate detection works (exact
line-by-line comparison, with configurable case-sensitivity and whitespace
handling per Step 3), common use cases (cleaning up email lists, deduping
a list of URLs or keywords, tidying exported data), and the privacy note.

STEP 3 — DuplicateLineRemover.tsx:
- Input textarea (font-mono).
- Options:
  - Case-sensitive toggle (default OFF — "Example.com" and "example.com"
    treated as duplicates by default, since this matches the more common
    real-world intent for lists like URLs/emails; ON treats them as
    distinct).
  - Trim whitespace before comparing (default ON — leading/trailing spaces
    on an otherwise-identical line shouldn't prevent duplicate detection in
    the common case).
  - Ignore empty lines (default ON — blank lines are rarely meaningful
    "duplicates" worth reporting/removing specially, though see the next
    option).
  - "Keep first occurrence" vs. "Keep last occurrence" (default: keep
    first — determines which copy of a duplicate survives, relevant if
    line order in the output matters to the user).
  - Sort output alphabetically after deduping (optional toggle, off by
    default — deduping and sorting are separate, composable operations,
    don't force them together).
- Live output as options/input change.
- Stats summary: total lines in input, unique lines in output, number of
  duplicates removed — a clear, satisfying "removed 47 duplicate lines"
  style summary.
- CopyButton and "Download as .txt" on the output.

STEP 4 — Logic separation: apps/web/app/tools/duplicate-line-remover/
utils/removeDuplicates.ts — removeDuplicateLines(text: string, options: {
  caseSensitive: boolean; trimWhitespace: boolean; ignoreEmptyLines: boolean;
  keepFirst: boolean; sortOutput: boolean }): { result: string;
  totalLines: number; uniqueLines: number; duplicatesRemoved: number }.
Pure, typed, no `any`. Careful with the case-insensitive comparison
specifically — compare using a normalized (lowercased) key for
duplicate-detection purposes while preserving the ORIGINAL casing of
whichever occurrence is kept in the output (don't lowercase the actual
output text, only the internal comparison key) — this is a common subtle
bug where a case-insensitive dedupe accidentally also destroys the
original casing of the surviving lines.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm case-insensitive mode preserves the ORIGINAL casing of the
   kept line in the output — test with input containing "Hello" and
   "hello" as duplicate lines (case-insensitively) and confirm the output
   keeps whichever one was configured to survive (first or last) with its
   original casing intact, not lowercased.
2. Confirm the "keep first" vs "keep last" toggle actually changes which
   occurrence survives when duplicates have different original casing —
   test this specific interaction between the two settings.
```

## Note
**Preserving original casing during case-insensitive deduplication is the
one subtle bug worth checking** — it's easy to accidentally lowercase the
comparison key AND the output text together (since they might come from
the same variable if not handled carefully), which would silently mangle
the case of every line in the output even though the user only asked for
case-insensitive MATCHING, not case normalization.
