# Claude Code Prompt — Build Tool #2: Password Generator

Run this after packages/tool-shell and the JSON Formatter (tool #1) both exist
and work. This tool should need almost no new shared-package work — it's the
first real test of whether tool-shell + ui are reusable as designed.

---

```
Build the Password Generator tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/password-generator/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and whatever else got added while
  building the JSON Formatter — check what exists before writing new
  primitives. A password strength meter / range slider likely doesn't exist
  yet; if you build one, put it in packages/ui, not inline here, since
  "Password Strength Checker" (a future tool) will want the same meter.
- 100% client-side. Use the Web Crypto API (crypto.getRandomValues) for all
  randomness — never Math.random(), this is a security tool and needs to be
  actually secure, not just look like it.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Generated passwords render in
  font-mono, per the cross-tool convention.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'password-generator', title: 'Password Generator',
    shortDescription: 'Generate strong, random passwords instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Password Generator - Free Secure Password Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Password Generator"
    description="Generate strong, random passwords — computed locally, never sent anywhere."
    category="developer"
    tier="free"
    relatedTools={['uuid-hash-generator', 'json-formatter', 'base64-tool']}
    faq={[...]}
  >
    <PasswordGenerator />
  </ToolShell>
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what makes a password strong (length > character complexity),
  whether generated passwords are stored anywhere (no — confirm Web Crypto
  API is used and nothing leaves the browser), how often to regenerate/rotate
  passwords, and whether this tool is safe to use for real account passwords
  (yes, because generation happens entirely client-side).

STEP 3 — PasswordGenerator.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Large output field showing the generated password in font-mono, generated
  immediately on page load (don't make the user click first for an empty tool).
- Length slider, range 4-64, default 16. Show the current value numerically
  next to the slider, not just the handle position.
- Character set toggles (checkboxes, all default ON except symbols which
  should default ON too — bias toward strong defaults):
  - Uppercase (A-Z)
  - Lowercase (a-z)
  - Numbers (0-9)
  - Symbols (!@#$%^&* etc.)
- "Exclude ambiguous characters" toggle (excludes 0/O, 1/l/I, etc.) — off by
  default, useful for passwords a human might need to type manually.
- Regenerate button (large, primary action) — also regenerate automatically
  whenever length or character set toggles change, debounced isn't needed
  here since generation is instant.
- CopyButton (from packages/ui) on the output.
- Strength indicator: a visual meter (weak/fair/strong/very strong) based on
  entropy calculation (length × log2(character pool size)), not a canned
  regex-based scorer. Show the actual entropy in bits as a small label for
  users who want the real number, not just a colored bar.
- Bulk generation: "Generate 10 passwords" button that lists 10 at once in a
  scrollable list, each with its own small copy icon, plus a "copy all"
  option. This is a good candidate to gate as Pro later (flag it as such in
  a comment, but build it fully functional and free for now — tier gating
  logic doesn't exist yet in the repo).
- Validation: guard against all four character-set toggles being off
  (disable Regenerate, show inline message "Select at least one character
  type" rather than silently generating an empty string).

STEP 4 — Logic separation:
Extract the generation and entropy-calculation logic into
apps/web/app/tools/password-generator/utils/generatePassword.ts as pure,
typed functions (no `any`):
  - generatePassword(options: PasswordOptions): string
  - calculateEntropy(length: number, poolSize: number): number
  - getStrengthLabel(entropyBits: number): 'weak' | 'fair' | 'strong' | 'very-strong'
This keeps it unit-testable and reusable if a future "Password Strength
Checker" tool wants calculateEntropy/getStrengthLabel without the generator.

STEP 5 — Accessibility:
- Slider must be operable via keyboard (arrow keys), not just drag.
- Strength meter needs a text equivalent (aria-label or visible text), not
  color alone.
- Output field should have a visible focus state and be selectable/copyable
  via keyboard, not just the CopyButton.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Whether any new packages/ui primitive was needed (e.g. a range slider or
   strength meter) beyond what JSON Formatter already added — this tells us
   how reusable tool-shell + ui actually are two tools in.
2. Whether generatePassword.ts's entropy logic is generic enough to reuse
   directly for a future Password Strength Checker tool.
```

---

## Notes

- This is the first tool where a **security correctness detail matters**
  (Web Crypto API, not `Math.random()`) — worth double-checking Claude Code
  actually used `crypto.getRandomValues` in the output rather than defaulting
  to `Math.random()`, since both "look" like they work.
- The bulk-generation feature is flagged as a future Pro-gate candidate but
  built free/functional now, since tier-gating infrastructure doesn't exist
  yet — that's deliberate, don't ask Claude Code to stub auth logic this early.
- If this tool needs meaningfully *less* new scaffolding than JSON Formatter
  did, that's the signal `tool-shell`/`ui` are paying off as designed. If it
  needs just as much new work, worth pausing to ask what should move into the
  shared packages before tool #3.
