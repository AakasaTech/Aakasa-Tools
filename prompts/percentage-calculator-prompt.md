# Claude Code Prompt — Build Tool #49: Percentage Calculator

Run after tool-shell and tools #1-48 exist. First tool in the Calculators &
Finance category — simple, high-search-volume, multi-mode arithmetic tool.

---

```
Build the Percentage Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/percentage-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure arithmetic — no library needed.
- Design tokens as established. Numeric values in font-mono.

STEP 1 — Register:
  { slug: 'percentage-calculator', title: 'Percentage Calculator',
    shortDescription: 'Calculate percentages, percentage change, and more, instantly.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['unit-converter', 'dpi-calculator', 'invoice-generator']. FAQ (3-4 Q&A):
briefly explain each of the calculator modes offered (per Step 3), a note
on the specific and commonly-confused difference between "percentage
increase/decrease" and "percentage POINTS" (e.g. going from 20% to 25% is
a 5-percentage-point increase, but a 25% relative increase — this is a
genuinely common source of confusion/misstatement, worth a clear worked
example), and the privacy note.

STEP 3 — PercentageCalculator.tsx:
Multiple calculator modes, presented as clearly labeled, separate
mini-calculators (tabs or a stacked list — tabs are likely cleaner given
there are several distinct modes):

- "X% of Y" — e.g. "What is 15% of 200?" → two inputs (percentage, base
  number), live-computed result.
- "X is what % of Y" — e.g. "50 is what percent of 200?" → two inputs
  (part, whole), live-computed percentage result.
- "Percentage change" — e.g. "from 80 to 100, what's the % change?" → two
  inputs (original value, new value), live-computed result CLEARLY labeled
  as increase or decrease (with a +/- sign and color, success-tinted for
  increase, a neutral/informational tint for decrease — avoid using the
  danger/red color for a decrease by default, since a decrease isn't
  inherently "bad" out of context, e.g. a decrease in expenses is good —
  keep the color neutral rather than presuming a value judgment).
- "Percentage difference" (distinct from percentage change — this compares
  two values symmetrically without treating one as the "original," useful
  when comparing two measurements rather than tracking a before/after
  change) — briefly distinguish this from "percentage change" in the UI
  label/tooltip since the two are easily confused.
- "Add/subtract a percentage" — e.g. "increase 150 by 20%" or "decrease
  150 by 20%" → inputs (base value, percentage, add/subtract toggle),
  live-computed result — this is a genuinely common real-world calculation
  (tips, discounts, markups) worth its own explicit mode rather than
  requiring the user to reframe it as one of the other modes.
- Reverse percentage — "a price after a 20% discount is $80, what was the
  original price?" → inputs (final value, percentage applied, whether it
  was an increase or decrease that led to this final value), solving
  backward for the original — genuinely useful and a common real request
  (working backward from a discounted/marked-up price) that a simple
  forward-only calculator can't handle.

Each mode:
- Live calculation as either input changes (no submit button needed, this
  is cheap arithmetic).
- Clear, plain-language result sentence alongside the raw number (e.g. "15%
  of 200 is 30" not just a bare "30" in an output field) — this is a
  quick-reference tool, the sentence context matters more here than in a
  more technical calculator.
- CopyButton on the result.
- Reasonable input validation (handle empty/non-numeric input gracefully,
  don't show NaN or a broken calculation — show a neutral placeholder/empty
  state until valid numbers are entered in both fields).

STEP 4 — Logic separation: apps/web/app/tools/percentage-calculator/utils/
percentageMath.ts — pure, typed functions per mode: percentOf(percent,
base), whatPercent(part, whole), percentageChange(original, newValue),
percentageDifference(valueA, valueB), addPercentage(base, percent),
subtractPercentage(base, percent), reversePercentage(finalValue, percent,
wasIncrease: boolean). Each independently testable, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the "reverse percentage" mode is mathematically correct — state
   a worked test case (e.g. "final value $80 after a 20% decrease" should
   solve back to an original value of $100, not $96 or another plausible-
   looking-but-wrong result from a naive calculation) and confirm the tool
   produces the correct answer.
2. Confirm "percentage change" and "percentage difference" modes produce
   genuinely different results for the same pair of input numbers where
   appropriate, and that the UI clearly distinguishes what each computes
   (not just two similarly-labeled boxes a user can't tell apart).
```

## Note
**Reverse percentage is the one mode with real potential for a subtly wrong
implementation** — solving "what was the original value before a 20%
decrease produced $80" requires dividing by (1 - 0.20), not simply adding
20% back to $80 (which would incorrectly give $96 instead of the correct
$100). This is a classic percentage-math error worth specifically verifying
with a clean worked example rather than assuming the algebra was done
correctly.
