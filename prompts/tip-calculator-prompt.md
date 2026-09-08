# Claude Code Prompt — Build Tool #52: Tip Calculator

Run after tool-shell and tools #1-51 exist. Simple, fast, high-search-volume
tool — good pace recovery after Age Calculator's edge-case density.

---

```
Build the Tip Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/tip-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure arithmetic — no library needed.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'tip-calculator', title: 'Tip Calculator',
    shortDescription: 'Calculate tips and split the bill instantly.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['percentage-calculator', 'invoice-generator', 'unit-converter']. FAQ
(3-4 Q&A): brief note on typical tipping norms varying significantly by
country/region and type of service (state this factually and briefly —
don't attempt to be a comprehensive tipping-etiquette guide, just note the
variation exists so the tool's presets aren't mistaken for a universal
standard), how bill-splitting works when combined with a tip, and the
privacy note.

STEP 3 — TipCalculator.tsx:
- Bill amount input (numeric, currency-agnostic — no currency symbol
  hardcoded, or a simple currency symbol selector matching the pattern
  from Invoice Generator if easy to reuse, otherwise a generic $ default
  with a note it's just a symbol, not a conversion).
- Tip percentage: slider + numeric input + quick-preset buttons (e.g. 10%,
  15%, 18%, 20%, 25% — common Western/US-context defaults, but don't
  imply these are universally "correct," per the FAQ note on regional
  variation).
- Custom tip amount option: as an alternative to percentage-based tipping,
  let the user enter a flat tip amount directly instead (some contexts tip
  a fixed amount rather than a percentage).
- Number of people to split between (numeric input, default 1) — when
  greater than 1, show the total (bill + tip) split evenly, AND the
  per-person tip amount and per-person total separately.
- Live-computed results, prominently displayed: tip amount, total bill
  (bill + tip), and if splitting, per-person amounts.
- "Round up per-person total" toggle — a genuinely practical real-world
  feature (splitting a bill often produces awkward cents; rounding each
  person's share up to the nearest whole currency unit is a common real
  practice) — when enabled, show both the exact per-person amount and the
  rounded-up amount, with the small rounding surplus noted (e.g. "rounding
  up adds $0.60 total, covers the tip generously").
- CopyButton on the results summary.

STEP 4 — Logic separation: apps/web/app/tools/tip-calculator/utils/
tipCalculation.ts — pure, typed functions: calculateTip(billAmount,
tipPercent), calculateSplit(totalAmount, numberOfPeople), roundUpPerPerson
(perPersonAmount): { rounded: number; surplus: number }. No `any`. Careful,
consistent rounding to currency-appropriate 2 decimal places throughout
(same floating-point-currency-math care as flagged in Invoice Generator's
build) — avoid a per-person split that doesn't sum back exactly to the
total due to rounding (e.g. splitting $10 three ways as $3.33 × 3 = $9.99,
one cent short of the actual total) — handle the remainder cent(s)
explicitly (e.g. by adding the leftover cent(s) to one or more people's
shares) rather than letting totals silently not reconcile.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm a 3-way split of a $10.00 total tip amount sums back exactly to
   $10.00 across the three people (not $9.99 due to rounding) — state how
   the leftover-cent reconciliation was handled.
2. Confirm the "round up per-person" feature correctly shows both the exact
   and rounded figures, and correctly computes the surplus amount.
```

## Note
**The bill-split rounding reconciliation is the one real trap** — dividing
a currency amount evenly by an odd number of people very commonly produces
a per-person figure that doesn't multiply back to the exact original total
due to standard 2-decimal-place currency rounding (the classic $10 ÷ 3 =
$3.33 × 3 = $9.99 problem). A quick, honest calculator should account for
this explicitly rather than silently presenting three "equal" shares that
don't actually sum correctly.
