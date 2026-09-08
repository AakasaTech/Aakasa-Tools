# Claude Code Prompt — Build Tool #67: Line Break & Whitespace Cleaner

Run after tool-shell and tools #1-66 exist. Simple, genuinely useful
"paste messy text, get clean text" utility.

---

```
Build the Line Break & Whitespace Cleaner for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/whitespace-cleaner/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string/regex processing — no library needed. Be
  aware of line-ending differences (\n vs \r\n vs \r) when processing
  pasted text from different sources (Windows-originated text commonly
  uses \r\n) — normalize line endings consistently as part of the cleaning
  process rather than only handling \n and leaving stray \r characters
  behind.
- Design tokens as established. Input/output in font-mono.

STEP 1 — Register:
  { slug: 'whitespace-cleaner', title: 'Line Break & Whitespace Cleaner',
    shortDescription: 'Clean up extra spaces, line breaks, and whitespace from text, instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['duplicate-line-remover', 'word-counter', 'html-entity-tool']. FAQ
(3-4 Q&A): common sources of messy whitespace (copy-pasting from PDFs,
emails, or word processors often introduces extra spaces, inconsistent
line breaks, or invisible characters), what each cleaning option does
(per Step 3), and the privacy note.

STEP 3 — WhitespaceCleaner.tsx:
- Input textarea (font-mono).
- Cleaning options (checkboxes, each independently toggleable, live-applied
  to the output as the input or options change):
  - Trim leading/trailing whitespace from each line.
  - Collapse multiple consecutive spaces into a single space.
  - Remove multiple consecutive blank lines (collapse down to a maximum of
    one blank line between paragraphs — a configurable max, default 1).
  - Remove ALL blank lines entirely (a more aggressive alternative to the
    above, mutually exclusive with it via the UI — offer as a distinct
    choice, not both applied simultaneously to avoid confusing double-
    application).
  - Remove all line breaks (join everything into a single line/paragraph
    with spaces between — useful for converting a broken-up pasted
    paragraph back into flowing text).
  - Normalize line endings (convert all \r\n and \r to \n — mostly
    invisible to the user but genuinely useful for cleaning up text before
    pasting into code or a system sensitive to line-ending consistency,
    worth a brief inline explanation of why this matters).
  - Remove non-breaking spaces (a common invisible artifact from
    copy-pasting from web pages or Word documents — convert U+00A0 to a
    regular space) and other common invisible/zero-width characters (e.g.
    zero-width space U+200B) that can cause confusing issues later (text
    that "looks right" but behaves oddly in code or search) — detect and
    strip a small, well-known set of these rather than attempting to be
    exhaustive about every obscure Unicode whitespace variant.
  - Remove tabs / convert tabs to spaces (with a configurable space count).
- Live output as options/input change.
- Character count comparison: input length vs. output length, showing how
  much was actually removed — a satisfying, concrete confirmation the
  cleaning did something.
- CopyButton and "Download as .txt" on the output.

STEP 4 — Logic separation: apps/web/app/tools/whitespace-cleaner/utils/
cleanWhitespace.ts — cleanText(text: string, options: CleaningOptions):
string, applying each enabled cleaning operation in a sensible order
(normalize line endings first, then other operations, since later steps
may depend on consistent line-ending representation). Pure, typed, no
`any`. Include a small, explicit list of the invisible/zero-width
characters targeted by the "remove invisible characters" option as a
named constant, not inline magic character codes buried in a regex.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm line-ending normalization correctly handles mixed input
   containing both \n and \r\n line endings (a realistic scenario when
   text is pasted from different sources) — confirm the output uses
   consistent line endings throughout, not a mix.
2. Confirm the non-breaking-space removal actually catches U+00A0
   specifically — test with input containing a non-breaking space (which
   can be tricky to even type/paste for testing — confirm how this was
   verified) and confirm it's converted to a regular space in the output.
```

## Note
This is a low-risk, genuinely useful build — the main things worth a
second look are the line-ending normalization (handling mixed \n/\r\n
input correctly, a realistic case given text pasted from multiple sources)
and the invisible-character removal actually targeting the specific
Unicode code points it claims to, rather than being a vague "cleans up
weird characters" feature with no concrete verification of what it
actually catches.
