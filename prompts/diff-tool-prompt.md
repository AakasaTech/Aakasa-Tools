# Claude Code Prompt — Build Tool #26: Code / Text Diff Tool

Run after tool-shell and tools #1-25 exist. Pairs with a mature diffing
library — the value here is entirely in the UI presentation, not the diff
algorithm itself.

---

```
Build the Diff Tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/diff-tool/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `diff` npm package (the standard JS diffing
  library, implements Myers diff algorithm, supports line/word/char-level
  diffing) — install with `npm install diff @types/diff`. Do not hand-roll
  a diff algorithm — Myers diff (or similar) is a genuinely non-trivial
  algorithm and this library is the standard, well-tested choice.
- Design tokens as established; both input panes and the diff output use
  font-mono (this is code/text comparison, monospace matters for alignment).

STEP 1 — Register:
  { slug: 'diff-tool', title: 'Text & Code Diff Checker',
    shortDescription: 'Compare two texts or code snippets and see the differences instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['json-formatter', 'code-minifier', 'word-counter']. FAQ (3-4 Q&A): what a
diff shows (additions, deletions, and unchanged content between two texts),
the difference between line-level and word/character-level diffing (and
when each is more useful — line-level for comparing whole files/configs,
word-level for comparing prose/short snippets where line-level would be too
coarse), a note this works for any plain text, not just code, and the
privacy note.

STEP 3 — DiffTool.tsx:
- Two side-by-side input panels: "Original" and "Changed" (textareas,
  font-mono, resizable/generous height).
- Diff granularity selector: Line / Word / Character — maps to the `diff`
  library's diffLines / diffWords / diffChars functions respectively.
- View mode toggle: Side-by-side (two columns, aligned, with
  added/removed/unchanged highlighting per line) vs. Unified (single
  column, git-diff-style with +/- prefixes and color coding) — both are
  genuinely useful for different contexts (side-by-side for visual
  comparison, unified for a compact copyable summary), build both rather
  than picking one.
- Color coding: additions in a success-tinted background, deletions in a
  danger-tinted background with strikethrough, unchanged content in default
  styling — consistent with the design tokens (success/danger colors
  already defined).
- Line numbers in both side-by-side and unified views.
- Stats summary: lines/words added, removed, and unchanged count — small
  stat line above the diff output, consistent with the established
  stat-display pattern.
- "Ignore whitespace" toggle (ignores leading/trailing whitespace and
  collapses multiple spaces when computing the diff — genuinely useful for
  comparing code that differs only in formatting, not substance).
- "Ignore case" toggle.
- Swap button (swaps Original and Changed content).
- Paste-from-clipboard convenience buttons on each input (small, optional —
  standard paste already works via keyboard/right-click, this is just a
  discoverable button alternative).
- CopyButton on the unified diff view specifically (the side-by-side view
  isn't naturally copyable as useful plain text, but the unified view's
  +/- format is a recognizable, useful format to copy — e.g. for pasting
  into a code review comment).
- Export: Download the unified diff as a .diff/.patch-style text file.

STEP 4 — Logic separation: apps/web/app/tools/diff-tool/utils/
computeDiff.ts — computeDiff(original: string, changed: string, options:
{ granularity: 'line' | 'word' | 'char'; ignoreWhitespace: boolean;
ignoreCase: boolean }): DiffResult, wrapping the `diff` library and
normalizing its output into a consistent shape both the side-by-side and
unified view components can consume. Also a formatUnifiedDiff(diffResult):
string helper for the copy/export output. Typed, no `any`.

STEP 5 — Performance: for very large inputs (e.g. comparing two multi-
thousand-line files), diffing can become slow — debounce the live diff
computation (~400ms) and consider a Web Worker if testing with a genuinely
large realistic input (e.g. two ~5,000 line files) shows noticeable main-
thread jank; only add the worker if actually needed, don't add it
speculatively.

STEP 6 — Verify: registry entry resolves.

After building, tell me:
1. Confirm both side-by-side and unified views render correctly and stay
   visually aligned for a multi-line diff with insertions AND deletions
   interspersed (not just a simple single-line change) — this is the case
   where alignment bugs in a hand-rolled or poorly-adapted diff UI most
   commonly show up.
2. Confirm whether a Web Worker was needed for large inputs, or whether the
   `diff` library's performance was sufficient on the main thread even for
   a several-thousand-line test case — state what was actually tested.
3. Confirm the "ignore whitespace" and "ignore case" toggles genuinely
   change the diff output for a test case designed to demonstrate each
   (e.g. two lines identical except for trailing whitespace, and two lines
   identical except for case) — confirm they're not inert toggles.
```

## Note
The diff algorithm itself is a solved problem via the `diff` library — the
real work and real risk in this tool is entirely in the presentation layer:
correctly rendering aligned side-by-side and unified views for diffs with
interspersed additions/deletions (not just simple appends), which is where
UI implementations most commonly have subtle alignment or off-by-one bugs
even when the underlying diff computation itself is correct.
