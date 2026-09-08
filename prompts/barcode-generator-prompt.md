# Claude Code Prompt — Build Tool #44: Barcode Generator

Run after tool-shell and tools #1-43 exist. Pairs naturally with QR Code
Generator (#13) — similar shape, different underlying encoding library and
format constraints.

---

```
Build the Barcode Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/barcode-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `jsbarcode` npm package (well-established,
  supports all common barcode symbologies, renders to Canvas or SVG —
  install with `npm install jsbarcode`). Do not hand-roll barcode encoding
  — symbologies like Code 128, EAN-13, and UPC have real checksum/encoding
  rules (e.g. EAN-13's check digit algorithm) that are easy to get subtly
  wrong.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'barcode-generator', title: 'Barcode Generator',
    shortDescription: 'Generate barcodes in multiple formats — Code 128, EAN, UPC, and more.',
    category: 'seo-marketing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['qr-code-generator', 'utm-link-builder', 'meta-tag-previewer']. FAQ
(3-4 Q&A): what a barcode encodes versus a QR code (barcodes are typically
1D and encode a shorter numeric/alphanumeric string, commonly used for
retail products, inventory, and shipping — QR codes are 2D and can hold
much more data, including URLs), a brief explanation of the most common
formats supported (CODE128 for general alphanumeric use, EAN-13/UPC-A for
retail products which have specific check-digit and length requirements),
what a check digit is and why some formats validate/require one (brief,
plain explanation), and the privacy note.

STEP 3 — BarcodeGenerator.tsx:
- Format selector: CODE128, CODE39, EAN-13, EAN-8, UPC-A, ITF-14 (match
  whatever jsbarcode actually supports — check its docs for the exact
  supported format list rather than assuming, similar to the dialect-
  verification note from SQL Formatter's build).
- Value input (text/numeric depending on format), with format-specific
  validation and guidance shown inline:
  - EAN-13/UPC-A/EAN-8 specifically require an exact digit count and have
    a computed check digit — validate length in real time and show a clear
    error if the input doesn't match the required length for the selected
    format (e.g. "EAN-13 requires exactly 12 or 13 digits" — clarify
    whether the user needs to supply the check digit themselves or if it's
    auto-computed, matching jsbarcode's actual behavior here, and state
    that clearly in the UI rather than leaving it ambiguous)
  - CODE128/CODE39 are more flexible (alphanumeric, no fixed length) — no
    special length validation needed beyond what the format's character
    set allows.
- Live preview, regenerating as the value/format changes (debounced
  ~200ms).
- Display options: show/hide the human-readable text below the barcode
  (default: show, this is standard barcode convention), bar width/height,
  margin.
- Export: Download as PNG, Download as SVG (SVG matters for print-quality
  output at any scale, same reasoning as QR Code Generator's SVG export).
- CopyButton to copy the barcode image to clipboard (reuse existing
  Clipboard API implementation if factored generically from QR Code
  Generator).
- Sample value button per format (a valid example value for whichever
  format is currently selected, so first-time users see a working result
  immediately rather than an error state from an empty/invalid input).
- Batch generation (optional but valuable for a business/inventory use
  case): a textarea accepting multiple values (one per line), generating a
  barcode per line, with a "download all as ZIP" option (reuse established
  zip utility) — genuinely useful for anyone generating barcodes for a
  product catalog rather than one at a time.

STEP 4 — Logic separation: apps/web/app/tools/barcode-generator/utils/
generateBarcode.ts — a thin typed wrapper around jsbarcode:
generateBarcodeDataUrl(value: string, format: string, options): { dataUrl:
string; error?: string } and generateBarcodeSvg(...) similarly, catching
and surfacing jsbarcode's validation errors (it throws on invalid input for
strict formats like EAN-13) with clear messages rather than letting an
exception propagate uncaught.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the exact list of barcode formats jsbarcode actually supports in
   the installed version, and confirm the format selector matches that list
   exactly (don't offer a format the library doesn't support).
2. Confirm EAN-13/UPC-A check-digit handling specifically — test with a
   12-digit value (missing the check digit) and confirm whether jsbarcode
   auto-computes and appends it, or requires the full 13 digits including
   a correct check digit supplied by the user — state which, and make sure
   the UI's guidance text matches the actual behavior.
3. Confirm the batch generation feature correctly handles an invalid value
   partway through a multi-line batch (e.g. line 3 of 5 is invalid for the
   selected format) — it should report which specific line failed rather
   than failing the whole batch silently or crashing.
```

## Note
**EAN-13/UPC-A's check-digit behavior is the one detail worth verifying
precisely rather than assuming** — these formats have a specific,
standardized check-digit algorithm, and whether jsbarcode auto-computes it
from a 12-digit input or requires the full checksum-validated 13-digit
value supplied by the user is a real behavioral detail that affects what
the UI should tell users to enter. Getting the UI guidance text wrong here
(e.g. telling users to supply 13 digits when the library actually expects
12 and computes the 13th) would produce a confusing, broken-feeling
experience even though the underlying library is correct.
