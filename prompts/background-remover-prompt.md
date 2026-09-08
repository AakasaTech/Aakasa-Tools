# Claude Code Prompt — Build Tool #41: Background Remover

Run after tool-shell and tools #1-40 exist. This is your first ML-model-
backed tool and was originally flagged as the point where Pro-tier
auth/entitlement infrastructure would enter the toolbox. That infrastructure
still doesn't exist — build this fully functional and free for now, and
treat the tier-gating question as a deliberate follow-up decision, not
something to improvise here.

---

```
Build the Background Remover for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/background-remover/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, including the ML inference. Use `@imgly/background-
  removal` (a purpose-built, well-maintained client-side background removal
  library using ONNX models run via WebAssembly/WebGL in-browser — install
  with `npm install @imgly/background-removal`). This downloads a model
  file (typically several MB to tens of MB depending on quality setting) on
  first use — this is a meaningfully different resource profile than any
  prior tool, see Step 3 for how to handle this honestly in the UI.
- Design tokens as established.
- TIER NOTE: register this tool with tier: 'free' for now, matching every
  other tool so far — DO NOT attempt to build any auth, payment, or
  entitlement-gating logic in this build. That infrastructure doesn't exist
  in the repo yet, and inventing a partial/fake version of it here would
  create technical debt worse than just shipping this free for now. If you
  see an opportunity to add a "Pro" badge or gate, don't — just note it in
  your summary as a candidate for when real auth is built.

STEP 1 — Register:
  { slug: 'background-remover', title: 'Background Remover',
    shortDescription: 'Remove image backgrounds automatically, free, no upload required.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'format-converter', 'watermark-adder']. FAQ (3-4 Q&A):
how automatic background removal works at a high level (an AI model
identifies the main subject and separates it from the background — no need
for deep technical detail, keep it accessible), that the AI model runs
entirely in the browser (genuinely notable — most competing "free
background remover" tools upload your photo to a server; state plainly
this one downloads a model once and processes every image locally after
that, meaning your photos are never transmitted anywhere), a realistic
expectation-setting note on quality (works best on clear subject/background
separation — a person or product on a fairly distinct background; may
struggle with fine detail like wispy hair, semi-transparent objects, or
low-contrast edges — be honest rather than overselling), and a note that
the model download (mentioned prominently in the UI too, not just here)
means the first use requires a brief wait and roughly how large the
download is.

STEP 3 — BackgroundRemover.tsx:
- FileDropzone accepting one or more images.
- FIRST-USE MODEL LOADING — handle honestly and clearly:
  - Before the model is loaded, show a clear "Load AI model (~X MB)" state
    with an explicit action to start (don't auto-download tens of MB the
    instant someone lands on the page without their awareness/consent —
    this matters both for users on limited/metered connections and for
    honest resource-usage communication).
  - Once the user initiates, show real download/loading progress if the
    library exposes progress events; otherwise a clear indeterminate
    loading state with an honest "this may take a moment" message rather
    than a fake progress bar.
  - Cache the loaded model for the rest of the session (don't re-download
    for subsequent images in the same visit) — confirm the library does
    this automatically or handle it explicitly if not.
- Once the model is ready: per-file processing with a clear per-file
  progress/processing indicator (inference itself takes real time,
  typically a few seconds per image — don't leave the UI looking frozen).
- Before/after view: side-by-side or toggle/slider comparison showing
  original vs. background-removed result, so users can judge quality before
  committing to the output.
- Result is a transparent PNG by default (background removal produces an
  alpha channel) — output format should default to PNG and stay PNG unless
  the user explicitly wants a different background treatment (see next
  point), since converting to JPEG would require flattening transparency
  and defeats the tool's purpose by default.
- Optional background replacement: after removal, offer a simple option to
  composite the transparent result onto a solid color OR a second uploaded
  image, rather than leaving it transparent — genuinely useful ("remove
  background AND put it on white/a new background") and a natural
  extension of what the tool already produces; keep this optional/secondary
  to the core remove-and-download-transparent-PNG flow.
- Batch processing: process multiple uploaded files sequentially (not all
  simultaneously — ML inference is resource-intensive, run one at a time
  with a queue and progress indicator across the batch) with individual
  downloads and "download all as ZIP" (reuse the established zip utility).
- Download button, per file and batch.

STEP 4 — Performance/resource handling:
- Confirm whether @imgly/background-removal runs inference on the main
  thread or already offloads to a Web Worker internally — check the
  library's own architecture before adding a custom worker wrapper; most
  libraries in this space already handle this correctly given WASM/ML
  workloads are inherently unsuitable for blocking the main thread, but
  verify rather than assume.
- Warn (not block) if a very large image is uploaded (e.g. over 4000px on
  the longest edge) that processing may be slow or memory-intensive, and
  consider whether downscaling before inference (then upscaling the
  resulting alpha mask back to full resolution) is something the library
  handles automatically or would need explicit handling — check the
  library's own documented behavior/recommendations here rather than
  guessing, since this affects both speed and quality meaningfully.

STEP 5 — Logic separation: apps/web/app/tools/background-remover/utils/
removeBackground.ts — a thin typed wrapper around the library's API,
processImageBackground(file: File, onProgress?: (progress: number) =>
void): Promise<Blob>, isolating the library integration so the component
stays focused on UI/state.

STEP 6 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the model loading experience is honest and clear — describe
   exactly what a first-time user sees (approximate download size shown,
   real vs. indeterminate progress, whether download is user-initiated or
   automatic) since this is a meaningfully different UX pattern than any
   prior tool in the catalog and worth getting right.
2. Confirm whether @imgly/background-removal handles Web Worker offloading
   and large-image downscaling internally, or whether either needed custom
   handling — state what was actually found/verified, not assumed.
3. Test with at least one genuinely tricky image (fine detail like hair, or
   a busy/low-contrast background) and honestly describe the result quality
   — don't only test with an easy, high-contrast example that flatters the
   tool.
4. Confirm no tier-gating, auth, or payment logic was added anywhere in
   this build, per the TIER NOTE — this tool should be indistinguishable
   in structure from every other free tool in the catalog for now.
```

## Note
**Two things matter more here than in any prior Image tool**: first, the
model-download UX needs to be genuinely honest and consent-based, not a
silent multi-MB download the instant someone visits the page — this is a
meaningfully heavier resource ask than anything built so far and deserves
different treatment than a simple loading spinner. Second, quality
expectations should be set honestly in both the FAQ and by actually testing
a hard case (not just an easy one) — overselling an ML tool's accuracy
erodes trust faster than being upfront that it works best in clear-subject
cases and may struggle with fine detail.
