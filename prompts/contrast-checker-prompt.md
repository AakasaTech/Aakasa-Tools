# Claude Code Prompt — Build Tool #30: Contrast Checker

Run after tool-shell and tools #1-29 exist (specifically after CSS Gradient
Generator, since packages/color-utils should already exist by this point —
this tool is the primary consumer of the getContrastRatio function that
utility package was built around).

---

```
Build the Contrast Checker for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/contrast-checker/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- IMPORTANT: check for packages/color-utils first (should exist after CSS
  Gradient Generator's build, per that tool's Step 1). Import
  getContrastRatio and hex/RGB conversion functions from there — this tool
  should need ZERO new color-math implementation, it's the primary reason
  that shared package was extracted in the first place. If packages/
  color-utils does not exist yet for any reason, stop and extract it now
  (per the same instructions given in CSS Gradient Generator's Step 1)
  rather than implementing contrast math a third/fourth time in this tool's
  own utils folder.
- 100% client-side.
- Design tokens as established. This tool is inherently about text-on-
  background legibility, so the live preview area needs to actually render
  real text at the chosen colors — this IS the core interaction, not a
  supplementary preview.

STEP 1 — Register:
  { slug: 'contrast-checker', title: 'Contrast Checker',
    shortDescription: 'Check color contrast against WCAG accessibility standards, instantly.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['color-palette', 'css-gradient-generator', 'favicon-generator'] (check
TOOL_REGISTRY, drop unregistered slugs). FAQ (3-4 Q&A): what WCAG contrast
ratio means and why it matters (accessibility for users with low vision or
color blindness — text needs sufficient contrast against its background to
be legible), the specific WCAG thresholds (AA requires 4.5:1 for normal
text and 3:1 for large text; AAA requires 7:1 and 4.5:1 respectively —
state these precisely since they're the actual actionable numbers this
tool checks against), what counts as "large text" for the relaxed threshold
(WCAG defines this specifically — 18pt/24px regular weight or 14pt/18.66px
bold — state the actual definition rather than a vague approximation), and
the privacy note.

STEP 3 — ContrastChecker.tsx:
- Foreground (text) color picker and background color picker, both with hex
  input synced to a native color picker, consistent with the pattern
  established in Color Palette Generator.
- Live preview: actual rendered sample text at the chosen colors, shown at
  multiple sizes — a normal-text-size sample and a large-text-size sample
  (both using WCAG's actual size thresholds, not arbitrary "small"/"big"
  labels), so the user sees real legibility, not just a computed number.
  Include both regular and bold weight samples for the large-text case
  specifically, since bold has a different threshold per WCAG's definition.
- Computed contrast ratio, displayed prominently (e.g. "4.82:1") using
  packages/color-utils' getContrastRatio.
- Pass/fail badges for all four relevant checks, each clearly labeled:
  - AA Normal Text (4.5:1)
  - AA Large Text (3:1)
  - AAA Normal Text (7:1)
  - AAA Large Text (4.5:1)
  Each badge visually distinct pass (success-tinted) vs. fail
  (danger-tinted) — this is a case where that color-coding is functionally
  meaningful, not decorative.
- Swap button (swaps foreground/background).
- "Suggest a passing color" feature: if the current combination fails one
  or more checks, offer a button that adjusts the foreground OR background
  color (user's choice which one to adjust) by shifting its lightness
  (via HSL) until it just passes AA normal text contrast — show the
  suggested color as a one-click-to-apply option rather than auto-applying
  it, so the user stays in control of the final choice. This is a genuinely
  differentiating feature versus a bare contrast-ratio calculator.
- Color blindness simulation (nice-to-have, meaningfully adds value for an
  accessibility-focused tool): a toggle showing the foreground/background
  pair as they'd approximately appear under common color vision
  deficiencies (protanopia, deuteranopia, tritanopia) using standard
  simulation transformation matrices applied to the RGB values — if
  implementing this, keep the disclaimer honest that it's an approximation
  for awareness purposes, not a clinically precise simulation.
- CopyButton for both hex values and the computed ratio.

STEP 4 — Logic separation: apps/web/app/tools/contrast-checker/utils/
suggestPassingColor.ts — suggestAccessibleColor(fixedColor: string,
colorToAdjust: string, targetRatio: number): string, implementing the
lightness-shift search described above (a simple iterative/binary search
over HSL lightness is sufficient, no need for anything more sophisticated).
If color blindness simulation is implemented:
colorBlindnessSimulation.ts — pure functions applying the standard
simulation matrices per deficiency type. Both pure, typed, no `any`. Import
all core color conversion/contrast math from packages/color-utils — do not
reimplement getContrastRatio, hexToRgb, etc. here.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm this tool imports getContrastRatio and color conversion
   functions from packages/color-utils rather than reimplementing any of
   them — state explicitly that no duplicate color-math exists in this
   tool's own utils folder.
2. Confirm the computed contrast ratio is correct for a known reference
   pair (e.g. pure black #000000 on pure white #FFFFFF should compute to
   exactly 21:1, the maximum possible ratio, per the WCAG formula) — state
   the actual computed value.
3. Confirm the "suggest a passing color" feature actually produces a color
   that, when re-checked through the same getContrastRatio function, passes
   the AA normal text threshold — i.e. verify the suggestion algorithm's
   output against the tool's own pass/fail logic, not just visually.
```

## Note
**This tool is the payoff for the color-utils extraction** raised after
tool #7 and acted on in tool #29 — it should be built almost entirely by
composing that shared package with UI, with genuinely minimal new
color-math of its own (only the lightness-search "suggest a color" logic is
new here). If this tool ends up reimplementing contrast calculation instead
of importing it, that's a sign the extraction didn't actually happen
correctly in tool #29 and is worth going back to fix. The black-on-white =
21:1 reference check in the closing questions is a simple, unambiguous way
to confirm the underlying math is correct, since it's the one contrast
value with a single indisputable correct answer.
