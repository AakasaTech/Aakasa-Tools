# Claude Code Prompt — Build Tool #53: Compound Interest Calculator

Run after tool-shell and tools #1-52 exist. First tool touching financial
projections — needs careful, honest framing since it's easy for a
calculator like this to read as implied financial advice.

---

```
Build the Compound Interest Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/compound-interest-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure arithmetic (the standard compound interest
  formula, extended to support regular contributions) — no library needed.
- Design tokens as established.

FRAMING NOTE:
This tool projects hypothetical future values based on user-supplied
assumptions (principal, rate, time, contributions) — it does NOT predict
actual investment returns, and real returns vary and involve risk. Present
results as "projected based on your inputs," not as a promise or
expectation. Do not suggest specific interest rates as realistic/achievable
for any real investment vehicle, do not recommend any investment strategy
or product, and include a brief, honest note that this is a mathematical
projection tool, not financial advice — genuinely stated, not a buried
disclaimer, since a compound interest calculator can otherwise read as
tacitly endorsing a rate of return as achievable.

STEP 1 — Register:
  { slug: 'compound-interest-calculator', title: 'Compound Interest Calculator',
    shortDescription: 'Calculate how your savings or investments could grow over time.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['percentage-calculator', 'unit-converter', 'invoice-generator']. FAQ
(3-4 Q&A): what compound interest means and how it differs from simple
interest (interest earning interest, briefly and clearly explained with a
small example), what compounding frequency means (annually, monthly,
daily — and that more frequent compounding produces (slightly) higher
returns at the same nominal rate), the explicit framing note above stated
plainly (projection tool, not advice, actual returns vary and involve
risk), and the privacy note.

STEP 3 — CompoundInterestCalculator.tsx:
- Inputs: initial principal, annual interest rate (%), time period (years,
  with a sub-option for months if finer granularity matters), compounding
  frequency (annually / semi-annually / quarterly / monthly / daily —
  standard options).
- Optional regular contributions: an amount added periodically (monthly or
  annually, user's choice) throughout the time period — a genuinely
  realistic and commonly-wanted feature (most real savings scenarios
  involve ongoing contributions, not just a single lump sum) and worth
  building properly rather than only supporting a lump-sum principal.
- Live-computed results:
  - Final balance
  - Total contributions made (principal + all periodic additions, summed)
  - Total interest earned (final balance minus total contributions) —
    this breakdown (contributions vs. interest earned) is the single most
    illuminating figure for understanding compound growth, worth making
    prominent.
- Growth chart: a simple line or bar chart (use the chart_display_v0-style
  approach if this project has a charting convention established
  elsewhere, otherwise a basic Canvas or SVG line chart) showing balance
  growth year-by-year (or at reasonable intervals for longer periods) —
  visualizing the compounding curve is genuinely more illuminating than
  a single final number alone, and this is a case where a chart earns its
  place rather than being decorative.
- Year-by-year breakdown table (collapsible): showing balance, contributions
  made, and interest earned for each year — useful for anyone who wants to
  see the detail behind the final number and chart.
- CopyButton on the summary results.

STEP 4 — Logic separation: apps/web/app/tools/compound-interest-calculator/
utils/compoundInterest.ts — calculateCompoundGrowth(principal, annualRate,
years, compoundingFrequency, contributionAmount?, contributionFrequency?):
{ finalBalance: number; totalContributions: number; totalInterest: number;
yearlyBreakdown: YearData[] }, implementing the compound interest formula
correctly extended for periodic contributions (this is more involved than
the basic A = P(1 + r/n)^(nt) formula alone — periodic contributions
require either an iterative period-by-period calculation or the correct
closed-form annuity-with-compound-interest formula; an iterative
month-by-month or period-by-period calculation is simpler to get right and
verify than trying to derive the closed-form formula from scratch, and
performance is a non-issue at this scale — prefer the iterative approach
for correctness confidence over a compact but error-prone closed-form
formula). Pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the calculation is correct for a simple no-contribution case
   against the standard formula (e.g. $1,000 principal, 5% annual rate,
   compounded annually, 10 years, should equal exactly $1,000 × 1.05^10 =
   $1,628.89) — state the actual computed value.
2. Confirm the with-contributions case was implemented iteratively (per
   CONTEXT) rather than via a closed-form formula, or if a closed-form
   formula was used, confirm it was verified against an iterative
   calculation for at least one test case to catch any formula error.
3. Confirm the framing language (projection, not advice; returns vary) is
   genuinely present and visible in the tool's UI, not only in the FAQ.
```

## Note
**Periodic contributions are the one place a compact formula can go subtly
wrong** — the basic compound interest formula alone doesn't handle regular
additions correctly without careful extension (timing of contributions
relative to compounding periods matters, e.g. whether a monthly
contribution earns interest starting that same month or the next). An
iterative, period-by-period simulation is more verifiable and less
error-prone than attempting to derive and trust a closed-form annuity
formula from memory, and is worth preferring for that reason even though
it's less mathematically elegant.
