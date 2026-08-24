# Claude Code Prompt — Build Tool #18: Cron Expression Builder

Run this after tool-shell and tools #1-17 all exist and work. Straightforward
build — mostly UI/UX around a well-defined spec, with one genuine correctness
trap around timezone/DST that's easy to get subtly wrong.

---

```
Build the Cron Expression Builder tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/cron-builder/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-17
  — check what exists before writing anything new.
- 100% client-side. Use the `cron-parser` npm package (well-established,
  handles both parsing a cron expression into human-readable form AND
  computing next-run times correctly, including standard cron's various
  field syntaxes like ranges, steps, and lists) rather than hand-rolling
  cron parsing/scheduling logic, which has more edge cases than it initially
  appears (day-of-week vs. day-of-month interaction, step values, etc.).
  Install with `npm install cron-parser`.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. The cron expression itself and the
  computed next-run timestamps render in font-mono.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'cron-builder', title: 'Cron Expression Builder',
    shortDescription: 'Build and understand cron expressions with a visual editor.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Cron Expression Builder & Parser - Free Online Tool |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Cron Expression Builder"
    description="Build, parse, and understand cron expressions with a visual editor — entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['timestamp-converter', 'json-formatter', 'regex-tester']}
    faq={[...]}
  >
    <CronBuilder />
  </ToolShell>
  Note: check TOOL_REGISTRY first — 'timestamp-converter' likely doesn't
  exist yet; drop it if not registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: the five (or six, if seconds are included) standard cron fields and
  what each represents, the specific and commonly-confusing interaction
  between day-of-month and day-of-week fields (in standard cron, if BOTH are
  restricted to something other than "*", most implementations treat it as
  OR, not AND — e.g. "run on the 1st of the month OR every Monday," not
  "only Mondays that happen to be the 1st" — this genuinely trips people up
  and is worth a clear explanation with an example), a note that cron
  expression syntax has minor variations between systems (standard
  Unix/Linux cron vs. Quartz vs. AWS EventBridge/CloudWatch have small
  differences, e.g. some support seconds or day-of-week starting at 1 vs.
  0 — state clearly which flavor this tool targets, standard 5-field Unix
  cron, and that other systems may need adjustment), and confirmation
  nothing entered here is stored or transmitted.

STEP 3 — CronBuilder.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI. Two
synchronized input modes (editing either one updates the other):

  MODE A — Visual builder:
  - Five field groups: Minute, Hour, Day of Month, Month, Day of Week, each
    with a simple mode selector per field: "Every" (*), "Specific value(s)"
    (multi-select from valid range for that field), "Range" (from-to), "Step"
    (every N units, e.g. every 15 minutes) — this covers the vast majority
    of real-world cron use cases without needing to expose every possible
    raw syntax combination.
  - Day of Week and Month fields should show actual names (Mon-Sun, Jan-Dec)
    as selectable options, not just raw numbers, translating to/from the
    numeric cron values under the hood.
  - Live-generated cron expression string output as the visual builder is
    used.

  MODE B — Raw expression input:
  - Direct text input for a cron expression (font-mono), for users who
    already know the syntax and just want to paste/verify one.
  - Parses the raw expression and reflects it back into the visual builder's
    field selections where possible (best-effort — if the raw expression
    uses a syntax combination too complex to cleanly map back to the simple
    visual builder controls, e.g. a complex step-within-range like "5-30/5",
    that's fine, just show the raw expression is valid and skip trying to
    force it into the simplified visual controls; don't break or show an
    error for valid-but-complex expressions the visual builder itself
    couldn't have produced).

  SHARED (regardless of which mode was used to build the expression):
  - Human-readable description of the expression (e.g. "At minute 0 past
    every hour" or "At 09:00 on Monday" — cron-parser or a small
    description-generation helper should produce this; if the library
    doesn't include a description generator, this is worth a lightweight
    custom implementation covering common patterns, falling back to a more
    literal field-by-field description for complex expressions rather than
    guessing at something potentially wrong)
  - Next N run times (show the next 5-10 scheduled run times) computed via
    cron-parser, displayed as actual dates/times — this is the single most
    useful validation a user can get ("does this expression actually do
    what I think it does") and should be prominent, not an afterthought.
  - TIMEZONE HANDLING — read carefully: cron expressions themselves don't
    encode a timezone; the actual run times depend entirely on what
    timezone the system running the cron job is in. Add an explicit
    timezone selector (defaulting to the user's browser-detected local
    timezone, but clearly changeable) that the "next run times" preview
    uses for its calculations, WITH a visible note that the cron expression
    string itself is timezone-agnostic — the selector only affects this
    tool's preview calculation, not the expression output. This distinction
    matters and needs to be stated plainly in the UI, not just understood
    implicitly, since a user might otherwise assume the tool is "baking in"
    a timezone to the expression itself, which cron doesn't support.
  - Common preset buttons: "Every minute", "Every hour", "Every day at
    midnight", "Every Monday at 9am", "Every 15 minutes", "First of every
    month" — clicking one fills both modes with that expression.
  - CopyButton on the raw expression.
  - Clear error handling for invalid raw expressions (out-of-range values,
    malformed syntax) with a specific message about which field/part is
    invalid, not a generic parse failure.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/cron-builder/utils/:
  - cronPresets.ts — typed array of { name: string; expression: string }
    for the preset buttons.
  - cronFieldHelpers.ts — pure functions converting between the visual
    builder's field-mode selections and raw cron field syntax strings (e.g.
    buildFieldExpression(mode, values): string and the reverse best-effort
    parseFieldExpression(fieldStr): FieldSelection | null for Mode B's
    reflect-back behavior).
  - describeCron.ts — describeCronExpression(expression: string): string,
    generating the human-readable description, with reasonable fallback
    behavior for expressions it can't confidently describe in plain English.

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Confirm the day-of-month/day-of-week OR-not-AND behavior is correctly
   reflected in both the "next run times" calculation (via cron-parser,
   which should handle this correctly natively) AND the human-readable
   description text — test with an expression that restricts both fields
   (e.g. "0 9 1 * MON" — 9am on the 1st of the month OR every Monday) and
   confirm the next-run-times list actually shows both kinds of matching
   dates, not just one.
2. Confirm the timezone selector's scope is clearly communicated in the
   UI — restate exactly what text/label makes clear it affects only the
   preview, not the expression itself, since this is the one place this
   tool could otherwise mislead a user about what a cron expression can and
   can't encode.
3. Confirm Mode B's reflect-back behavior degrades gracefully (shows the
   valid raw expression without breaking) rather than erroring out when
   given a raw expression too complex for the simplified visual builder to
   represent — test with a complex step-within-range expression like
   "5-30/5 * * * *".
```

---

## Notes

- **The day-of-month/day-of-week OR behavior is the single most common cron
  misunderstanding**, and this tool is well-positioned to actually clear it
  up rather than just silently computing the (surprising to many) correct
  behavior without explanation. Worth verifying the explanation and the
  actual computed next-run-times agree with each other, since a mismatch
  between what the description says and what the tool's own next-run
  preview shows would be worse than not explaining it at all.
- **Timezone framing is the other real trap** — cron itself has no concept
  of timezone; that's entirely a property of the system executing it. A
  tool that lets you "pick a timezone" without being crystal clear that
  choice only affects the preview (not the expression) risks teaching users
  something factually wrong about how cron works, which could cause a real
  scheduling bug when they deploy that expression to a system in a
  different timezone than they assumed.
- This tool pairs naturally with backend/infra work — worth keeping in mind
  given your own AWS/EKS-heavy stack, this is a tool you're likely to
  actually use yourself for scheduling Kubernetes CronJobs or similar.
