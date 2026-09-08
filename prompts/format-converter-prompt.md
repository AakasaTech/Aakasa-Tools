# Claude Code Prompt — Build Tool #37: Image Format Converter

Run after tool-shell and tools #1-36 exist. Closes a dangling relatedTools
reference from both Image Compressor and Image Resizer, which both already
point at 'format-converter'.

---

```
Build the Image Format Converter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/format-converter/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Canvas API (drawImage + toBlob with a target MIME type)
  handles PNG/JPEG/WebP conversion natively in every modern browser — no
  library needed for these three. AVIF encoding support via Canvas
  toBlob('image/avif') is inconsistent across browsers as of now — detect
  support at runtime (attempt an AVIF toBlob call and check if it actually
  produces a valid, non-empty result, since some browsers silently fall
  back to PNG rather than erroring) and clearly disable/hide the AVIF
  output option with an explanatory note if the current browser doesn't
  support it, rather than offering an option that silently produces the
  wrong format.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'format-converter', title: 'Image Format Converter',
    shortDescription: 'Convert images between PNG, JPG, WebP, and AVIF, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'image-resizer', 'background-remover'] (check
TOOL_REGISTRY, drop unregistered — background-remover likely not built
yet). FAQ (3-4 Q&A): brief practical comparison of the formats (PNG:
lossless, supports transparency, larger files; JPEG: lossy, no
transparency, smaller files, best for photos; WebP: modern format,
supports both lossy and lossless plus transparency, generally smaller than
both PNG and JPEG at equivalent quality; AVIF: newest, typically smallest
files, but browser/tool support is less universal — mention this
explicitly), a note that converting a transparent image (PNG/WebP) to JPEG
will lose transparency (JPEG has no alpha channel — this tool should warn
about this specifically, not just mention it in the FAQ), and the privacy
note.

STEP 3 — FormatConverter.tsx:
- FileDropzone accepting multiple images (batch conversion — a natural fit
  for "convert all these screenshots to WebP" style use cases, similar
  batch pattern to Image Compressor).
- Target format selector: PNG / JPEG / WebP / AVIF (AVIF option
  dynamically disabled with a tooltip/note if runtime detection per
  CONTEXT finds it's unsupported in the current browser).
- Quality slider (shown only for lossy targets: JPEG, WebP, AVIF — hidden
  for PNG since it's lossless and quality doesn't apply the same way,
  though WebP/PNG lossless mode could be a secondary consideration — keep
  this simple, standard lossy quality slider for the three lossy-capable
  formats is sufficient scope).
- Transparency handling: if any source file has an alpha channel AND the
  target format is JPEG (no alpha support), show a clear per-file or
  batch-level warning ("3 of 5 images have transparency, which JPEG
  doesn't support — transparent areas will become white" or similar) with
  a background-color picker for what to flatten transparent areas to
  (default white) — don't silently flatten to an arbitrary/unexpected
  color without the user choosing it.
- Per-file list showing: thumbnail, original format/size, target
  format/estimated or actual output size once converted, individual
  download button.
- "Convert all" batch action plus "Download all as ZIP" (reuse the zip
  utility established in Image Compressor).
- Before/after size comparison summary for the batch, consistent with
  Image Compressor's aggregate-savings pattern (though conversion may
  increase OR decrease size depending on the format pair — frame the
  summary neutrally, e.g. "Total output size: X" rather than assuming
  "savings" the way the compressor tool correctly could).

STEP 4 — Logic separation: apps/web/app/tools/format-converter/utils/:
- convertFormat.ts — convertImageFormat(file: File, targetFormat: string,
  quality: number, backgroundColor?: string): Promise<Blob>, handling the
  Canvas-based conversion and transparency-flattening logic.
- detectAvifSupport.ts — a small async function that actually attempts an
  AVIF encode via Canvas and confirms a valid result, rather than only
  checking a static browser/feature-detection string (some environments
  report support inconsistently — an actual encode-and-check is more
  reliable than trusting a capabilities flag alone).
Both typed, no `any`.

STEP 5 — Verify: registry entry resolves, and confirm Image Compressor and
Image Resizer's existing relatedTools references to 'format-converter' now
resolve.

After building, tell me:
1. Confirm the AVIF support detection actually works — describe what
   happens in a browser that doesn't support AVIF encoding (does the
   option get correctly disabled, or does it silently produce a
   mislabeled file?) versus one that does.
2. Confirm the transparency-to-JPEG warning and background-color flattening
   actually works correctly — test converting a transparent PNG to JPEG
   and confirm the output has the chosen background color where
   transparency was, not black or an unexpected default.
3. Confirm the zip export was reused from Image Compressor rather than
   reimplemented.
```

## Note
**AVIF support detection is the real technical risk** — browser support for
AVIF *encoding* (not just decoding/viewing) via Canvas is genuinely
inconsistent, and some browsers may silently produce a different format or
an empty/invalid blob rather than throwing a clear error when asked to
encode AVIF unsupported. A static feature-detection check isn't reliable
enough here; an actual attempt-and-verify approach is worth the extra
implementation effort to avoid silently handing users a mislabeled or
broken file.
