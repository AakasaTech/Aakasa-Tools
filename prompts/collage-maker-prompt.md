# Claude Code Prompt — Build Tool #47: Collage Maker

Run after tool-shell and tools #1-46 exist. Layout-focused Canvas tool —
shares drag/reposition interaction patterns with Screenshot Annotator, at
a smaller scope (whole-image placement, not freeform drawing).

---

```
Build the Collage Maker for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/collage-maker/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, Canvas API for compositing — no library needed.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'collage-maker', title: 'Collage Maker',
    shortDescription: 'Combine multiple photos into one collage layout, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-resizer', 'image-compressor', 'format-converter']. FAQ (3-4 Q&A):
how the tool works (pick a layout template, drop in photos, adjust and
export), a note that photos are automatically cropped to fit each layout
cell (since source photos rarely match a cell's exact aspect ratio, some
cropping is inherent — explain the crop-to-fill behavior briefly so it's
not a surprise), the privacy note.

STEP 3 — CollageMaker.tsx:
- Layout template selector: a set of common grid layouts as visual
  thumbnails to choose from — e.g. 2-photo (side-by-side, stacked), 3-photo
  (various arrangements), 4-photo grid (2x2), and a few asymmetric layouts
  (one large + several small) — aim for roughly 8-12 template options
  covering common photo counts (2 through 6), not an exhaustive layout
  library.
- Overall canvas dimensions/aspect ratio selector: square (common for
  social media), landscape, portrait, or custom — affects how the chosen
  template's cells are proportioned.
- Photo slots: once a template is selected, show the layout's empty cells;
  each cell accepts a dropped/uploaded photo (drag-and-drop a file directly
  onto a specific cell, or click a cell to open a file picker for it).
- Per-photo adjustment within its cell: since photos get cropped to fill
  their cell (per the FAQ note), let the user reposition the crop within
  the cell (drag the photo within its cell to choose which part is visible
  — a common "pan to reposition crop" interaction) and zoom in/out slightly
  within the cell (a simple scale slider or scroll/pinch, whichever is
  simpler to implement reliably) — this is the core interaction that makes
  a collage tool actually usable rather than producing awkward, arbitrarily
  -cropped results.
- Spacing/border controls: gap between photos (a slider, 0 for edge-to-edge
  photos up to a visible gap), border/background color for the gaps and
  outer canvas edge (color picker), and corner rounding for individual
  cells (a slider, ties in conceptually with Border-Radius Generator's
  purpose but implemented directly here via Canvas rounded-rect clipping
  rather than importing that tool's CSS-focused utilities, since the
  output target is different).
- Swap/reorder: ability to swap which photo occupies which cell (drag one
  cell's photo onto another cell to swap them, or a simpler "swap with"
  selection mechanism if drag-swap is too complex to build reliably —
  pick whichever interaction can be built solidly rather than a fragile
  drag-swap that half-works).
- Live preview reflecting all current settings.
- Export: Download as PNG/JPEG, with a dimension/quality selector consistent
  with other image tools in the catalog.

STEP 4 — Logic separation: apps/web/app/tools/collage-maker/utils/:
- collageTemplates.ts — a typed registry of layout templates, each
  defining its cells as relative (percentage-based) rectangles within the
  overall canvas, so templates scale cleanly to any chosen output
  dimensions.
- renderCollage.ts — renderCollageToCanvas(canvas, template, photoAssignments:
  { cellIndex: number; image: HTMLImageElement; cropOffset: {x, y}; zoom:
  number }[], options: { gap, borderColor, cornerRadius }): void, handling
  the crop-to-fill-cell math (compute the correct source rectangle from a
  photo given its cell's target aspect ratio, the user's pan offset, and
  zoom level) and rounded-corner clipping per cell.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the pan-to-reposition-crop interaction works correctly within a
   cell — test with a photo whose aspect ratio differs meaningfully from
   its cell's aspect ratio, confirm panning actually reveals different
   parts of the source photo within the cell's crop, not just resizing the
   cell.
2. Confirm the swap/reorder mechanism actually implemented, and describe
   the interaction (drag-swap vs. a simpler alternative) and why that
   choice was made.
3. Confirm rounded-corner clipping is applied correctly per-cell in the
   final export (not just visually in an on-screen preview that doesn't
   match the actual downloaded file).
```

## Note
**The crop-to-fill-and-reposition interaction is this tool's core value**
— without the ability to pan/zoom a photo within its assigned cell, users
get an arbitrary, often awkward automatic crop with no control, which would
make this feel more like a broken layout tool than a usable collage maker.
Worth confirming this interaction is solid (not just present) before
considering the tool done, since it's the one feature that most determines
whether the tool feels genuinely usable versus merely functional.
