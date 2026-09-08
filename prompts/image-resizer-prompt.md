# Claude Code Prompt — Build Tool #36: Image Resizer & Cropper

Run after tool-shell and tools #1-35 exist. First dedicated Image Tools
category build after Image Compressor — shares its FileDropzone/Canvas
patterns directly.

---

```
Build the Image Resizer & Cropper for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/image-resizer/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- Check apps/web/app/tools/image-compressor/ for existing FileDropzone
  usage patterns and any Canvas-based image-handling utilities that could
  be reused (e.g. a generic "load File into Canvas/ImageBitmap" helper).
- 100% client-side, Canvas API for resizing and cropping — no library
  needed for the core transforms.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'image-resizer', title: 'Image Resizer & Cropper',
    shortDescription: 'Resize and crop images to exact dimensions, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'format-converter', 'placeholder-image-generator']
(check TOOL_REGISTRY, drop unregistered — format-converter likely not built
yet). FAQ (3-4 Q&A): the difference between resizing (scaling the whole
image) and cropping (selecting/keeping a portion of it), what "maintain
aspect ratio" does and why it matters (prevents visible stretching/
distortion), common social media/platform image size requirements (brief
mention, ties into the presets below), and the privacy note.

STEP 3 — ImageResizer.tsx:
- FileDropzone accepting a single image (this tool is precision-focused on
  one image at a time, unlike Image Compressor's batch approach — that's
  an intentional, reasonable scope difference).
- Two modes, tabbed:

  MODE A — Resize:
  - Width/height numeric inputs, with a "lock aspect ratio" toggle
    (default ON) that keeps width/height proportional as either is edited.
  - Percentage-based resize option (e.g. "50%") as an alternative input
    mode to exact pixel dimensions.
  - Common preset dimensions (dropdown or button row): a set of genuinely
    useful presets — Instagram post (1080x1080), Instagram story
    (1080x1920), Twitter/X post image, Facebook cover, LinkedIn banner,
    YouTube thumbnail (1280x720), common desktop wallpaper sizes — clicking
    one fills the dimension fields (respecting aspect-ratio lock behavior
    sensibly — if the preset's aspect ratio doesn't match the source
    image, warn that cropping may be needed rather than silently
    distorting).
  - Upscale warning: if the requested dimensions exceed the source image's
    original size, show a clear warning that upscaling will reduce quality
    (Canvas-based upscaling doesn't add real detail) — don't block it, just
    inform.
  - Resampling quality note: browsers' Canvas drawImage scaling is
    generally reasonable for downscaling; for meaningfully better
    downscale quality on very large size reductions, consider a
    step-down/multi-pass resize approach (progressively halving dimensions
    across multiple draw calls rather than one large single-step
    downscale) since a single drastic downscale can look softer/more
    aliased than a stepped approach — implement this if straightforward,
    otherwise a single-pass resize is an acceptable baseline, just note
    which approach was taken.

  MODE B — Crop:
  - Interactive crop overlay on the image preview: a draggable/resizable
    selection rectangle the user positions over the source image (this is
    the core interaction — build a real drag-to-select-and-resize crop
    box, not just numeric x/y/width/height inputs alone, though numeric
    inputs should also be available for precision alongside the visual
    handle).
  - Aspect ratio lock options for the crop selection itself: Free, 1:1,
    16:9, 4:3, 3:2 — constrains the crop rectangle's proportions while
    dragging/resizing.
  - Live preview of the cropped result (a small side panel showing what
    the final cropped image will look like, updating as the selection is
    adjusted).

- Both modes: export format selector (keep original / JPEG / PNG / WebP),
  quality slider if JPEG/WebP is selected (reuse browser-image-compression
  or the Canvas toBlob quality parameter, whichever is simpler for this
  tool's scope — this tool's main job is dimension changes, not
  compression, so a simple Canvas-native quality parameter is likely
  sufficient rather than pulling in the full compression library).
- Download button.
- CopyButton/copy-to-clipboard for the result image (reuse existing
  Clipboard API image-write implementation if factored generically from an
  earlier tool).

STEP 4 — Logic separation: apps/web/app/tools/image-resizer/utils/:
- resizeImage.ts — resizeToCanvas(image, targetWidth, targetHeight,
  useSteppedDownscale: boolean): Promise<Blob>.
- cropImage.ts — cropToCanvas(image, cropRect: { x, y, width, height }):
  Promise<Blob>.
Both typed, no `any`, operating on a source image/canvas and returning a
Blob.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the crop selection UI actually supports both dragging to
   reposition AND dragging edge/corner handles to resize the selection
   rectangle (not just one or the other) — describe the interaction model
   implemented.
2. Confirm whether a stepped/multi-pass downscale was implemented for large
   size reductions, or whether a single-pass resize was used as the
   baseline — state which, and if single-pass, confirm the visual quality
   was at least checked on a significant downscale (e.g. reducing a 4000px
   image to 200px) to make sure it doesn't look unacceptably soft/aliased.
3. Confirm aspect-ratio-locked crop selections (e.g. 1:1) genuinely
   maintain that ratio while the user drags to resize the selection, not
   just on initial placement.
```

## Note
**The interactive crop UI is the real build effort here** — a proper
drag-to-position, drag-to-resize crop rectangle with optional aspect-ratio
locking is a meaningfully more involved interaction than anything built so
far in the Image category (Image Compressor had no interactive selection,
just whole-file transforms). Worth budgeting real review time for this
specific interaction rather than treating it as a minor detail alongside
the more mechanical resize-by-numbers mode.
