# Claude Code Prompt — Build Tool #29: CSS Gradient Generator

Run after tool-shell and tools #1-28 exist. First Color & Design category
tool since Color Palette Generator (#7) — reuses that tool's color-picker
and hex/RGB/HSL conversion utilities directly.

---

```
Build the CSS Gradient Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/css-gradient-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- IMPORTANT: check apps/web/app/tools/color-palette/utils/colorConversion.ts
  first — this was flagged in Color Palette Generator's build as a strong
  candidate for extraction into a shared package given multiple future
  consumers. This tool is the second consumer. If colorConversion.ts is
  still living inside color-palette's own utils folder (not yet extracted),
  THIS BUILD is the point to actually extract it: create
  packages/color-utils with hexToRgb/rgbToHsl/hslToRgb/rgbToHex/
  getContrastRatio moved there, update color-palette's imports to point to
  the new shared package, and import from there in this tool too — don't
  let a third tool trigger this extraction when it's already overdue after
  two consumers.
- 100% client-side. Pure CSS string generation from color-stop data — no
  library needed beyond the shared color-conversion utilities.
- Design tokens as established. The gradient PREVIEW itself should be large
  and prominent (this is a highly visual tool), with generated CSS code in
  font-mono below/beside it.

STEP 1 — Extract shared color utils (if not already done):
Per CONTEXT above — create packages/color-utils if colorConversion.ts is
still tool-local, move the pure conversion/contrast functions there, update
color-palette's imports, confirm color-palette still builds/works correctly
after the move before proceeding to Step 2.

STEP 2 — Register:
  { slug: 'css-gradient-generator', title: 'CSS Gradient Generator',
    shortDescription: 'Design and export CSS gradients with a live visual editor.',
    category: 'color-design', tier: 'free' }

STEP 3 — page.tsx: standard metadata + ToolShell. relatedTools:
['color-palette', 'contrast-checker', 'favicon-generator'] (check
TOOL_REGISTRY, drop unregistered slugs). FAQ (3-4 Q&A): the difference
between linear, radial, and conic gradients (brief, plain description of
each), what color stops and stop positions control, browser support for
CSS gradients (essentially universal in modern browsers, brief reassurance
rather than a detailed compatibility table), and the privacy note.

STEP 4 — CssGradientGenerator.tsx:
- Gradient type tabs: Linear / Radial / Conic.
- Large live gradient preview (a prominent rectangle showing the actual
  rendered gradient, updating in real time as any control changes).
- Color stops editor:
  - Visual stop editor: a horizontal bar (representing the gradient's 0-100%
    range) with draggable stop markers — clicking adds a stop, dragging
    repositions it, each stop has a color swatch. This is the tool's core
    interaction and worth building properly rather than only exposing a
    text-based list of stops.
  - Per-stop: color picker (reuse the pattern from Color Palette Generator
    if a shared color-picker UI component exists in packages/ui; check
    first) and position (0-100%, draggable via the visual editor AND
    directly editable as a number for precision).
  - Add/remove stop buttons.
  - Minimum 2 stops enforced (a gradient needs at least two colors).
- Type-specific controls:
  - Linear: angle control (0-360°, both a rotary dial-style input if
    reasonably easy to build, and a plain numeric degree input as a
    fallback/precise-entry option — don't skip the numeric input even if a
    dial is built, precise values matter for design work) plus common angle
    presets (to top, to right, to bottom, to left, and the four diagonals).
  - Radial: shape (circle/ellipse), size keyword (closest-side,
    farthest-side, closest-corner, farthest-corner), and position (center,
    or a simple 2D position picker).
  - Conic: starting angle, position (center, or a simple 2D position
    picker).
- Generated CSS output (font-mono, live-updating), showing the complete
  `background: linear-gradient(...)` (or radial-/conic-) declaration.
- CopyButton on the CSS output.
- "Copy as Tailwind config" toggle (optional but nice, given your own
  Tailwind-based stack across projects) — outputs the equivalent as a
  Tailwind arbitrary-value background utility class or a theme.extend
  snippet, whichever is more directly usable; keep this genuinely optional/
  secondary, the raw CSS output is the primary deliverable.
- Preset gradients: a small gallery of visually pleasing starter gradients
  (6-10 presets) users can click to load as a starting point rather than
  building from scratch — genuinely valuable for a design tool like this,
  people often want "something like this" rather than starting from two
  flat colors.
- Randomize button (generates a random but reasonably pleasant-looking
  gradient — bias the randomization toward reasonable results, e.g. picking
  colors with some hue relationship rather than fully random RGB values
  that often look muddy).

STEP 5 — Logic separation: apps/web/app/tools/css-gradient-generator/utils/
gradientCss.ts — buildLinearGradient(stops, angle): string,
buildRadialGradient(stops, shape, size, position): string,
buildConicGradient(stops, angle, position): string, generating correct CSS
gradient function syntax. Pure, typed, no `any`. Import color utilities
from packages/color-utils (per Step 1) rather than duplicating conversion
logic here.

STEP 6 — Verify: registry entry resolves, and confirm color-palette's tool
still works correctly if the Step 1 extraction was performed (a quick
smoke-test of that tool's swatches/generation, not a full rebuild).

After building, tell me:
1. Confirm whether packages/color-utils was created in this build (Step 1)
   — if so, confirm color-palette was updated and still works; if
   colorConversion.ts was already extracted before this tool started, just
   confirm this tool imports from the shared location cleanly.
2. Confirm the drag-to-reposition stop editor works correctly with 3+ stops
   (not just the 2-stop default case) — dragging one stop shouldn't
   disturb the others' positions unexpectedly.
3. Confirm the generated CSS is valid by testing at least one output string
   directly in a browser (paste the generated `background: linear-gradient(...)`
   value into a simple test element) to confirm it renders as expected, not
   just that the string looks plausible.
```

## Note
**This is the build where the color-utils extraction (flagged as a
question after tool #7, revisited after tool #13) should actually happen**
— it's now the third tool wanting the same hex/RGB/HSL/contrast logic, and
deferring the extraction further just means more places to update later.
Treat Step 1 as a real, required step, not an optional nice-to-have, if the
extraction hasn't already happened by the time this build runs.
