# Claude Code Prompt — Build Tool #48: Image Dimension & DPI Calculator

Run after tool-shell and tools #1-47 exist. Closes out the Image Tools
category batch. Simple calculator tool, no image processing at all — pure
math and a genuinely common point of confusion to clear up.

---

```
Build the Image Dimension & DPI Calculator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/dpi-calculator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure arithmetic — no library, no image processing
  needed at all (this tool computes relationships between pixel
  dimensions, physical size, and DPI/PPI, it doesn't manipulate an actual
  image file).
- Design tokens as established. Numeric values in font-mono.

STEP 1 — Register:
  { slug: 'dpi-calculator', title: 'Image DPI & Dimension Calculator',
    shortDescription: 'Calculate print size, pixel dimensions, and DPI/PPI instantly.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-resizer', 'unit-converter', 'placeholder-image-generator']. FAQ
(3-4 Q&A): what DPI/PPI actually means and the (commonly conflated but
technically distinct) difference between them (DPI = dots per inch,
strictly a PRINTING/output-device term; PPI = pixels per inch, describes
image/screen resolution — in casual use people say "DPI" to mean PPI
constantly, and this tool should acknowledge that conflation plainly rather
than being pedantic about it while still explaining the technical
distinction for anyone who wants it), what DPI value is appropriate for
different purposes (72-96 PPI is the traditional "web/screen" reference
figure, though modern high-DPI/Retina displays render at much higher
actual pixel densities — mention this nuance briefly; 300 DPI is the
common print-quality standard for photos/documents), and the practical
relationship this tool computes (pixel dimensions = physical size × DPI,
rearranged to solve for whichever value is missing), and the privacy note
(minimal relevance here, but keep consistent).

STEP 3 — DpiCalculator.tsx:
- Three-way calculator: given any two of the three values, compute the
  third. Clearly present as: Pixel Width × Pixel Height, Physical Width ×
  Physical Height (with a unit toggle: inches / cm / mm), and DPI/PPI.
  - Enter pixel dimensions + DPI → compute physical print size.
  - Enter physical size + DPI → compute required pixel dimensions.
  - Enter pixel dimensions + physical size → compute the resulting DPI.
  Make it clear which field(s) the user is solving FOR by having the
  computed field auto-update/highlight distinctly from the two input
  fields, rather than presenting all three as equally-editable in a
  confusing circular way — a common, clear pattern: let the user pick
  which one they want computed (a small "solve for" selector or simply
  auto-computing whichever field wasn't the one most recently edited)
  rather than an ambiguous three-open-fields layout.
- Aspect ratio lock: an optional toggle that, when computing physical size
  or pixel dimensions, maintains a specified aspect ratio (useful when
  resizing/planning for a specific ratio like 4:3 or 16:9 rather than
  independent width/height).
- Common print size presets (quick-fill buttons): standard photo print
  sizes (4×6in, 5×7in, 8×10in, A4, A3) — clicking one fills the physical
  size fields, letting the user then solve for required pixel dimensions
  at their chosen DPI.
- Common DPI presets (quick-fill buttons): Web/Screen (96), Standard Print
  (300), High-Quality Print (600) — with brief inline labels explaining
  what each is typically used for.
- Results summary: once all three values are known/computed, show a clear
  summary sentence (e.g. "A 3000×2000px image at 300 DPI prints at 10×6.67
  inches") — this kind of plain-language restatement is more immediately
  useful than just three separate numeric fields for someone unfamiliar
  with the underlying math.
- Megapixel calculation as a bonus derived value (pixel width × pixel
  height ÷ 1,000,000) — a commonly-wanted related figure, cheap to include
  alongside the main calculator.

STEP 4 — Logic separation: apps/web/app/tools/dpi-calculator/utils/
dpiCalculations.ts — pure, typed functions: calculatePhysicalSize(pixels:
{width, height}, dpi: number): {width, height} (in inches, with separate
unit-conversion helpers for cm/mm display), calculatePixelDimensions(
physicalSize, dpi): {width, height}, calculateDpi(pixels, physicalSize):
number, calculateMegapixels(pixels): number. No `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the "solve for the missing value" interaction is genuinely clear
   and not ambiguous/circular — describe exactly how the UI indicates which
   field is being computed versus which two are user-supplied inputs.
2. Confirm unit conversion (inches/cm/mm) for physical size is correct at
   a simple reference point (e.g. 1 inch = 2.54 cm exactly) — state the
   computed value for a test case.
```

## Note
This is a low-risk, purely computational build — the main design
consideration worth getting right is the three-way calculator's UX (which
field is being solved for at any given moment), since a naive "all three
fields are simultaneously editable" layout tends to feel confusing/circular
rather than clearly showing cause and effect. Otherwise this is one of the
simplest, fastest builds in the current batch.
