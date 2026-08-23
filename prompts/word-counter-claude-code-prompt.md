# Claude Code Prompt — Build Tool #4: Word / Character Counter

Run this after packages/tool-shell, JSON Formatter (#1), Password Generator
(#2), and UUID/Hash Generator (#3) all exist and work. This should be the
simplest build yet — a good check on whether tool-shell + ui are letting
later tools go faster, not slower.

---

```
Build the Word & Character Counter tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/word-counter/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives built across the
  first three tools — check what exists before writing anything new. This
  tool is simple enough it likely needs zero new primitives.
- 100% client-side. All counting/analysis happens on keystroke, in-memory,
  nothing stored or transmitted.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. The text input area uses font-mono
  per the cross-tool convention (even though this is prose, not code — stay
  consistent with the established pattern across all tools).

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'word-counter', title: 'Word & Character Counter',
    shortDescription: 'Count words, characters, sentences, and reading time instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Word & Character Counter - Free Online Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Word & Character Counter"
    description="Count words, characters, sentences, and estimate reading time — instantly, in your browser."
    category="text-writing"
    tier="free"
    relatedTools={['json-formatter', 'regex-tester', 'meta-tag-previewer']}
    faq={[...]}
  >
    <WordCounter />
  </ToolShell>
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: how word count is determined (whitespace-delimited tokens vs.
  something smarter), how reading time is estimated (state the WPM assumption
  used, e.g. 200 wpm, and that it's an estimate), whether the tool handles
  non-English text/CJK characters reasonably, and confirmation nothing typed
  here is stored or transmitted.

STEP 3 — WordCounter.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Large textarea (font-mono, generous min-height, resizable) as the primary
  input — this tool is 90% input area, stats should feel secondary/ambient,
  not competing for space.
- Live stats bar (updates on every keystroke, no debounce needed — this is
  cheap to compute):
  - Word count
  - Character count (with spaces)
  - Character count (without spaces)
  - Sentence count (split on ./!/? with reasonable handling of abbreviations
    like "Mr." not being treated as a sentence end — don't over-engineer
    this, a simple heuristic is fine, just don't be naively wrong on common
    cases)
  - Paragraph count (split on double line breaks)
  - Estimated reading time (based on ~200 wpm, displayed as "~X min read")
  - Estimated speaking time (based on ~130 wpm, displayed as "~X min speech" —
    useful for scripts/speeches, a nice differentiator over basic counters)
- Stats should be laid out as a clean stat-grid (label + number, small caps
  or muted label style) above or beside the textarea, not buried in a
  sentence like "You have written X words."
- Clear button.
- Paste-and-replace: if the textarea already has content and the user pastes,
  just replace/append normally (no special handling needed — flagging this
  only so no unnecessary "are you sure" dialog gets added, keep it frictionless).
- Character limit indicator (optional, toggle-able): let the user set a
  target limit (e.g. "280" for a tweet, "160" for an SMS) and show a
  live remaining/over count with a color shift (ink → danger) when exceeded.
  Include a small dropdown of common presets (Twitter/X 280, SMS 160,
  Meta description 160, Instagram caption 2200) that fill the limit field.
- Keyword density (optional but valuable for the target audience — this tool
  will attract content writers/SEO users): a small collapsible section
  showing the top 5-10 most frequent words (excluding common stop words:
  the, a, an, is, to, of, and, etc.) with their count and percentage. Put
  the stop-word list in the utils file, not inline in the component.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/word-counter/utils/textStats.ts as pure,
typed functions (no `any`):
  - countWords(text: string): number
  - countCharacters(text: string, includeSpaces: boolean): number
  - countSentences(text: string): number
  - countParagraphs(text: string): number
  - estimateReadingTime(wordCount: number, wpm?: number): number  // minutes
  - estimateSpeakingTime(wordCount: number, wpm?: number): number // minutes
  - getKeywordDensity(text: string, topN?: number): { word: string; count: number; percentage: number }[]
This keeps every stat unit-testable independently and reusable if a future
tool (e.g. a dedicated SEO content analyzer) wants these functions directly.

STEP 5 — Performance:
No Web Worker needed — even large pasted documents (tens of thousands of
words) compute these stats fast enough on the main thread. Just debounce the
keyword-density calculation specifically (~300ms) since regex-based word
frequency counting is the one moderately expensive operation here; the basic
counts (words/chars/sentences/paragraphs) should stay instant/undebounced.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Whether this tool needed any new packages/ui primitives at all — it's a
   good signal if the answer is "no, everything reused."
2. Whether textStats.ts's functions are written generically enough that a
   future SEO-focused tool could import getKeywordDensity/estimateReadingTime
   directly without modification.
```

---

## Notes

- This tool is intentionally the "easy one" in the build order — after three
  tools with real logic (parsing, crypto, hashing), this is mostly UI
  polish and simple string math. If Claude Code still needs a lot of new
  scaffolding here, that's a stronger signal something's off in tool-shell/ui
  than it would be on a harder tool.
- The **keyword density** and **character-limit presets** features are the
  differentiators that make this more useful than the hundreds of generic
  word counters online — worth keeping both even though they add slight
  scope, since they're cheap to build and target your likely audience
  (content writers, SEO users) well.
- Nothing in this tool needs Pro-gating — it's a pure SEO/traffic play, free
  tier all the way, high search volume, trivial to build. Good for organic
  growth and cross-linking into your dev-tool-heavy catalog.
