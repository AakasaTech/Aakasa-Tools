# Claude Code Prompt — Build Tool #39: Watermark Adder

Run after tool-shell and tools #1-38 exist. Canvas-based compositing tool,
similar technical shape to Favicon Generator's image manipulation but for a
single full-size output rather than a multi-size set.

---

```
Build the Watermark Adder for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/watermark-adder/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, Canvas API for compositing — no library needed.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'watermark-adder', title: 'Watermark Adder',
    shortDescription: 'Add a text or image watermark to your photos, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'image-resizer', 'format-converter']. FAQ (3-4 Q&A):
common reasons to watermark images (protecting ownership/attribution on
shared photos, branding), the difference between a subtle/tiled watermark
(harder to remove, less visually intrusive) and a bold single-placement
watermark (more visible deterrent, more intrusive), a practical note that
no watermark is fully tamper-proof against a determined actor (be honest
about this rather than overselling the tool's protective value), and the
privacy note.

STEP 3 — WatermarkAdder.tsx:
- FileDropzone accepting one or more images (batch watermarking — applying
  the same watermark config across a folder of photos is a genuinely
  common real use case).
- Watermark type tabs: Text / Image (logo).

  TEXT WATERMARK:
  - Text input (e.g. "© Your Name" or a website URL).
  - Font selector (a small curated set, or reuse Font Pairing Previewer's
    catalog if that's been built — check TOOL_REGISTRY/existing code first
    rather than building a third font list from scratch if a reusable one
    already exists).
  - Font size, color (with alpha/opacity — watermarks are typically
    semi-transparent), and a subtle text-shadow/outline option (improves
    legibility across varying background colors/busy photos — a small
    black or white outline behind the text is a common, genuinely useful
    watermark technique worth including).
  - Rotation angle (a diagonal watermark is a very common style).

  IMAGE WATERMARK (logo):
  - FileDropzone for a logo/image file (ideally a transparent PNG).
  - Scale control (relative to the source image's size, e.g. as a
    percentage of width).
  - Opacity control.

  SHARED (both types):
  - Placement: preset positions (9-point grid: corners, edges, center) plus
    a "tiled/repeated" option that repeats the watermark across the full
    image at a configurable spacing — tiled watermarks are notably more
    resistant to simple cropping-out than a single corner placement, worth
    building properly rather than as an afterthought.
  - Margin/padding control for non-tiled placements (distance from the
    chosen edge/corner).
  - Live preview showing the watermark composited onto the (first, if
    batch) source image, updating as any control changes.
- "Apply to all" batch action, per-file individual download, "Download all
  as ZIP" (reuse the established zip utility).
- Export format/quality options consistent with other image tools in the
  catalog (keep original / JPEG / PNG / WebP, quality slider for lossy).

STEP 4 — Logic separation: apps/web/app/tools/watermark-adder/utils/
applyWatermark.ts — applyTextWatermark(canvas, options): void and
applyImageWatermark(canvas, logoImage, options): void, handling placement
math (including tiled repetition) as pure-ish canvas-drawing functions.
Extract the 9-point/tiled placement coordinate calculation into its own
testable pure function — calculateWatermarkPositions(canvasSize,
watermarkSize, placement, spacing?): {x, y}[] — returning an array of
positions (a single position for non-tiled, many for tiled) so the same
placement logic drives both text and image watermark rendering
consistently rather than duplicating positioning math per watermark type.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the tiled watermark mode correctly repeats across the full
   image at the configured spacing without visible gaps or overlap
   artifacts at the edges — test on at least one non-square image.
2. Confirm the text watermark's rotation and outline/shadow options both
   render correctly together (rotated text with an outline is a slightly
   trickier canvas operation than either alone — confirm it wasn't
   skipped or simplified away under the combined case).
3. Confirm calculateWatermarkPositions is shared/reused between the text
   and image watermark code paths rather than each implementing its own
   separate positioning logic.
```

## Note
**Tiled placement is the one meaningfully more complex feature** in this
tool — a single corner-placed watermark is straightforward, but correctly
repeating a rotated or irregularly-sized watermark across an entire image
at even spacing (without visible seams or edge artifacts) takes more care.
Worth confirming this was actually built properly rather than only the
simpler single-placement case, since tiled watermarking is also the more
genuinely useful mode for anyone seriously trying to protect an image from
casual cropping.
