# Claude Code Prompt — Build Tool #45: Screenshot Annotator & Editor

Run after tool-shell and tools #1-44 exist. The most interaction-heavy
Canvas tool in the catalog so far — a real layered drawing/annotation
editor, not a single-transform tool.

---

```
Build the Screenshot Annotator & Editor for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/screenshot-annotator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, Canvas API for both the drawing surface and export —
  no library needed for basic shapes/text/freehand; consider `perfect-
  freehand` (a small, well-regarded library for smoothing freehand pen
  strokes into natural-looking curves) if freehand drawing feels too
  jagged/robotic with raw pointer-event sampling — evaluate this during
  build rather than committing to it upfront.
- Design tokens as established, though the editing canvas/toolbar should
  favor a clean, unobtrusive editor-chrome aesthetic (similar spirit to
  familiar screenshot-annotation tools) over the toolbox's typical card
  layout — this tool is closer to a mini-application than a single-form
  utility, and should be laid out accordingly (larger canvas area, compact
  tool palette, not a narrow centered form).

STEP 1 — Register:
  { slug: 'screenshot-annotator', title: 'Screenshot Annotator & Editor',
    shortDescription: 'Annotate screenshots with arrows, text, shapes, and blur, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-resizer', 'watermark-adder', 'image-compressor']. FAQ (3-4 Q&A):
common use cases (bug reports, tutorials, documentation, highlighting UI
elements in feedback), what annotation tools are available (briefly list
per Step 3), a note that this tool works entirely on an uploaded/pasted
image — it does not itself CAPTURE screenshots (that requires OS/browser-
level permissions this tool doesn't request — be explicit that this is an
annotate-an-existing-image tool, not a screen-capture tool, to set correct
expectations), and the privacy note (genuinely relevant here — screenshots
very often contain sensitive on-screen information, worth stating clearly).

STEP 3 — ScreenshotAnnotator.tsx:
- Image input: FileDropzone, PLUS paste-from-clipboard support (many users
  will have a screenshot on their clipboard directly from an OS screenshot
  tool — listen for a paste event with image data and load it directly,
  this is a high-value convenience for this specific tool's use case).
- Layered annotation tools, selectable from a toolbar:
  - Arrow (click-drag to draw a directional arrow, with a sensible default
    stroke width/color)
  - Rectangle / Ellipse (outline shapes, for highlighting/circling areas)
  - Freehand pen (click-drag freeform drawing)
  - Text (click to place a text box, type directly on canvas, draggable
    after placement)
  - Blur/pixelate region (click-drag a rectangle; the selected region gets
    a blur or pixelation effect applied — for redacting sensitive info
    like emails, names, or account numbers visible in the screenshot, a
    genuinely important feature for this tool's realistic use case)
  - Highlight (a semi-transparent colored rectangle, marker-style, useful
    for drawing attention to an area without fully obscuring it)
  - Numbered step markers (click to place a small numbered circle,
    auto-incrementing — genuinely useful for tutorial/documentation
    screenshots showing sequential steps, a nice differentiator)
- Per-tool options: stroke color, stroke width, fill (where applicable),
  font size for text — a compact, always-visible options bar reflecting
  whichever tool is currently active.
- Layer management: each placed annotation should be independently
  selectable (click to select), movable (drag), resizable (for shapes/text
  boxes), and deletable (select + delete key or a delete button) — this is
  the core technical complexity of this tool, build it as a real layered
  object model (an array of annotation objects with type/position/style
  properties, each rendered onto the canvas), not as permanently-baked
  pixel edits with no way to adjust after placing.
- Undo/redo (a proper multi-step undo stack, similar in spirit to CSV
  Viewer's undo implementation but operating on the annotation-object
  array rather than grid data — since this tool's whole workflow is
  iterative placement/adjustment of annotations, undo matters a lot here).
- Zoom/pan for working on large screenshots (a simple zoom control, at
  minimum fit-to-width and 100%/zoom-in/zoom-out — annotating a precise
  small detail on a large screenshot needs zoom to be usable).
- Export: "Flatten and download" (renders all annotation layers onto the
  base image and exports as PNG/JPEG), keeping the base image and all
  annotations composited into one final image.
- Clear all / start over.

STEP 4 — Logic separation: apps/web/app/tools/screenshot-annotator/
utils/:
- annotationModel.ts — typed definitions for each annotation type (Arrow,
  Rectangle, Ellipse, Freehand, Text, BlurRegion, Highlight, StepMarker)
  as a discriminated union, plus pure functions for hit-testing (is a given
  point inside/near this annotation, for click-to-select) and for
  serializing the current annotation array to a flattened render.
- renderAnnotations.ts — renderAnnotationsToCanvas(canvas, baseImage,
  annotations: Annotation[]): void, the flattening/export logic, drawing
  each annotation type correctly including the blur/pixelate effect
  (Canvas filter: blur() on a sub-region, or a manual pixelation algorithm
  — check Canvas filter support/behavior for region-limited blur, since
  the CSS/Canvas filter property applies to the whole canvas context by
  default and achieving a REGION-LIMITED blur specifically requires
  drawing the blurred region onto a separate offscreen canvas/temporary
  context and compositing just that region back — this is a genuine
  implementation detail worth getting right, a naive filter application
  will blur the entire image, not just the selected region).
- undoStack.ts — reuse/adapt the pattern established in CSV Viewer's undo
  stack if generic enough, operating on annotation-array snapshots instead
  of grid data.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the blur/pixelate-region tool correctly limits the effect to
   only the selected rectangular area, not the entire image — describe how
   this was implemented (offscreen canvas compositing, or another
   approach) since this is the one feature most likely to be implemented
   incorrectly on a first pass.
2. Confirm each annotation type is independently selectable, movable, and
   deletable after placement (not just correctly drawn on first placement)
   — test by placing 3-4 different annotation types, then selecting and
   repositioning one in the middle of the layer stack without disturbing
   the others.
3. Confirm paste-from-clipboard image loading works — describe how it was
   implemented (paste event listener + clipboard image data extraction).
4. Confirm undo/redo correctly steps through annotation placement AND
   deletion, not just placement.
```

## Note
**This is the most complex single-tool build in the catalog so far** — a
real layered object-annotation editor with select/move/resize/delete per
layer, undo/redo, and a region-limited blur effect is a meaningfully bigger
scope than any prior Canvas-based tool, most of which applied one
whole-image transform at a time. Budget significant review time here, and
pay particular attention to the blur/pixelate region-limiting behavior,
which is the one feature with a real, non-obvious correct implementation
(compositing via an offscreen canvas) versus an easy-but-wrong shortcut
(applying a filter to the whole canvas).
