# Claude Code Prompt — Build Tool #62: Lorem Ipsum Generator

Run after tool-shell and tools #1-61 exist. Trivial build — static
reference text plus simple randomized assembly.

---

```
Build the Lorem Ipsum Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/lorem-ipsum-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, no library needed — the classic Lorem Ipsum source text
  is public domain (derived from a 45 BC Latin text by Cicero, the
  placeholder-text convention itself has been standard practice since the
  1500s), so bundling the traditional passage as static text is fine, not
  a copyright concern like other reference/quote content elsewhere in the
  toolbox.
- Design tokens as established. Output in font-mono is optional here —
  since this is meant to look like BODY TEXT/prose (the whole point is
  previewing realistic paragraph content), font-body may actually be more
  appropriate for the output display than font-mono; use font-body for the
  generated placeholder text specifically, breaking from the toolbox's
  usual "data renders in font-mono" convention since this "data" IS prose.

STEP 1 — Register:
  { slug: 'lorem-ipsum-generator', title: 'Lorem Ipsum Generator',
    shortDescription: 'Generate placeholder Lorem Ipsum text for mockups and designs.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['word-counter', 'placeholder-image-generator', 'html-entity-tool']. FAQ
(3-4 Q&A): what Lorem Ipsum is and why it's used (scrambled/derived Latin
text used as placeholder content in design/typesetting since it doesn't
distract the eye with readable meaning, letting viewers focus on layout
and typography), a brief historical note (genuinely interesting, low
effort to include, and adds legitimate content depth), and the privacy
note (minimal relevance, but keep consistent).

STEP 3 — LoremIpsumGenerator.tsx:
- Generation unit selector: Paragraphs / Sentences / Words.
- Count input (numeric, e.g. "5 paragraphs").
- "Start with 'Lorem ipsum dolor sit amet...'" toggle — the traditional
  convention is for generated text to always begin with this exact
  standard opening phrase (default ON, matching user expectation from
  every other Lorem Ipsum generator), with the option to turn it off for
  fully randomized text from the source corpus instead.
- HTML wrapping option: plain text output, OR wrapped in `<p>` tags per
  paragraph (useful for pasting directly into HTML markup as realistic
  placeholder content) — a small, genuinely convenient toggle for the
  tool's likely developer/designer audience.
- Live-generated output, regenerating as options change.
- "Regenerate" button (produces a new random selection/ordering from the
  source corpus even with the same settings, for users who want different
  specific text at the same length).
- CopyButton on the output.
- Bonus variant option (nice-to-have, adds some personality): alongside
  classic Latin Lorem Ipsum, offer 1-2 alternative "placeholder text"
  styles using genuinely original, non-copyrighted content — e.g. a
  "Hipster Ipsum"-style or "Corporate Buzzword Ipsum"-style generator using
  an original word list you write yourself (not copied from any existing
  branded "X Ipsum" generator site, since those specific word lists/branding
  may not be freely reusable even if the *concept* of themed placeholder
  text is common) — keep this genuinely optional/secondary to the classic
  Latin default, which should remain the primary, default experience.

STEP 4 — Logic separation: apps/web/app/tools/lorem-ipsum-generator/
utils/:
- loremCorpus.ts — the static source text (the traditional Lorem Ipsum
  passage, public domain) broken into a word/sentence pool for random
  sampling, plus any original bonus word lists per Step 3.
- generateLorem.ts — generateLoremText(unit: 'paragraphs' | 'sentences' |
  'words', count: number, startWithClassicOpening: boolean, wrapInHtml:
  boolean): string, the generation logic sampling from the corpus.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the classic-opening toggle works correctly (generated text
   starts with the exact traditional phrase when enabled, doesn't when
   disabled).
2. If a bonus placeholder-text variant was built, confirm its word list is
   original content written for this build, not copied from an existing
   third-party "themed ipsum" generator's specific word list.
```

## Note
This is one of the simplest builds in the catalog — the only thing worth a
second look is making sure any bonus "themed ipsum" variant (if built) uses
an originally-written word list rather than copying a specific existing
site's branded vocabulary, since the generic *concept* of themed placeholder
text is common and unprotectable, but a specific curated word list someone
else wrote and branded could be a closer call worth avoiding by simply
writing your own.
