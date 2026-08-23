# Claude Code Prompt — Build Tool #6: Regex Tester

Run this after tool-shell and tools #1-5 all exist and work. This tool
attracts a sticky developer audience — good candidate for cross-promoting
BillCraft/SupportCraft to repeat visitors later.

---

```
Build the Regex Tester tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/regex-tester/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-5 —
  check what exists before writing anything new.
- 100% client-side. Uses native browser RegExp — no regex engine libraries
  needed. Be aware native JS RegExp can catastrophically backtrack on
  pathological patterns (e.g. nested quantifiers like (a+)+) — see Step 3
  note on execution safety.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Pattern input and test string use
  font-mono.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'regex-tester', title: 'Regex Tester',
    shortDescription: 'Test and debug regular expressions with live match highlighting.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Regex Tester - Free Online Regular Expression Tool |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Regex Tester"
    description="Test regular expressions with live match highlighting — entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['json-formatter', 'base64-tool', 'word-counter']}
    faq={[...]}
  >
    <RegexTester />
  </ToolShell>
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: which regex flavor this tool uses (JavaScript/ECMAScript regex,
  note it differs slightly from PCRE/Python in some edge cases — e.g.
  lookbehind support varies by browser, named groups syntax), what the flag
  options mean (g/i/m/s/u), a note on catastrophic backtracking and why very
  complex patterns can hang a browser tab, and confirmation nothing typed
  here is stored or transmitted.

STEP 3 — RegexTester.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Pattern input (single line, font-mono, styled to look like a regex literal
  with /pattern/flags visual framing).
- Flag toggles as individual checkboxes/pills: g (global), i (case
  insensitive), m (multiline), s (dotAll), u (unicode) — each with a short
  tooltip on hover explaining what it does.
- Test string textarea (font-mono, multi-line, generous height) below or
  beside the pattern input.
- Live match highlighting: as the user types the pattern or test string,
  highlight all matches directly within the test string display (not a
  separate readonly output — overlay highlighting on the actual text so
  users see matches in context). Use a distinct accent-colored background on
  matched substrings; if capture groups exist, use a secondary subtle
  highlight/underline to distinguish full match vs. group boundaries.
- Match list panel: below or beside the highlighted text, list each match
  with its index, full match text, and any captured groups (numbered and
  named), in font-mono, scrollable if many matches.
- Match count summary (e.g. "3 matches found").
- Invalid regex handling: catch SyntaxError from the RegExp constructor and
  show a clear inline error message (e.g. "Invalid regular expression:
  Unterminated group") rather than crashing or silently showing zero matches.
- EXECUTION SAFETY: debounce pattern/test-string changes (~300ms), and wrap
  the actual regex execution with a timeout guard — since native JS RegExp
  has no built-in execution timeout, implement this by running the match in
  a Web Worker with a hard timeout (~1000ms); if the worker doesn't respond
  in time, terminate it and show "This pattern is taking too long to
  evaluate — it may be catastrophically backtracking. Try simplifying it."
  rather than freezing the tab. This is the single most important
  correctness/safety detail in this tool — do not skip it or treat it as
  optional, a naive main-thread regex.test() call can hang the entire page.
- Replace mode (toggle): add a "replacement" text input, apply
  pattern.replace(testString, replacement) and show the resulting output
  string below, with support for $1/$2/$<name> group references. Also route
  this through the same Web Worker timeout guard.
- Common pattern presets (dropdown or button row): email, URL, IP address,
  phone number (US format), hex color, date (ISO 8601) — clicking one fills
  the pattern input with a well-known, reasonably robust pattern and a short
  comment explaining what it matches. Store these in the utils file, not
  inline in the component.
- CopyButton for the pattern itself (useful for copying /pattern/flags to
  paste into code).
- Cheat sheet (collapsible section): a compact reference table of common
  regex tokens (\d, \w, \s, quantifiers, anchors, groups) — genuinely useful
  reference content that also adds SEO depth to the page.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/regex-tester/utils/:
  - regexPresets.ts — a typed array of { name: string; pattern: string;
    flags: string; description: string } for the common-pattern presets.
  - regexEngine.ts — pure functions: buildRegex(pattern: string, flags:
    string): RegExp | { error: string }, findMatches(regex: RegExp, text:
    string): MatchResult[], applyReplace(pattern: string, flags: string,
    text: string, replacement: string): string | { error: string }.
    These get called from within the Web Worker, so keep them dependency-free
    and workerizable (no DOM APIs inside).
  - workers/regex.worker.ts — wraps regexEngine.ts functions, receives
    { pattern, flags, testString, mode: 'match' | 'replace', replacement? }
    and posts back results or a timeout/error message.

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Confirm the Web Worker timeout guard actually works — test it yourself
   with a known catastrophic-backtracking pattern (e.g. /(a+)+$/ against a
   long string of "a" characters followed by "!") and confirm the tool shows
   the timeout message instead of freezing.
2. Whether regexEngine.ts's match/replace logic is generic enough that a
   future "Regex Cheat Sheet" or "Find & Replace" text tool could reuse it.
```

---

## Notes

- **The Web Worker timeout guard is the one non-negotiable part of this
  build** — this is the first tool where a malicious or accidental user
  input (a catastrophically backtracking pattern) can genuinely freeze the
  browser tab. Every other tool so far has been safe by construction; this
  one isn't, unless the timeout guard is real. Explicitly test it before
  considering this tool done.
- The **cheat sheet and common-pattern presets** are what make this
  meaningfully better than a bare regex playground — they're cheap to build
  and turn a one-off utility into something developers bookmark and return
  to, which matters for the "sticky developer audience" goal from your
  original tool shortlist.
- Named capture groups (`(?<name>...)`) should display with their name
  alongside numbered groups in the match list — a small detail that signals
  quality to a technical audience.
