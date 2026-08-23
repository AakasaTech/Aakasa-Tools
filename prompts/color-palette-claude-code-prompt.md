# Claude Code Prompt — Build Tool #7: Color Palette Generator & Extractor

Run this after tool-shell and tools #1-6 all exist and work. This is the
first tool targeting a designer audience rather than developers — a good
test of whether tool-shell's visual identity holds up outside the dev-tool
context, and it's naturally shareable (good for organic backlinks).

---

```
Build the Color Palette Generator & Extractor tool for the Aakasa Toolbox
monorepo.

CONTEXT:
- Route: apps/web/app/tools/color-palette/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone, and other primitives
  from tools #1-6 — check what exists before writing anything new.
- 100% client-side. Palette extraction from images uses the Canvas API
  (drawImage + getImageData) for pixel sampling — no external color-analysis
  libraries needed, this is well within native Canvas capability.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Hex/RGB/HSL VALUES render in
  font-mono (they're data), but this tool is otherwise more visual/less
  code-dense than prior tools — lean into larger color swatches, generous
  spacing, less text density than the developer tools had.

This tool covers TWO related workflows in one page (generate a palette from
scratch, and extract a palette from an uploaded image) since they share an
audience and output format. Build them as two clearly separated tabs, not
two separate pages.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'color-palette', title: 'Color Palette Generator & Extractor',
    shortDescription: 'Generate color palettes or extract them from any image.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Color Palette Generator & Extractor - Free Online Tool |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Color Palette Generator & Extractor"
    description="Generate color palettes or extract them from any image — entirely in your browser."
    category="color-design"
    tier="free"
    relatedTools={['contrast-checker', 'css-gradient-generator', 'favicon-generator']}
    faq={[...]}
  >
    <ColorPaletteTool />
  </ToolShell>
  Note: check TOOL_REGISTRY first — those three related tools likely don't
  exist yet. Drop any slug that isn't currently registered rather than
  linking to a page that doesn't exist yet.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: how palette generation works (color theory basics — complementary,
  analogous, triadic — described simply, not academically), how image
  extraction works (dominant/representative colors via pixel sampling, not
  every unique pixel color), common use cases (brand palettes, UI theming,
  mood boards), and confirmation uploaded images are never sent anywhere —
  processed entirely in-browser via Canvas.

STEP 3 — ColorPaletteTool.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI. Two tabs:

  TAB A — Generate:
  - Base color picker (native <input type="color"> styled to match the
    design system, plus a hex text input synced to it).
  - Harmony mode selector: Complementary, Analogous, Triadic, Split-
    Complementary, Monochromatic, Tetradic. Selecting one generates a 4-6
    color palette derived from the base color using standard HSL hue-rotation
    math for that harmony type.
  - "Randomize" button — picks a new random base color and regenerates.
  - Large color swatches displayed in a row, each showing: the color fill,
    hex value below it (font-mono), and a small copy-on-click behavior (click
    the swatch itself to copy its hex — plus keep an explicit CopyButton for
    accessibility/discoverability, click-to-copy alone isn't discoverable
    enough).
  - Per-swatch format toggle or small popover showing HEX / RGB / HSL / CSS
    variable format (e.g. `--color-1: #3B82F6;`) so users can copy whichever
    format their project uses.
  - "Copy all as CSS variables" button — outputs a ready-to-paste :root {}
    block with all swatches as named custom properties.
  - "Lock" toggle per swatch (small lock icon) — locked swatches survive
    re-randomization/regeneration, unlocked ones update. This is a genuinely
    useful feature (mirrors tools like Coolors) worth the extra state
    management.

  TAB B — Extract from Image:
  - FileDropzone (reuse from packages/ui) accepting image files.
  - On upload: draw the image to an offscreen <canvas>, sample pixel data,
    and run a simple color-quantization algorithm (median cut or basic
    k-means clustering on RGB values is sufficient — don't over-engineer,
    a straightforward median-cut implementation is well within scope) to
    extract 5-8 dominant colors.
  - Show the uploaded image alongside the extracted swatches (image on one
    side, palette strip on the other, or palette as a strip beneath the
    image).
  - Same swatch treatment as Tab A: hex/RGB/HSL display, copy behavior,
    "copy all as CSS variables."
  - Sort extracted swatches by prevalence (most dominant color first) by
    default, with an option to sort by hue instead (useful for visually
    scanning the palette).
  - Downscale large images before pixel sampling (e.g. to max 200px on the
    longest edge via canvas drawImage scaling) — this is both a performance
    optimization AND sufficient for color extraction accuracy, no need to
    sample full-resolution pixel data.

STEP 4 — Accessibility bonus (small addition, high value):
For each generated/extracted swatch, show a small contrast indicator against
both pure white and pure black text (e.g. two tiny "Aa" previews with a
WCAG AA pass/fail badge) — this gives designers immediate practical
signal without needing to jump to a separate contrast checker tool for a
quick gut-check. Keep this lightweight; it's a preview, not a replacement
for the dedicated Contrast Checker tool planned later.

STEP 5 — Logic separation:
Extract into apps/web/app/tools/color-palette/utils/:
  - colorConversion.ts — pure functions: hexToRgb, rgbToHsl, hslToRgb,
    rgbToHex, and a getContrastRatio(color1, color2): number implementing
    the WCAG relative luminance formula. These are foundational and SHOULD
    be written generically enough for other future color-related tools
    (Contrast Checker, CSS Gradient Generator, Favicon Generator) to import
    directly rather than reimplementing.
  - harmonyGenerator.ts — generateHarmony(baseColorHex: string, mode:
    HarmonyMode): string[] implementing the hue-rotation math for each
    harmony type.
  - imageColorExtraction.ts — extractPalette(imageData: ImageData, count:
    number): string[] implementing the quantization algorithm. Keep this
    pure/dependency-free (takes ImageData in, returns hex strings out) so
    it's testable without a real canvas/DOM in a test environment.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Whether colorConversion.ts's functions (hexToRgb, getContrastRatio, etc.)
   are generic and dependency-free enough to become the canonical shared
   implementation once a dedicated Contrast Checker tool gets built — flag
   if anything here should actually move to packages/ui or a new
   packages/color-utils shared package instead of living inside this one
   tool's folder.
2. Whether the median-cut/quantization approach performed acceptably on a
   large (e.g. 4000x3000px) test image after the downscaling step, or if
   anything felt sluggish.
```

---

## Notes

- **`colorConversion.ts` is the one file in this tool most likely to get
  reused elsewhere** — Contrast Checker, CSS Gradient Generator, and Favicon
  Generator are all on your roadmap and will all need hex/RGB/HSL conversion
  plus WCAG contrast math. Worth genuinely considering whether this should
  become `packages/color-utils` right now rather than waiting until it's
  duplicated three times — the closing question flags this explicitly so
  Claude Code's answer can inform that decision before tool #8+.
- **The "lock" feature on generate mode** is a small UX detail but it's what
  separates a forgettable palette generator from one designers actually
  return to (it's the single most-used feature in tools like Coolors) —
  don't let it get cut for scope even though it adds some state complexity.
- This tool is naturally **shareable/screenshot-friendly** — palettes are
  visual and people post them. Worth keeping in mind for later (e.g. a
  "copy as image" export) even though it's not in this build's scope.
