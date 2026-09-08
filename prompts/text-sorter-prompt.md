# Claude Code Prompt — Build Tool #64: Text Sorter

Run after tool-shell and tools #1-63 exist. Closes the dangling
'text-sorter' reference from Duplicate Line Remover. Simple sorting tool
with one genuinely non-obvious trap: naive numeric-string sorting.

---

```
Build the Text Sorter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/text-sorter/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string/array sorting — no library needed, though
  use the native `Intl.Collator` for locale-aware alphabetical sorting
  rather than a bare `.sort()` with default lexicographic comparison,
  which handles accented characters and case in a way that often doesn't
  match human expectations (e.g. default JS sort puts all uppercase
  letters before all lowercase ones due to ASCII ordering, producing a
  result like "Banana, Apple, apple, banana" instead of the more expected
  "Apple, apple, Banana, banana" or similar human-friendly grouping —
  Intl.Collator's default settings handle this correctly).
- Design tokens as established. Input/output in font-mono.

STEP 1 — Register:
  { slug: 'text-sorter', title: 'Text Sorter',
    shortDescription: 'Sort lines of text alphabetically, numerically, or by length, instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['duplicate-line-remover', 'word-counter', 'csv-viewer']. FAQ (3-4 Q&A):
the sort modes available (per Step 3), a specific note on the difference
between alphabetical/lexicographic sorting and NATURAL numeric sorting for
lines containing numbers (e.g. sorting ["item2", "item10", "item1"] purely
alphabetically produces ["item1", "item10", "item2"], which looks wrong to
most people expecting numeric order — explain that this tool offers a
"natural sort" option specifically to handle this correctly), and the
privacy note.

STEP 3 — TextSorter.tsx:
- Input textarea (font-mono), one item per line.
- Sort mode selector:
  - Alphabetical (A-Z / Z-A) — using Intl.Collator per CONTEXT for
    locale-aware, human-expected ordering.
  - Natural/numeric sort (handles embedded numbers correctly — "item2"
    sorts before "item10", per the FAQ explanation; also handles lines
    that are PURELY numeric, sorting them by actual numeric value rather
    than as strings).
  - By length (shortest to longest / longest to shortest).
  - Random shuffle (a genuinely different, sometimes-useful mode — e.g.
    randomizing a list of names for a drawing/raffle order).
- Case sensitivity toggle for alphabetical mode (default: case-insensitive,
  consistent with the default chosen in Duplicate Line Remover for
  consistency across the toolbox's text tools).
- Reverse toggle (applies to any mode — flips the resulting order).
- Live output as options/input change (except random shuffle, which should
  have an explicit "shuffle" button rather than reshuffling on every
  keystroke, since a live-reshuffling-as-you-type random mode would be
  actively unhelpful/confusing).
- Stats: line count.
- CopyButton and "Download as .txt" on the output.

STEP 4 — Logic separation: apps/web/app/tools/text-sorter/utils/sortLines.ts
— sortLines(lines: string[], mode: 'alphabetical' | 'natural' | 'length' |
'random', options: { caseSensitive: boolean; reverse: boolean }): string[].
For the natural-sort mode specifically, implement a proper natural-sort
comparator (splitting each line into alternating text/number segments and
comparing number segments numerically rather than as strings — this is a
well-known, bounded algorithm, don't reach for a heavy external library for
it, a straightforward regex-based segment-split-and-compare implementation
is standard and sufficient). Pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm natural sort correctly orders a test list like ["item2",
   "item10", "item1", "item20"] as ["item1", "item2", "item10", "item20"]
   (numeric order), not the naive alphabetical result ["item1", "item10",
   "item2", "item20"] — state the actual output for this test case.
2. Confirm alphabetical sort using Intl.Collator produces a human-expected
   order for a mixed-case test list (e.g. ["banana", "Apple", "apple",
   "Banana"]) rather than the ASCII-ordering artifact described in
   CONTEXT — state the actual output order.
```

## Note
**Natural sort is the one feature that separates this tool from a one-line
`.sort()` call** — without it, this tool would produce the same
unsatisfying, "technically alphabetical but not what anyone actually wants"
ordering that most naive sort implementations give for lists containing
numbers, which is exactly the frustration that motivates someone to look
for a dedicated sorting tool in the first place. Worth verifying this
specific case rather than assuming a generic sort function covers it.
