# Claude Code Prompt — Build Tool #35: Placeholder Image Generator

Run after tool-shell and tools #1-34 exist. Simple Canvas-based generator,
closes out the Color & Design category batch before moving into Image
Tools proper.

---

```
Build the Placeholder Image Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/placeholder-image-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, Canvas API for rendering — no library needed.
- Import color utilities from packages/color-utils where relevant (color
  picker/contrast for text-on-background legibility).
- Design tokens as established.

STEP 1 — Register:
  { slug: 'placeholder-image-generator', title: 'Placeholder Image Generator',
    shortDescription: 'Generate placeholder images with custom dimensions, colors, and text.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['color-palette', 'favicon-generator', 'contrast-checker']. FAQ (3-4 Q&A):
common use cases (mockups, wireframes, testing responsive image layouts
before real assets are ready), how the dimension/text/color options work,
a note that this is a genuinely simple client-side generator (not a hosted
placeholder-image service with a stable URL — clarify explicitly that this
tool generates a downloadable image file, it does NOT provide a persistent
URL like placeholder.com-style services do, since that's a fundamentally
different, server-backed category of tool this toolbox doesn't offer;
being clear about this prevents a confused expectation), and the privacy
note.

STEP 3 — PlaceholderImageGenerator.tsx:
- Dimension controls: width and height (numeric inputs), plus common preset
  aspect ratios/sizes as quick-fill buttons (1:1 square, 16:9, 4:3, common
  social media sizes like 1200x630 for OG images — genuinely useful given
  this pairs conceptually with Meta Tag Previewer's OG image guidance,
  1080x1080 for Instagram, etc.).
- Background: solid color picker, OR a simple two-color gradient option
  (reuse gradient CSS building logic conceptually, but this renders to
  Canvas as an actual gradient fill, not CSS — a straightforward
  createLinearGradient Canvas API call, doesn't need to reuse the CSS
  Gradient Generator's string-building utils directly since the output
  target is different).
- Text overlay: custom text input (default: automatically show the
  dimensions themselves, e.g. "800 × 600", which is the single most common
  placeholder-image convention and a sensible default even before the user
  types anything).
  - Font size (auto-scale reasonably based on image dimensions by default,
    with a manual override slider).
  - Text color picker, with a live contrast check against the background
    (reuse getContrastRatio from packages/color-utils) — show a small
    warning if contrast is poor, since illegible placeholder text defeats
    the point.
  - Text position (center default, plus corner/edge options).
- Pattern option (alternative to solid/gradient background): a simple
  repeating diagonal-stripe or checkerboard pattern, useful for a more
  visually distinct "this is a placeholder" look than a flat color —
  optional, not required if it adds excessive scope, but a nice touch if
  straightforward to implement via Canvas.
- Format selector for export: PNG (default, supports transparency if
  background is set to transparent) or JPEG.
- Live preview (the Canvas render itself, shown at a reasonable display
  size regardless of the actual output dimensions — don't render a 4000px
  wide canvas at full size in the page layout, scale the preview display
  while keeping the actual export at full requested resolution).
- Download button.
- "Copy image to clipboard" button (Clipboard API image-write, same
  pattern/support-check as used in QR Code Generator — reuse that
  implementation if it was factored generically).

STEP 4 — Logic separation: apps/web/app/tools/placeholder-image-generator/
utils/renderPlaceholder.ts — renderPlaceholderToCanvas(canvas:
HTMLCanvasElement, options: PlaceholderOptions): void, handling background
fill (solid/gradient/pattern), text rendering with auto-sizing, and
contrast-aware defaults. Pure where reasonably possible given it operates
on a canvas ref, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the preview scales down for display while the actual downloaded
   file matches the exact requested dimensions (test with a large
   dimension request, e.g. 3000x2000, and confirm the downloaded file is
   genuinely that size, not the scaled-down preview size).
2. Confirm the contrast warning on text-over-background actually triggers
   for a genuinely low-contrast combination (e.g. light gray text on white)
   and doesn't trigger for a clearly high-contrast one.
3. Confirm whether the Clipboard API copy-to-clipboard button reused an
   existing implementation from QR Code Generator or needed a fresh one.
```

## Note
This is a low-risk, mostly-polish build — the one thing worth actually
verifying is that preview-display scaling doesn't leak into the exported
file's actual resolution, which is an easy mistake when a Canvas element's
CSS display size and its actual pixel dimensions get conflated.
