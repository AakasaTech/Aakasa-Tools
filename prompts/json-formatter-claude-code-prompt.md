# Claude Code Prompt — Build Tool #1: JSON Formatter (Final, Combined)

Run this from the repo root, after `packages/tool-shell` has been scaffolded
from tool-shell-spec.md. This supersedes the earlier draft prompt — it now
references the real ToolShell props API directly instead of describing it
loosely.

---

```
Build the JSON Formatter & Validator tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/json-formatter/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell already exists with a <ToolShell> component (props:
  title, description, category, tier, relatedTools, faq, children) and a
  TOOL_REGISTRY in packages/tool-shell/registry.ts. Use ToolShell — do not
  rebuild page chrome, breadcrumbs, tier badges, or the related-tools rail.
- packages/ui exists for shared primitives (Button, CopyButton, FileDropzone).
  Check what's there before writing a new primitive; add missing ones to
  packages/ui rather than inlining them in this tool.
- 100% client-side. No API routes, no server actions, no data storage anywhere.
  Assume user input may be sensitive — nothing leaves the browser, ever.
- Design tokens (already in tailwind.config): colors ink/paper/accent/success/
  danger, fonts font-display (Space Grotesk), font-body (Inter), font-mono
  (JetBrains Mono). All tool input/output text must use font-mono — this is
  the cross-tool visual signature, not optional.

STEP 1 — Register the tool:
Add an entry to packages/tool-shell/registry.ts:
  { slug: 'json-formatter', title: 'JSON Formatter & Validator',
    shortDescription: 'Format, validate, and minify JSON instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Static metadata for SEO: title "JSON Formatter & Validator - Free Online
  Tool | Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="JSON Formatter & Validator"
    description="Format, validate, and minify JSON instantly — right in your browser."
    category="developer"
    tier="free"
    relatedTools={['base64-tool', 'csv-json-converter', 'regex-tester']}
    faq={[...]}
  >
    <JsonFormatter />
  </ToolShell>
- Write the faq array yourself: 3-4 Q&A pairs, ~150-200 words total, plain
  factual tone for a developer audience, no marketing fluff. Cover: what JSON
  formatting is, why validation matters, whether the tool stores any data
  (answer: no, everything runs client-side), and one practical use case.

STEP 3 — JsonFormatter.tsx (client component, "use client"):
This renders INSIDE ToolShell's card — no need to build a wrapper, border, or
privacy note; ToolShell already provides those. Build only the functional UI:
- Two-pane layout: raw input textarea (left/top) and formatted output
  (right/bottom), single column on mobile. Both panes use font-mono.
- Real-time validation as the user types (debounced ~300ms) — inline error
  with line/column number on invalid JSON, never a raw stack trace.
- Format button + auto-format toggle.
- Minify button (collapse to single line).
- Indent size selector (2 / 4 / tab).
- Use packages/ui's <CopyButton> on the output pane. If it doesn't exist yet,
  build it there (accepts a string, shows a brief "Copied" state, no toast
  library needed) so future tools reuse it.
- Download-as-.json button.
- Clear/reset button.
- Tree view toggle: render formatted JSON as a collapsible tree (expandable
  objects/arrays) as an alternative to the raw text view.
- Sample data button (loads a placeholder JSON example).
- Character/byte size counter for input and output.
- Fully keyboard accessible; Tab key in the textarea inserts spaces rather
  than moving focus.

STEP 4 — Logic separation:
Extract parsing/formatting into apps/web/app/tools/json-formatter/utils/
jsonFormat.ts as pure, typed functions (no `any`) so it's unit-testable and
reusable later (e.g. a JSON-to-TypeScript tool can import the same parser).

STEP 5 — Performance:
If input exceeds ~500KB, move parsing/formatting into a Web Worker so the UI
thread doesn't freeze on large paste operations. Put the worker at
apps/web/app/tools/json-formatter/workers/format.worker.ts.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index page (apps/web/app/page.tsx or
/tools listing) via the registry entry — don't hardcode it there separately.

After building, tell me:
1. What you added to packages/ui or packages/tool-shell that future tools
   (password generator, base64 tool, etc.) can now reuse.
2. Whether jsonFormat.ts's tree-parsing logic is generic enough to reuse for
   a future JSON tree viewer / JSON-to-TS tool, or if it's too coupled to
   this UI.
```

---

## After this run

Once this lands, tool #2 (Password Generator) reuses `ToolShell`, `CopyButton`,
and the registry pattern with almost no new scaffolding — that's the payoff of
front-loading `tool-shell` and `ui` now. The equivalent prompt for #2 only
needs to change Steps 1–3's content; Steps 2 and 4-6's structure stay the same
shape each time.
