# Claude Code Prompt — Build Tool #14: Image Compressor

Run this after tool-shell and tools #1-13 all exist and work. This is the
first tool needing a WASM codec and a real Web Worker for the main
processing path (not just a large-input safety net like Regex Tester or
CSV↔JSON) — expect this build to take meaningfully longer than recent tools.

---

```
Build the Image Compressor tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/image-compressor/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone, and other primitives
  from tools #1-13 — check what exists before writing anything new.
- 100% client-side. Use `browser-image-compression` (a well-established npm
  package wrapping WASM/Canvas-based compression, handles JPEG/PNG/WebP) as
  the primary compression engine — install with
  `npm install browser-image-compression`. This library already handles
  Web Worker offloading internally for large images, so check its API
  before building a custom worker wrapper on top of it; only add your own
  Web Worker layer if you need to run multiple files through it in parallel
  with progress reporting the library doesn't provide out of the box.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. File size numbers and compression
  percentages render in font-mono (they're data); everything else uses
  font-body.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'image-compressor', title: 'Image Compressor',
    shortDescription: 'Compress JPG, PNG, and WebP images without losing quality, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Free Image Compressor - Reduce File Size Online | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Image Compressor"
    description="Compress JPG, PNG, and WebP images — right in your browser, nothing uploaded."
    category="image"
    tier="free"
    relatedTools={['format-converter', 'image-resizer', 'background-remover']}
    faq={[...]}
  >
    <ImageCompressor />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered
  (format-converter and image-resizer are likely future tools, not yet built).
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: lossy vs. lossless compression (and which this tool does — JPEG/WebP
  compression here is lossy, PNG compression is closer to lossless
  optimization; be accurate about the distinction, don't oversimplify to
  "makes images smaller"), why file size reduction varies a lot by image
  content (photos compress more than graphics/screenshots with sharp edges
  and flat colors), a note that this tool processes images entirely
  client-side (genuinely meaningful here — users are often compressing
  personal photos, and "nothing uploaded" is a real, verifiable privacy
  property worth emphasizing), and practical guidance on what quality
  setting to use for web use (roughly 70-85% JPEG quality is broadly
  reasonable for most web use cases, mention this as a starting point).

STEP 3 — ImageCompressor.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- FileDropzone (reuse from packages/ui) accepting JPG/PNG/WebP, MULTI-FILE
  (accept multiple images at once — batch compression is one of the clearer
  reasons to prefer this over a generic "search result #1" competitor tool,
  worth building properly rather than single-file-only).
- Per-file list/grid once uploaded, each showing:
  - Thumbnail preview
  - Original file name and size
  - Compressed size (once processing completes) and percentage reduction
  - Individual progress indicator while compressing (this can take a
    perceptible moment for larger images/batches — don't leave the UI
    looking frozen with no feedback)
  - Before/after visual comparison — a simple side-by-side or slider
    comparison for at least the currently-selected/first image, so users
    can visually confirm quality is acceptable before trusting the
    compression settings, not just trust the percentage number blindly
- Global compression settings (apply to the whole batch, or reasonably
  per-file if that's not significantly more complex — batch-level settings
  applied to all files at once is an acceptable simplification, don't over-
  engineer per-file settings unless it's easy):
  - Quality slider (0-100, default ~80) for lossy formats
  - Target output format selector: keep original / convert to JPEG / convert
    to WebP / convert to PNG — WebP in particular is worth highlighting
    since it typically produces meaningfully smaller files than JPEG at
    equivalent visual quality, and this tool is a natural place to introduce
    users to that if they don't already know
  - Max dimension option (optional): resize the longest edge to a max value
    (e.g. 1920px) as part of compression, since resizing is often the single
    biggest lever for file size reduction and pairs naturally with
    compression rather than being a wholly separate concern — make this
    genuinely optional (off by default) since some users want compression
    without any resizing
- Re-compress button if settings change after files are already processed
  (don't require re-uploading to try a different quality setting).
- Per-file and "download all as ZIP" export options:
  - Individual download button per compressed file
  - "Download all" as a ZIP when more than one file has been processed —
    use a lightweight client-side zip library (e.g. `fflate` or `jszip`,
    check bundle size, prefer the smaller option since this is the only
    place in the tool that needs it) to bundle multiple compressed images
    into one download, entirely client-side
- Total savings summary once a batch completes: "Reduced 8 images from
  24.3 MB to 6.1 MB (75% smaller)" — this kind of aggregate number is
  satisfying and shareable, worth surfacing prominently rather than only
  per-file numbers.

STEP 4 — Performance:
- Process files sequentially or with limited concurrency (e.g. 2-3 at once),
  not all simultaneously, to avoid overwhelming the browser on a large batch
  — check whether `browser-image-compression`'s built-in worker handling
  already manages this reasonably, and only add your own concurrency
  throttling if testing shows it's needed.
- Show per-file and overall batch progress clearly — this is the first tool
  where processing isn't instant, so the UI needs to communicate "working on
  it" honestly rather than feeling unresponsive.
- Warn (not block) on very large batches (e.g. more than 20 files or a
  combined size over ~200MB) that processing may take a while and could be
  memory-intensive for the browser tab.

STEP 5 — Logic separation:
Extract into apps/web/app/tools/image-compressor/utils/:
  - compressImage.ts — a thin wrapper around `browser-image-compression`
    exposing compressImage(file: File, options: CompressionOptions):
    Promise<{ file: File; originalSize: number; compressedSize: number }>,
    typed, handling the format-conversion and max-dimension options.
  - zipFiles.ts — zipCompressedImages(files: { name: string; blob: Blob }[]):
    Promise<Blob>, wrapping whichever zip library is chosen.
  Both pure/testable independent of the UI, no `any`.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry. Test with at least: one large photo (several MB JPEG),
one PNG with transparency (confirm transparency is preserved through
compression and any format conversion — converting a transparent PNG to
JPEG should either warn about transparency loss or default to keeping PNG/
WebP for images with an alpha channel, don't silently flatten transparency
to black or white), and a batch of 5+ mixed files to confirm the ZIP export
works correctly.

After building, tell me:
1. Confirm how PNG transparency is handled specifically when the output
   format is changed — state what actually happens (warned, auto-preserved
   by defaulting away from JPEG, or something else) since silently losing
   transparency would be a real quality bug, not just a minor issue.
2. Confirm `browser-image-compression`'s built-in worker/concurrency
   handling was sufficient, or describe what custom concurrency throttling
   was added and why.
3. Which zip library was used (fflate vs jszip vs other) and its approximate
   bundle size impact, since this is a new dependency this tool alone needs.
```

---

## Notes

- **This is a meaningfully bigger build than recent tools** — real WASM/
  worker-backed compression, multi-file batch handling, and a ZIP export
  path are more moving parts than the mostly-pure-function tools you've
  been shipping. Budget more review time for this one than for something
  like UTM Link Builder or Unit Converter.
- **PNG transparency is the one correctness trap** — converting a
  transparent PNG to JPEG (which has no alpha channel) will silently flatten
  transparency to a solid color (usually white or black) unless explicitly
  handled. This is a classic "the compression worked but the output looks
  wrong" bug that's easy to miss in a quick test with a random stock photo
  and only shows up when a user compresses a logo or screenshot with
  transparency — worth specifically testing rather than assuming.
- **This tool is genuinely one of your stronger privacy differentiators** —
  people are often compressing personal photos, and most competing "free
  online image compressor" tools upload the file to a server. "Nothing
  uploaded, ever" is a real, checkable claim here (open devtools network tab,
  compress an image, see zero requests) — worth leaning into this in how the
  tool is marketed/positioned once live, not just stated in the FAQ.
