# Claude Code Prompt — Build Tool #33: CSS Border-Radius / Blob Generator

Run after tool-shell and tools #1-32 exist. Two related shape-generation
modes in one tool, similar pairing pattern to Color Palette Generator's
two-tab approach.

---

```
Build the CSS Border-Radius & Blob Generator for the Aakasa Toolbox
monorepo.

CONTEXT:
- Route: apps/web/app/tools/border-radius-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure CSS string generation.
- Design tokens as established. Live preview prominent; generated CSS in
  font-mono.

STEP 1 — Register:
  { slug: 'border-radius-generator', title: 'CSS Border-Radius & Blob Generator',
    shortDescription: 'Design rounded corners and organic blob shapes with a visual editor.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['box-shadow-generator', 'css-gradient-generator', 'color-palette']. FAQ
(3-4 Q&A): how the border-radius property's four-corner shorthand works
(and the less-commonly-known 8-value syntax for elliptical corners — worth
explaining since this tool's "blob" mode relies on it), what makes an
organic "blob" shape (randomized elliptical corner radii using that 8-value
syntax to avoid perfectly circular/uniform corners), browser support (near-
universal for basic border-radius, mention any caveat only if one genuinely
exists for the 8-value elliptical syntax, otherwise keep this brief), and
the privacy note.

STEP 3 — BorderRadiusGenerator.tsx:
Two tabs:

  TAB A — Border Radius (precise control):
  - Live preview: a sample box showing the actual rounded corners.
  - Per-corner controls (top-left, top-right, bottom-right, bottom-left),
    each with a slider + numeric input, unit toggle (px / %).
  - "Link all corners" toggle — when on, one slider controls all four
    corners uniformly (the common case); when off, each corner is
    independently adjustable (for asymmetric shapes).
  - Elliptical corners toggle: when enabled, exposes a second
    horizontal/vertical radius pair per corner (the full 8-value syntax)
    rather than just one value per corner — off by default since most use
    cases only need simple uniform corners, on for more advanced shapes.
  - Preset shapes: common useful presets (fully rounded/pill shape, subtle
    rounded, sharp/none, top-only rounded, circle if the box is square).
  - Generated CSS output (font-mono): the complete `border-radius: ...;`
    declaration, correctly formatted per the 4-value or 8-value syntax
    depending on whether elliptical mode is active.

  TAB B — Blob Generator (organic shapes):
  - Live preview: a sample shape rendered with randomized elliptical corner
    radii producing an organic, non-geometric blob silhouette.
  - "Randomize" button — generates a new random blob shape (bias the random
    generation toward values that produce visually pleasing, sufficiently
    varied-but-not-too-extreme shapes, similar spirit to the "randomize"
    behavior on the Color Palette Generator's harmony randomization —
    avoid values that would produce shapes that look broken or barely
    different from a plain rectangle).
  - "Complexity"/smoothness slider — controls how extreme the corner radius
    variation is (subtle organic vs. very wavy/extreme blob).
  - Lock/seed: showing the current blob's underlying values so a user who
    likes a particular result can note it, plus a way to nudge/regenerate
    while keeping the current one as a comparison (a simple "previous
    blob" history of the last few generated isn't required, but if easy to
    add, a small back/forward through recent randomizations is a nice
    touch — not required if it adds meaningful complexity).
  - Generated CSS output (font-mono) for the current blob's border-radius
    value.
  - Fill color / gradient preview toggle: since blobs are commonly used as
    decorative background shapes, let the user preview the blob filled with
    a solid color (color picker) to get a more realistic sense of how it'll
    look as an actual design element, rather than only an outline.

- CopyButton on the CSS output in both tabs.

STEP 4 — Logic separation: apps/web/app/tools/border-radius-generator/
utils/:
- borderRadiusCss.ts — buildBorderRadiusCss(corners: CornerValues,
  elliptical: boolean): string, correctly formatting 4-value vs. 8-value
  border-radius syntax.
- blobGenerator.ts — generateRandomBlob(complexity: number): CornerValues,
  producing randomized-but-bounded elliptical corner percentages (typically
  in a range like 30-70% per value works well to avoid degenerate shapes —
  tune bounds so results consistently look like reasonable organic blobs,
  not by picking fully random 0-100% independently per value which tends
  to produce oddly spiky or nearly-rectangular results).
Both pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the 8-value elliptical border-radius syntax is generated
   correctly (test the output CSS directly in a browser and confirm it
   renders elliptical, not just rounded-rectangle, corners).
2. Confirm the blob randomization consistently produces visually reasonable
   organic shapes across at least 5-10 consecutive randomize clicks — describe
   whether any bounds tuning was needed to avoid degenerate/broken-looking
   results, since fully unbounded random values commonly produce shapes
   that don't read as "organic blob" so much as "broken rectangle."
```

## Note
**The blob randomization bounds are the one thing worth tuning carefully**
— naively randomizing each of the 8 elliptical corner values independently
across the full 0-100% range tends to produce shapes that look glitchy or
barely blob-like rather than the smooth organic silhouettes users expect
from tools like this (a well-known category of tool, e.g. "blobmaker"-style
generators, that this is directly competing with). Worth actually eyeballing
several randomize results rather than trusting the math is automatically
correct just because it's technically valid CSS.
