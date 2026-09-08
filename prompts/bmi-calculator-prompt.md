# Claude Code Prompt — Build Tool #50: BMI Calculator

Run after tool-shell and tools #1-49 exist. Closes out this batch. This is
the first health-adjacent tool in the catalog — the framing needs care:
BMI is a widely-requested, simple screening metric, but it's genuinely
limited and this tool should present it that way rather than as a
definitive health judgment.

---

```
Build the BMI Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/bmi-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure arithmetic (the standard BMI formula) — no library
  needed.
- Design tokens as established.

FRAMING NOTE — READ BEFORE BUILDING:
BMI (Body Mass Index) is a simple screening calculation, not a diagnostic
health assessment — it doesn't account for muscle mass, bone density, body
composition, age, sex, or distribution of body fat, and is known to be a
poor indicator for athletes, older adults, and several other groups. This
tool should present the calculated number factually, alongside the standard
WHO BMI category ranges, WITHOUT editorializing, without diet/exercise
advice, without a numeric weight-loss/gain target or timeline, and without
any tone suggesting a given category is a personal failing or achievement.
Present it as one data point among many a person might discuss with a
healthcare provider — that framing goes in the UI itself, not only the FAQ.
Do not add a BMI trend tracker, weight-loss goal-setting feature, or any
functionality beyond a single point-in-time calculation — this tool's scope
is deliberately narrow: enter height/weight, see the BMI number and its
standard category, done.

STEP 1 — Register:
  { slug: 'bmi-calculator', title: 'BMI Calculator',
    shortDescription: 'Calculate Body Mass Index (BMI) instantly.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['unit-converter', 'percentage-calculator', 'age-calculator'] (check
TOOL_REGISTRY, drop unregistered — age-calculator likely not built yet).
FAQ (3-4 Q&A): what BMI is and how it's calculated (weight divided by
height squared, in metric; explain the formula plainly), the standard WHO
category ranges (Underweight, Normal weight, Overweight, Obese, with the
actual numeric thresholds), an honest, clearly-stated limitation section —
BMI does not directly measure body fat, doesn't account for muscle mass
(e.g. can misclassify very muscular individuals), and isn't equally
accurate across all populations/ages — stated factually and not
minimized, and a note that this is a general screening tool, not a
substitute for professional medical assessment, with a suggestion to
discuss results with a healthcare provider for personalized guidance. This
last point should be genuine and clearly stated, not a buried disclaimer.

STEP 3 — BmiCalculator.tsx:
- Unit system toggle: Metric (kg, cm) / Imperial (lb, ft+in).
- Height input (cm, or feet+inches as two fields for imperial).
- Weight input (kg or lb).
- Live-computed BMI value (one decimal place), shown plainly as a number.
- Category label (Underweight / Normal weight / Overweight / Obese) shown
  neutrally — use the design system's neutral/informational styling for
  ALL categories, not danger-red for "Obese" and success-green for "Normal"
  — this is a factual classification, not a pass/fail grade, and the color
  treatment should reflect that (a single consistent neutral color/style
  across all four categories, differentiated by label text only, is the
  right choice here).
- A visual reference showing where the calculated value falls along the
  full BMI range (e.g. a simple horizontal scale with the four category
  bands and a marker showing the current result) — genuinely useful for
  context, again styled neutrally.
- The limitations note (per FRAMING NOTE above) displayed directly beneath
  the result, not just in the FAQ — a permanent, visible, non-dismissible
  short text block, similar treatment to how the privacy note is
  permanently shown on every tool in this catalog.
- CopyButton on the result.
- NO additional features beyond this — no goal-setting, no trend-tracking,
  no diet/exercise suggestions, no calorie calculators bundled in (a
  calorie/TDEE calculator, if wanted, should be its own separate,
  similarly-carefully-framed tool in a future build, not bundled here).

STEP 4 — Logic separation: apps/web/app/tools/bmi-calculator/utils/
bmiCalculation.ts — calculateBmi(weightKg: number, heightCm: number):
number, getBmiCategory(bmi: number): { label: string; range: string } using
the standard WHO threshold values, plus unit-conversion helpers
(lbToKg, ftInToCm) for the imperial input path. Pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the standard WHO BMI category thresholds used and state them
   explicitly (the exact numeric boundaries for each category) so they can
   be double-checked against the standard reference values.
2. Confirm no diet, exercise, calorie, or weight-goal content was added
   anywhere in the build beyond what this prompt specifies — state this
   plainly, since scope creep toward "helpful" health advice is the main
   risk in a build like this and worth an explicit negative confirmation.
3. Confirm the category color treatment is genuinely neutral across all
   four categories (describe the actual styling used) rather than using
   danger/success colors that would editorialize the result.
```

## Note
**This tool's scope discipline matters more than its code** — the
calculation itself is trivial arithmetic. The real risk is scope creep: an
eager implementation might reasonably think "a BMI calculator should
probably also suggest a healthy target range" or "add a quick tip for each
category," and that's exactly the kind of unsolicited health guidance this
build explicitly excludes. Keep this tool narrow, factual, and consistently
neutral in tone and color across all outcomes — it's a screening number
with stated limitations, not a verdict.
