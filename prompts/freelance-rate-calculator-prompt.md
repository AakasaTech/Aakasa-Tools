# Claude Code Prompt — Build Tool #54: Freelance Rate Calculator

Run after tool-shell and tools #1-53 exist. Directly relevant to your own
Aakasa Digital audience — freelancers/agencies figuring out billing rates —
and pairs naturally as a funnel toward BillCraft AI, similar in spirit to
Invoice Generator's soft mention.

---

```
Build the Freelance Rate Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/freelance-rate-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure arithmetic — no library needed.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'freelance-rate-calculator', title: 'Freelance Rate Calculator',
    shortDescription: 'Calculate your ideal hourly or project rate based on your goals and expenses.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['invoice-generator', 'percentage-calculator', 'unit-converter']. FAQ
(3-4 Q&A): the general approach this calculator uses (working backward
from a target income, accounting for time actually spent on billable work
versus total working time, plus business expenses and taxes, to arrive at
a required hourly/project rate), an honest note that this produces a
starting-point estimate based on the user's own inputs, not a market-rate
recommendation (this tool doesn't know what clients in any given
market/industry actually pay — it only does the arithmetic of "here's what
YOU need to charge to hit YOUR numbers," a genuinely different and more
honest framing than pretending to know competitive market rates), a note
on the non-billable-time concept (administrative work, marketing, unpaid
pitching time all reduce actual billable hours below total working hours
— explain why this matters for an accurate rate), and the privacy note.

STEP 3 — FreelanceRateCalculator.tsx:
- Target annual income input (the number the user wants to actually take
  home/earn).
- Annual business expenses input (software subscriptions, equipment,
  insurance, etc. — costs that need to be covered by revenue before it
  becomes personal income).
- Tax rate estimate (%) — a simple flat percentage the user supplies
  themselves for their own estimated tax obligation (do NOT attempt to
  calculate actual tax brackets/liability, this varies enormously by
  jurisdiction and this tool isn't a tax calculator — just let the user
  supply their own estimated rate as an input, state this limitation
  plainly).
- Working time inputs: weeks worked per year (accounting for vacation/time
  off — default something like 48-50, not a naive 52), hours worked per
  week (total time spent working, not just billable time).
- Billable percentage: what portion of total working hours is actually
  billable to clients (the rest being admin, marketing, unpaid work) — a
  slider/input, with a brief note that this is commonly overestimated and
  a realistic figure (e.g. 60-80% for many freelancers) is worth
  considering honestly, without being prescriptive about what the "right"
  number is for any individual.
- Live-computed results:
  - Required annual revenue (target income + expenses, grossed up for the
    estimated tax rate)
  - Required billable hours per year (working weeks × hours/week ×
    billable percentage)
  - Required hourly rate (required annual revenue ÷ required billable
    hours) — the headline result.
  - Derived project-rate helpers: what a rate would be for a 10-hour, 
    40-hour, and 100-hour project at the computed hourly rate, as
    practical reference points for quoting fixed-price work.
- A clear breakdown showing the calculation chain (target income →
  + expenses → grossed up for tax → ÷ billable hours → hourly rate) so the
  user understands WHY the number came out the way it did, not just the
  final figure in isolation — this is genuinely more useful and more
  trustworthy than a black-box result.
- CopyButton on the results summary.
- Soft funnel note (same spirit and restraint as Invoice Generator's
  BillCraft mention): a single quiet line near the bottom, e.g. "Once
  you've settled on a rate, BillCraft AI makes it easy to send professional
  invoices at that rate." — one line, text link, never a popup or banner,
  easily ignored, and the tool must work completely and honestly without
  it.

STEP 4 — Logic separation: apps/web/app/tools/freelance-rate-calculator/
utils/rateCalculation.ts — calculateRequiredRate(targetIncome, annualExpenses,
taxRatePercent, weeksPerYear, hoursPerWeek, billablePercent): {
requiredRevenue: number; billableHoursPerYear: number; hourlyRate: number
}, plus a small projectRateExamples(hourlyRate, hours: number[]): {hours:
number; rate: number}[] helper for the project-rate reference figures. Pure,
typed, no `any`. Careful with the "gross up for tax" math specifically —
confirm the calculation is required-revenue = (target-income + expenses) /
(1 - tax-rate), not target-income + expenses + (target-income × tax-rate),
which would under-cover the actual tax obligation on the marked-up amount —
this is a genuine, easy-to-get-backwards piece of math worth getting right.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the tax gross-up formula used and state which of the two
   approaches described in Step 4 was implemented, with a worked example
   (e.g. target income $60,000, expenses $5,000, tax rate 25% — state the
   computed required revenue and confirm it correctly leaves the target
   income after both expenses and the stated tax rate are accounted for).
2. Confirm the calculation breakdown is genuinely shown step-by-step in the
   UI (not just the final hourly rate number) so users can see and verify
   the logic themselves.
```

## Note
**The tax gross-up calculation is the one place simple-looking math can be
subtly backwards** — if $60,000 income plus $5,000 expenses needs to
survive a 25% tax hit, the required revenue isn't $65,000 × 1.25 =
$81,250 (which overshoots, since tax applies to revenue, and the target
figures already represent post-tax needs layered differently) nor is it
$65,000 + ($65,000 × 0.25) naively — the correct approach is dividing by
(1 - tax rate): $65,000 / 0.75 = $86,666.67, ensuring that after paying 25%
tax on that revenue, exactly $65,000 remains. Worth confirming this
specific division-based approach was used rather than a superficially
similar but incorrect addition-based one.
