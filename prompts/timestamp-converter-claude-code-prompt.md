# Claude Code Prompt — Build Tool #20: Timestamp / Epoch Converter

Run this after tool-shell and tools #1-19 all exist and work. Both JWT
Decoder and Cron Builder already reference this tool ('timestamp-converter')
in their relatedTools arrays — this build closes those links out.

---

```
Build the Timestamp / Epoch Converter tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/timestamp-converter/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-19
  — check what exists before writing anything new.
- 100% client-side. Native JavaScript Date object handles the core
  conversion math correctly; for robust timezone display beyond the
  browser's local zone, use Intl.DateTimeFormat with a timeZone option
  (natively supported, no library needed for standard IANA timezone names —
  do not add a timezone library like moment-timezone/date-fns-tz unless
  testing reveals a genuine gap in Intl.DateTimeFormat's coverage, which is
  unlikely for this use case).
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Timestamp values (both epoch
  numbers and formatted dates) render in font-mono.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'timestamp-converter', title: 'Timestamp Converter',
    shortDescription: 'Convert Unix timestamps to human-readable dates and back, instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Unix Timestamp Converter - Free Online Epoch Tool |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Timestamp Converter"
    description="Convert Unix timestamps to human-readable dates and back — entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['cron-builder', 'jwt-decoder', 'json-formatter']}
    faq={[...]}
  >
    <TimestampConverter />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered
  (cron-builder and jwt-decoder should exist by now if built in sequence).
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what a Unix timestamp actually is (seconds — sometimes
  milliseconds — since January 1, 1970 UTC, the "epoch"), the common
  seconds-vs-milliseconds confusion (JavaScript's Date.now() and most
  browser APIs use milliseconds, while many backend systems/Unix tools use
  seconds — explain this is the single most common source of "the date is
  showing as 1970" or "the date is showing as some far-future year" bugs,
  and that this tool auto-detects which one you likely have based on digit
  count), what "UTC" means versus a local timezone in this context, and
  confirmation nothing entered here is stored or transmitted.

STEP 3 — TimestampConverter.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- "Current timestamp" display at the top, live-updating (e.g. once per
  second), showing both the current Unix timestamp (seconds) and the
  current human-readable date/time — useful as an always-visible reference
  point and a way to confirm the tool is working correctly at a glance.
- Two-way converter, clearly split:
  - Timestamp → Date: numeric input for a Unix timestamp. AUTO-DETECT
    seconds vs. milliseconds based on digit count/magnitude (a timestamp in
    seconds for dates in the reasonably near past/future will be 10 digits;
    milliseconds will be 13) and show which interpretation is being used,
    with a manual override toggle in case auto-detection guesses wrong for
    an edge-case value (e.g. a very old date). Output the corresponding
    date/time in multiple formats simultaneously: ISO 8601, RFC 2822,
    a locale-formatted readable string, and both UTC and the browser's
    local timezone side by side.
  - Date → Timestamp: a date/time picker (native <input type="datetime-local">
    is acceptable and simple, styled to match the design system) plus a
    timezone context selector (interpret the entered date/time as UTC vs.
    as the browser's local timezone vs. a specific selected IANA timezone)
    — output both the seconds and milliseconds Unix timestamp for the
    entered date/time.
- Timezone selector: a searchable dropdown of IANA timezone names (reuse the
  searchable combobox component from Unit Converter if it was built and
  factored into packages/ui, per that tool's flagged reuse candidate — check
  packages/ui first before building a new one), allowing the "Timestamp →
  Date" output to additionally show the equivalent time in a specific
  chosen timezone beyond just UTC/local.
- Relative time display: alongside the converted date, show a relative
  description (e.g. "3 days ago" / "in 2 hours") computed from the
  difference between the entered/converted timestamp and the current time —
  genuinely useful at-a-glance context, especially when debugging things
  like token expiration or event logs.
- CopyButton on each output format individually (ISO string, epoch seconds,
  epoch milliseconds, etc. — users typically want to copy exactly one
  specific format, not the whole block).
- Common format reference (collapsible section): a short explanation/table
  of the date format standards shown (ISO 8601, RFC 2822/822, Unix epoch)
  for users unfamiliar with the terminology — quick-reference content, not
  padding.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/timestamp-converter/utils/timestampConvert.ts
as pure, typed functions (no `any`):
  - detectTimestampUnit(value: number): 'seconds' | 'milliseconds' — the
    auto-detection heuristic based on magnitude.
  - timestampToDate(value: number, unit: 'seconds' | 'milliseconds'): Date
  - dateToTimestamp(date: Date): { seconds: number; milliseconds: number }
  - formatInTimezone(date: Date, timezone: string, format: 'iso' | 'rfc2822'
    | 'locale'): string — wrapping Intl.DateTimeFormat appropriately per
    format.
  - getRelativeTimeDescription(date: Date, now: Date): string — using
    Intl.RelativeTimeFormat (natively supported, no library needed) rather
    than hand-rolling "X days ago" string logic.
  All pure, typed, and testable independent of the live "current time"
  ticking display.

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry, and confirm JWT Decoder and Cron Builder's existing
relatedTools references to 'timestamp-converter' now resolve.

After building, tell me:
1. Confirm the seconds-vs-milliseconds auto-detection heuristic and state
   the exact digit-count/magnitude threshold used — test it against both a
   realistic current-ish seconds timestamp (10 digits) and milliseconds
   timestamp (13 digits) and confirm both are correctly identified.
2. Confirm timezone conversion is actually correct for at least one
   non-UTC, non-browser-local timezone (e.g. explicitly test America/
   New_York or Asia/Colombo against a known UTC timestamp and state the
   computed local time) — Intl.DateTimeFormat is reliable for this but
   worth confirming the wiring is correct rather than assuming.
3. Confirm whether Unit Converter's searchable combobox (if it exists) was
   reused for the timezone selector, or whether IANA timezone names needed
   different handling (there are ~400 of them, meaningfully more than any
   unit category list) that warranted a different approach — flag this
   either way.
```

---

## Notes

- **Seconds vs. milliseconds is the single most common real-world bug this
  tool exists to solve** — pasting a millisecond timestamp into a
  seconds-expecting field (or vice versa) produces a wildly wrong date
  (either 1970 or some far-future year), and auto-detecting which one the
  user has, while still allowing manual override for genuine edge cases, is
  the tool's actual value proposition beyond "Date object exists." Worth
  confirming the detection threshold is sensible (roughly: values below
  ~10 billion are almost certainly seconds, above are almost certainly
  milliseconds, for any date within a normal human timeframe).
- **This tool closes two dangling relatedTools references** at once (JWT
  Decoder and Cron Builder both already point here) — worth clicking
  through both after this ships to confirm they resolve.
- **IANA timezone list size (~400 entries) is meaningfully larger than any
  previous searchable-list use case** (Unit Converter's categories were much
  shorter) — worth confirming the existing combobox component (if reused)
  actually performs fine at this scale, or whether it needs virtualization
  too, similar to the concern flagged for CSV Viewer's data grid.
