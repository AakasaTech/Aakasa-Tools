# Claude Code Prompt — Build Tool #42: Image Rotator & Flipper

Run after tool-shell and tools #1-41 exist. Simple, fast, low-risk Canvas
build — good pace recovery after Background Remover's heavier scope.

---

```
Build the Image Rotator & Flipper for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/image-rotator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, Canvas API — no library needed.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'image-rotator', title: 'Image Rotator & Flipper',
    shortDescription: 'Rotate and flip images instantly, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-resizer', 'image-compressor', 'format-converter']. FAQ (3-4 Q&A):
what this tool does (rotate by 90° increments or a custom angle, flip
horizontally/vertically), a note on why arbitrary-angle rotation
(non-90°-increment) requires the canvas to expand to fit the rotated
image's new bounding box (so the output image dimensions may differ from
the input — worth explaining briefly since it's a slightly non-obvious
behavior), and the privacy note.

STEP 3 — ImageRotator.tsx:
- FileDropzone accepting one or more images (batch — applying the same
  rotation/flip to several images at once is a genuine common use case,
  e.g. a folder of photos all taken sideways).
- Quick actions: Rotate 90° clockwise, Rotate 90° counter-clockwise, Rotate
  180°, Flip horizontal, Flip vertical — each a single-click button,
  applicable repeatedly/combinable (e.g. rotate then flip).
- Custom angle rotation: a slider/numeric input for arbitrary degrees
  (0-360), with live preview. When rotating by a non-90°-increment angle,
  correctly expand the output canvas to contain the full rotated image
  (don't clip corners) — the background/fill for the newly-exposed corner
  areas should be configurable (transparent for PNG output, or a solid
  color picker for JPEG output which has no alpha channel — default white,
  consistent with how other tools in the catalog handle the transparency-
  to-JPEG case).
- Live preview showing the current cumulative transform state (if a user
  clicks rotate-90 twice then flip-horizontal, the preview reflects all
  three applied in sequence).
- Reset button (returns to original, unrotated/unflipped state).
- Undo (simple single-level undo of the last action is sufficient here,
  doesn't need the full multi-step undo stack built for CSV Viewer — this
  tool's operations are simple enough that "undo last click" covers the
  realistic need).
- Export format/quality options consistent with other image tools (keep
  original / JPEG / PNG / WebP).
- Batch: "apply to all" if multiple files uploaded, with the same
  transform sequence applied to each, individual + ZIP download (reuse
  established zip utility).

STEP 4 — Logic separation: apps/web/app/tools/image-rotator/utils/
transformImage.ts — applyRotation(canvas, sourceImage, degrees): void
(handling both 90°-increment and arbitrary-angle cases, correctly computing
expanded canvas bounds for arbitrary angles via basic trigonometry — new
width/height from the rotated bounding box of the original rectangle) and
applyFlip(canvas, sourceImage, horizontal: boolean, vertical: boolean):
void. Pure-ish canvas-drawing functions, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm arbitrary-angle rotation (e.g. 37°) correctly expands the output
   canvas to contain the full rotated image without clipping any corners —
   describe the computed output dimensions for a specific test case (e.g.
   a 400x300 image rotated 37°) and confirm they're larger than the
   original in the expected way.
2. Confirm combined transforms (e.g. rotate 90° then flip horizontal) 
   produce the visually correct combined result, not just each transform
   working correctly in isolation.
```

## Note
**Arbitrary-angle rotation's canvas-expansion math is the one place a
naive implementation goes wrong** — rotating a rectangle by a non-90°
angle produces a new bounding box that's larger than the original in both
dimensions, and a canvas sized to the original dimensions will clip the
rotated image's corners if this isn't accounted for. This is simple
trigonometry (new width = |w·cos θ| + |h·sin θ|, similarly for height) but
easy to skip if only 90°-increment rotation was tested during development.
