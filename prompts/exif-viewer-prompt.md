# Claude Code Prompt — Build Tool #38: EXIF Data Viewer & Remover

Run after tool-shell and tools #1-37 exist. This tool has a real, meaningful
privacy angle — EXIF data can contain GPS coordinates of where a photo was
taken, and "strip this before I post it" is a genuine, common need.

---

```
Build the EXIF Data Viewer & Remover for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/exif-viewer/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `exifr` npm package (a well-maintained, small,
  fast EXIF/IPTC/XMP metadata parser for JS — install with
  `npm install exifr`) for reading metadata. For REMOVING metadata,
  re-encoding the image via Canvas (draw to canvas, export via toBlob) is
  the simplest reliable method since Canvas re-encoding does not carry
  metadata through by default — confirm this is actually true for the
  browser/format combination in testing (see Step 5) rather than assuming
  it, since a "strip metadata" feature that doesn't actually strip
  everything would be a meaningful correctness/trust failure for a
  privacy-focused tool.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'exif-viewer', title: 'EXIF Data Viewer & Remover',
    shortDescription: 'View and remove hidden metadata (including GPS location) from photos, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'format-converter', 'image-resizer']. FAQ (3-4 Q&A):
what EXIF data is and what it commonly contains (camera model/settings,
timestamp, and — significantly — GPS coordinates of where the photo was
taken, if location services were enabled on the capturing device), why
someone might want to remove it before sharing a photo publicly (privacy —
avoid inadvertently revealing your home address or location history via
photo metadata, a genuinely real and common concern, not a hypothetical
one), confirmation that most social media platforms already strip EXIF
data on upload but that direct file sharing (email, messaging apps, direct
downloads) typically does NOT strip it, so this matters most for those
direct-sharing contexts, and the privacy note (with extra emphasis here —
this tool processing potentially sensitive location data entirely
client-side, with nothing uploaded, is a genuinely meaningful property
worth stating clearly and prominently, not just as one FAQ line).

STEP 3 — ExifViewer.tsx:
- FileDropzone accepting one or more images (JPEG is the primary format
  that commonly carries EXIF; also support TIFF if easy, PNG/WebP EXIF
  support is less universal but exifr handles what's there if present).
- Per-file metadata display, organized into sections:
  - Camera/Device info (make, model, lens, if present)
  - Capture settings (aperture, shutter speed, ISO, focal length, if
    present)
  - Date/time taken
  - GPS location — IF PRESENT, this is the highest-priority thing to
    surface clearly: show the coordinates AND render them on a simple
    embedded map preview if reasonably easy to add (a static map tile
    image or a simple lightweight map library — check what's already
    available in the environment/dependencies before adding a new mapping
    library just for this; if a full map is too much scope, at minimum
    show the raw coordinates very prominently with a "this reveals where
    this photo was taken" plain-language callout, since a user might not
    otherwise realize what a lat/long pair means practically)
  - Software/editing history (if present)
  - Full raw metadata dump (collapsible, for users who want to see
    absolutely everything, including less common/obscure tags)
- Clear "No EXIF data found" state when a file has none (common for
  screenshots, already-stripped images, or certain export pipelines) —
  don't show empty sections, show one clear message.
- "Remove all metadata" button — re-encodes the image via Canvas (stripping
  EXIF/IPTC/XMP as a side effect of the re-encode) and offers the cleaned
  file for download. Preserve visual quality/dimensions exactly (this is a
  metadata-strip operation, not a resize or recompress — use maximum
  quality on re-encode, and keep original dimensions untouched).
- Batch support: if multiple files are uploaded, allow "strip all" as one
  action plus "download all as ZIP" (reuse the established zip utility).
- Before/after size note (metadata removal typically reduces file size
  slightly, mention this as a secondary benefit, not the main point of the
  tool).
- CopyButton for the raw metadata JSON dump (useful for anyone doing their
  own analysis/documentation).

STEP 4 — Logic separation: apps/web/app/tools/exif-viewer/utils/:
- readExifData.ts — readMetadata(file: File): Promise<ParsedExifData |
  null>, wrapping exifr with a typed, UI-friendly output shape grouping
  fields into the sections described above.
- stripMetadata.ts — stripImageMetadata(file: File): Promise<Blob>, the
  Canvas re-encode approach.
Both typed, no `any` (exifr's raw output is loosely typed — narrow it at
the boundary in readExifData.ts).

STEP 5 — Verify: registry entry resolves. CRITICALLY, verify the "remove
metadata" feature actually works: take a real photo with GPS EXIF data
(e.g. a phone photo taken with location services on, or a known test image
with embedded GPS coordinates), run it through both the viewer (confirm
coordinates are correctly displayed) AND the stripper, then re-run the
STRIPPED output back through the viewer (or exifr directly) to confirm
zero EXIF data remains, especially GPS — this round-trip verification is
essential for a tool whose entire value proposition is "this actually
removes your location data," not just visually assumed to work.

After building, tell me:
1. State explicitly whether the round-trip verification in Step 5 was
   performed and confirm the stripped output genuinely contains zero EXIF
   data (not just visually-similar/reduced data) — this is the single most
   important correctness check for this entire tool.
2. Confirm GPS coordinates, when present, are displayed clearly and
   prominently (describe exactly where/how in the UI) rather than buried
   in a generic metadata list a user might skim past without realizing
   their location was embedded in the file.
3. Confirm the Canvas re-encode preserves visual quality and exact original
   dimensions (test with a photo, compare stripped output dimensions to
   original) rather than accidentally resizing or degrading quality as a
   side effect of the strip operation.
```

## Note
**This tool's entire reason to exist rests on the "remove" feature actually
working completely** — a metadata remover that leaves GPS coordinates
behind due to an incomplete strip implementation isn't just a bug, it's a
tool that gives users false confidence about their privacy while actually
failing at the one thing they came to do. The round-trip verification
(strip, then re-check the stripped file for remaining metadata) in Step 5
is non-negotiable, not a nice-to-have test — treat Claude Code's confirmation
of this specifically as the primary acceptance criterion for this build,
more important than any UI polish.
