# Claude Code Prompt — Build Tool #68: Readability Score Analyzer

Run after tool-shell and tools #1-67 exist. First tool implementing a real
academic formula (Flesch-Kincaid and related) — the syllable-counting
heuristic is the one piece worth taking seriously, since it's inherently
approximate for English.

---

```
Build the Readability Score Analyzer for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/readability-analyzer/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure text analysis — no library needed, though
  syllable counting for English (needed by most readability formulas) has
  no perfectly reliable algorithmic solution (English spelling doesn't map
  cleanly to syllable count) — implement a well-known heuristic (vowel-
  group counting with standard adjustments for silent trailing 'e',
  consecutive vowels counting as one syllable, etc. — this is a standard,
  widely-used approximation technique, not something to over-engineer) and
  be upfront in the FAQ that syllable counts (and therefore readability
  scores) are estimates, not perfectly precise, since this is genuinely
  true of every readability tool using this class of formula, not a
  limitation unique to this implementation.
- Check apps/web/app/tools/word-counter/utils/textStats.ts first — reuse
  its word/sentence counting functions rather than reimplementing basic
  text statistics that tool already provides correctly.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'readability-analyzer', title: 'Readability Score Analyzer',
    shortDescription: 'Check the readability of your text with Flesch-Kincaid and other scores.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['word-counter', 'meta-tag-previewer', 'social-post-previewer']. FAQ
(3-4 Q&A): what readability scores measure generally (how easy text is to
read, based on sentence length and word/syllable complexity — NOT a
measure of content quality, accuracy, or engagement, an important
distinction worth stating explicitly since a "readable" score doesn't mean
"good" writing), which formulas are included (Flesch Reading Ease and
Flesch-Kincaid Grade Level are the most widely recognized — briefly explain
what each score means, e.g. Flesch Reading Ease 0-100 scale where higher
is easier, Flesch-Kincaid Grade Level maps to a US school grade level), the
honest syllable-counting-is-approximate note from CONTEXT, and the privacy
note.

STEP 3 — ReadabilityAnalyzer.tsx:
- Input textarea (font-mono), reasonably large — this tool is meant for
  analyzing real paragraphs/articles, not single sentences.
- Live-computed scores (debounced ~300ms since syllable counting across a
  large text is more work than the simpler word-counter stats):
  - Flesch Reading Ease (0-100 scale, with a plain-language interpretation
    label alongside the number — e.g. "70-80: Fairly Easy, roughly 7th
    grade level" — the standard published interpretation bands).
  - Flesch-Kincaid Grade Level (maps to an approximate US school grade
    level).
  - Supporting stats feeding the formulas, shown transparently rather than
    hidden inside a black-box score: average sentence length (words per
    sentence), average syllables per word, total syllable count.
- Visual gauge/scale for the Flesch Reading Ease score (a simple horizontal
  scale showing where the current score falls among the standard
  interpretation bands — Very Easy through Very Difficult) — genuinely
  useful at-a-glance context beyond a bare number.
- Sentence-level highlighting (a genuinely valuable feature beyond a single
  aggregate score): highlight unusually long/complex sentences directly
  within the input text display — e.g. sentences significantly longer than
  the text's average, or containing many multi-syllable words — as a
  practical, actionable way to see WHERE readability could be improved,
  not just a single abstract number for the whole text.
- CopyButton on a summary of the scores.

STEP 4 — Logic separation: apps/web/app/tools/readability-analyzer/utils/:
- countSyllables.ts — countSyllablesInWord(word: string): number,
  implementing the standard vowel-group heuristic described in CONTEXT.
  This is the one function worth being explicit and well-commented about,
  since it's inherently an approximation — document the heuristic's rules
  directly in code comments so future maintenance understands its known
  limitations.
- readabilityFormulas.ts — calculateFleschReadingEase(avgSentenceLength,
  avgSyllablesPerWord): number, calculateFleschKincaidGrade(
  avgSentenceLength, avgSyllablesPerWord): number, using the standard
  published formula coefficients for each (look these up precisely rather
  than approximating from memory — getting a coefficient wrong would
  silently produce plausible-looking but incorrect scores).
- Import countWords/countSentences from word-counter's existing
  textStats.ts rather than reimplementing them.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. State the exact Flesch Reading Ease and Flesch-Kincaid Grade Level
   formula coefficients used, and confirm they match the standard,
   published versions of these formulas (this is checkable/citable
   information, worth stating precisely rather than approximating).
2. Test the syllable counter against a handful of known tricky English
   words (e.g. "the" = 1 syllable, "beautiful" = 3, "queue" = 1) and state
   the actual output for each — acknowledging upfront that a heuristic
   syllable counter won't be perfect on every word, but confirming it's
   reasonably accurate on common cases.
3. Confirm word/sentence counting was imported from word-counter's
   existing utils rather than reimplemented.
```

## Note
**The formula coefficients are worth stating precisely, not approximating
from memory** — Flesch Reading Ease and Flesch-Kincaid Grade Level have
specific, published coefficient values, and a subtly wrong coefficient
would produce a tool that looks like it's computing a real, recognized
readability score while actually giving numbers that don't match what
"Flesch-Kincaid" is supposed to mean — worse than not offering the score at
all, since it would misrepresent itself as measuring something standard
when it isn't. The syllable-counting heuristic is a different kind of
imprecision (inherent to the problem, present in every implementation of
this style of tool) and is fine to be approximate about, as long as that's
stated honestly.
