# Claude Code Prompt — Build Tool #61: Case Converter

Run after tool-shell and tools #1-60 exist. Simple, fast build — pure
string transforms, good pace after the calculator-heavy batch.

---

```
Build the Case Converter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/case-converter/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string transforms — no library needed, though be
  careful with word-boundary detection for the programming-case conversions
  (camelCase, PascalCase, snake_case, kebab-case) since naive
  space-splitting breaks on already-cased input (e.g. converting
  "myVariableName" to snake_case needs to detect the existing camelCase
  word boundaries, not just replace spaces).
- Design tokens as established. Input/output in font-mono.

STEP 1 — Register:
  { slug: 'case-converter', title: 'Case Converter',
    shortDescription: 'Convert text between UPPERCASE, lowercase, Title Case, camelCase, and more.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['word-counter', 'slug-generator', 'json-to-typescript'] (check
TOOL_REGISTRY, drop unregistered). FAQ (3-4 Q&A): brief description of each
case style and where it's commonly used (Title Case for headings, camelCase
for JS variables, snake_case for Python/database columns, kebab-case for
URLs/CSS classes), a note on how word-boundary detection works across
mixed input (handles spaces, hyphens, underscores, AND existing
camelCase/PascalCase boundaries as word separators, so converting between
any two styles works regardless of the input's current format), and the
privacy note.

STEP 3 — CaseConverter.tsx:
- Input textarea (font-mono).
- Output buttons/tabs, each showing the live-converted result for one case
  style, all updating simultaneously as the input changes (rather than
  requiring the user to pick one target style at a time — showing all
  conversions at once is more useful for a quick-reference tool like this):
  - UPPERCASE
  - lowercase
  - Title Case (Each Word Capitalized)
  - Sentence case (Only first letter of the sentence capitalized)
  - camelCase
  - PascalCase
  - snake_case
  - SCREAMING_SNAKE_CASE
  - kebab-case
  - Train-Case (Capitalized-Kebab)
  - dot.case
- Each result has its own CopyButton (a quick-reference tool where the user
  might want any one of several outputs, not just the "primary" one).
- Clear button.

STEP 4 — Logic separation: apps/web/app/tools/case-converter/utils/
caseConvert.ts:
- tokenizeWords(input: string): string[] — the core word-boundary detection
  function, splitting on spaces/hyphens/underscores AND detecting
  camelCase/PascalCase internal boundaries (lowercase-to-uppercase
  transitions), handling consecutive uppercase runs sensibly (e.g. an
  acronym like "XMLParser" should tokenize as ["XML", "Parser"], not
  ["X","M","L","Parser"] — a reasonable heuristic: a run of uppercase
  letters followed by a lowercase letter treats the last uppercase letter
  as the start of the next word). This tokenizer is the single most
  important piece of logic in this tool — every case style is just a
  different way of rejoining the same word list.
- Per-style formatters, each taking the tokenized word list and rejoining
  it appropriately: toUpperCase, toLowerCase, toTitleCase, toSentenceCase,
  toCamelCase, toPascalCase, toSnakeCase, toScreamingSnakeCase, toKebabCase,
  toTrainCase, toDotCase.
All pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the tokenizer correctly handles the acronym case described above
   (e.g. "XMLHttpRequest" or "getUserID") — state the actual tokenization
   result for a test input containing an acronym, since this is the one
   genuinely tricky edge case in an otherwise simple tool.
2. Confirm round-tripping works sensibly: convert a plain-English phrase to
   camelCase, then convert THAT camelCase result back through the tool to
   snake_case, and confirm the word boundaries are preserved correctly
   through the intermediate camelCase form (this exercises the tokenizer's
   ability to read its own camelCase output, not just original input).
```

## Note
**Word-boundary tokenization (specifically the acronym-handling case) is
the one place this "simple" tool can go subtly wrong** — most naive
camelCase-to-snake_case converters handle basic cases fine but produce
garbled results on inputs containing acronyms or already-mixed-case text,
since a plain "insert underscore before every uppercase letter" approach
turns "XMLParser" into "x_m_l_parser" instead of the expected "xml_parser".
Worth specifically testing this rather than only trying plain lowercase-
word inputs.
