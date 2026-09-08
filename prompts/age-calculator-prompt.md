# Claude Code Prompt — Build Tool #51: Age / Date Difference Calculator

Run after tool-shell and tools #1-50 exist. Closes the dangling
'age-calculator' reference already sitting in BMI Calculator's relatedTools.
Simple date math with one genuine correctness trap around calendar
irregularities (leap years, varying month lengths).

---

```
Build the Age / Date Difference Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/age-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Native JavaScript Date handles the core math, but
  calculating a precise "X years, Y months, Z days" breakdown between two
  arbitrary dates is NOT simply a matter of dividing total days by 365 —
  it requires calendar-aware month/day arithmetic (accounting for varying
  month lengths and leap years) to be accurate. Do not compute age via
  `totalDays / 365.25` and call it done — implement proper calendar-based
  differencing (walk year/month/day components directly, borrowing from
  the next unit when a component goes negative, the same logic a
  well-built date library would use) or use a lightweight, well-tested
  date library if one is already a dependency elsewhere in the project;
  otherwise implement this directly since it's a bounded, well-defined
  algorithm, not a case needing a heavy new dependency.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'age-calculator', title: 'Age & Date Difference Calculator',
    shortDescription: 'Calculate age or the exact time between two dates, instantly.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['timestamp-converter', 'unit-converter', 'percentage-calculator']. FAQ
(3-4 Q&A): how the age/date-difference calculation handles leap years and
varying month lengths (explain briefly that it's calendar-aware, not a
simple day-count division, since that's this tool's actual value over a
naive approach), a note on time zones (clarify the calculation uses
calendar dates as entered, not accounting for time-of-day/timezone
specifics, unless the tool explicitly supports that — keep this simple
and state the assumption plainly), and the privacy note.

STEP 3 — AgeCalculator.tsx:
Two modes, tabbed:

  MODE A — Age Calculator:
  - Date of birth input (date picker).
  - "As of" date (defaults to today, but editable — lets users calculate
    age as of a past or future date, e.g. "how old will I be on X date").
  - Result: exact age as "X years, Y months, Z days," plus supplementary
    figures: total days lived, total weeks, total months, and — as a fun/
    engaging bonus — next birthday countdown (days until the next
    anniversary of the birth date from the "as of" date).

  MODE B — Date Difference:
  - Two date inputs: Start date, End date (either order — if end is before
    start, either swap automatically with a note, or show a negative/
    "reversed" indicator rather than erroring).
  - Result: difference as "X years, Y months, Z days" (calendar-aware, per
    CONTEXT), plus total days, total weeks, and total business days
    (weekdays only, excluding Saturdays/Sundays — a genuinely useful
    derived figure for project timelines/deadlines; note in the UI this
    counts weekends only, not public holidays, since holiday calendars
    vary by country/region and are out of scope).

- Both modes: CopyButton on the result summary.
- Both modes: live calculation as dates are picked (no submit button
  needed).

STEP 4 — Logic separation: apps/web/app/tools/age-calculator/utils/
dateDiff.ts — calculateCalendarDifference(startDate: Date, endDate: Date):
{ years: number; months: number; days: number; totalDays: number;
totalWeeks: number; totalMonths: number }, implementing proper calendar-
aware differencing (per CONTEXT). Also countBusinessDays(startDate,
endDate): number and daysUntilNextAnniversary(birthDate, asOfDate): number.
All pure, typed, no `any`, and each independently testable — this is
exactly the kind of function where a few explicit unit-test-style examples
in your own verification (Step 5) matter more than usual given the
edge-case density.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the calendar-aware age calculation is correct for at least these
   specific test cases, stating the actual computed output for each:
   - Birth date Feb 29, 2000 (a leap day) calculated as of Feb 28, 2023
     (a non-leap year) — this is the single trickiest edge case for any
     age calculator, confirm it doesn't crash or produce a nonsensical
     result.
   - A date difference spanning a leap year (e.g. Jan 1, 2023 to Jan 1,
     2025, which includes leap day Feb 29, 2024) — confirm total days
     correctly accounts for the extra day.
   - A date difference where the day-of-month "borrowing" logic is
     exercised (e.g. from Jan 31 to Mar 1 — confirm the months/days
     breakdown is sensible, not just correct in total day count).
2. Confirm business-day counting correctly excludes only Saturdays/Sundays
   and doesn't attempt to account for any specific country's holidays
   (confirming the stated scope limitation is actually respected in the
   implementation).
```

## Note
**The Feb 29 birthday case is the classic edge case for any age calculator**
— someone born on a leap day technically has a birthday that doesn't exist
in three out of every four years, and how a calculator handles "how old are
they on Feb 28 of a non-leap year" is a genuine, non-obvious design/
implementation decision (most reasonable implementations treat Feb 28 or
Mar 1 as the effective anniversary in non-leap years) that's worth
confirming doesn't crash or silently produce an off-by-one-day result.
