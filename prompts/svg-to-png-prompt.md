# Claude Code Prompt — Build Tool #43: SVG to PNG Converter

Run after tool-shell and tools #1-42 exist. One genuine security
consideration worth taking seriously: SVGs can contain embedded scripts.

---

```
Build the SVG to PNG Converter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/svg-to-png/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, Canvas API (draw the SVG via an Image element or
  directly via a data URI, then export via toBlob) — no library needed for
  the conversion itself.
- SECURITY NOTE: SVG files can contain embedded <script> tags or event
  handler attributes (onload, onclick, etc.) — unlike raster image formats,
  SVG is technically a document format capable of executing script content
  if rendered in a context that allows it. When rendering the user's
  uploaded/pasted SVG for preview or conversion, ensure it's NOT rendered
  in a way that could execute embedded scripts — rendering it into a
  Canvas via drawImage (as this tool does for the actual PNG conversion)
  is inherently safe since Canvas rasterizes the SVG rather than executing
  it as a live document, but if you build a live SVG preview (before
  conversion) using dangerouslySetInnerHTML or an <img src="data:image/svg+xml..."
  approach, be aware: <img>-tag rendering of SVG does NOT execute embedded
  scripts (this is safe), but directly injecting raw SVG markup into the
  DOM via dangerouslySetInnerHTML WOULD execute embedded scripts and must
  be avoided. Use the <img>-tag or Canvas-based rendering path for any
  preview, never direct DOM injection of raw user-provided SVG markup.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'svg-to-png', title: 'SVG to PNG Converter',
    shortDescription: 'Convert SVG files to PNG, JPG, or WebP instantly.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['format-converter', 'favicon-generator', 'image-resizer']. FAQ (3-4 Q&A):
why you might need to convert SVG to a raster format (compatibility with
tools/platforms that don't support vector formats, or needing a fixed-
pixel-dimension version for a specific use case), how output resolution
works for a vector-to-raster conversion (since SVG is resolution-
independent, the user chooses the target pixel dimensions — explain this
is a meaningful choice, not a fixed property of the source file), a note
that this tool doesn't support the reverse (PNG to SVG, which requires
actual vector tracing/reconstruction and is a fundamentally different,
much harder problem — don't imply this tool does that), and the privacy
note.

STEP 3 — SvgToPng.tsx:
- Input: FileDropzone accepting .svg files, PLUS a "paste SVG markup"
  textarea alternative (font-mono) for users who have raw SVG code rather
  than a file — a common real case when copying SVG markup from an icon
  library or design tool.
- Live preview of the SVG (rendered safely per the SECURITY NOTE above —
  via <img src="data:image/svg+xml;base64,..."> or an object/embed tag
  that doesn't execute scripts, confirm whichever approach is used is
  actually safe, not just convenient).
- Output dimension controls: width/height (numeric inputs, with "maintain
  aspect ratio" lock, consistent with Image Resizer's pattern), OR a
  simple scale multiplier (1x, 2x, 3x, 4x — common for exporting at
  multiple pixel densities from one vector source, e.g. for @2x/@3x asset
  export workflows).
- Output format: PNG (default, supports transparency — SVGs commonly have
  transparent backgrounds and this should be preserved by default), JPEG,
  WebP.
- Background color option (relevant if output format is JPEG, or if the
  user wants a solid background under a transparent SVG for PNG/WebP too —
  default: transparent for PNG/WebP, white for JPEG, consistent with
  transparency handling established in other image tools in the catalog).
- Download button, and "Download all common sizes" quick option (generates
  a few common multiples — e.g. 1x/2x/3x of the base dimensions — as a
  small ZIP, useful for the multi-density export use case mentioned above;
  reuse the established zip utility).
- Error handling: malformed/invalid SVG markup should produce a clear error
  rather than a broken/blank preview — if the SVG fails to parse/render as
  an image, show a specific message rather than silently displaying nothing.

STEP 4 — Logic separation: apps/web/app/tools/svg-to-png/utils/
svgConvert.ts — convertSvgToRaster(svgMarkup: string, options: {
  width: number; height: number; format: string; backgroundColor?: string
}): Promise<Blob>, handling the safe rendering-to-canvas approach described
above. Typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm explicitly which rendering approach was used for the live
   preview (img-tag data URI vs. Canvas vs. something else) and confirm it
   does NOT execute embedded scripts — test this specifically by
   constructing a test SVG containing a script tag (e.g. one with an
   onload alert) and confirming it does NOT fire when previewed in this
   tool.
2. Confirm the multi-density export (1x/2x/3x) produces correctly-scaled
   outputs that are genuinely sharp at each resolution (not just the base
   resolution upscaled via Canvas, which would look soft) — since SVG's
   whole advantage is resolution-independence, each output should be
   rendered fresh from the vector source at its target size, not scaled
   from a single raster render.
```

## Note
**The embedded-script risk is the one real security consideration in this
otherwise straightforward tool** — SVG is unusual among "image" formats in
being a live document format capable of script execution in certain
rendering contexts. The explicit test (an SVG with a script tag, confirming
it doesn't fire) in the closing questions is worth actually running, not
just trusting the described approach is safe by construction — an easy
mistake would be building a "quick preview" using dangerouslySetInnerHTML
for convenience during development and not revisiting it before this ships.
