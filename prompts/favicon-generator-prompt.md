# Claude Code Prompt — Build Tool #31: Favicon Generator

Run after tool-shell and tools #1-30 exist. Uses packages/color-utils
(established in tool #29) only lightly if at all — mostly Canvas-based
image resizing and a ZIP export, similar shape to Image Compressor.

---

```
Build the Favicon Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/favicon-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- Check apps/web/app/tools/image-compressor/utils/ and .../zipFiles.ts —
  reuse the existing zip-export utility rather than adding a second zip
  library dependency for this tool.
- 100% client-side. Canvas API for resizing to each required favicon
  dimension; for true multi-resolution .ico file generation, check if a
  small dependency-light library exists for building genuine .ico files
  (a proper .ico is a container format, not just a renamed PNG) — if
  nothing suitable and well-maintained is available, generate a
  well-formed single-or-multi-image .ico via a minimal hand-written .ico
  binary writer (the format is simple enough — a small header plus one or
  more embedded PNG/BMP images — to implement directly without a heavy
  dependency; don't just rename a PNG to .ico, that produces a technically
  invalid file that happens to work in some but not all contexts).
- Design tokens as established.

STEP 1 — Register:
  { slug: 'favicon-generator', title: 'Favicon Generator',
    shortDescription: 'Generate favicons in every required size from one image, free.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'color-palette', 'css-gradient-generator']. FAQ
(3-4 Q&A): why multiple favicon sizes are needed (different browsers,
devices, and contexts — browser tab, bookmarks, iOS home screen, Android
home screen, PWA manifest — request different specific sizes), what files
this tool generates and what each is for (favicon.ico for legacy/broad
compatibility, various PNG sizes for modern browsers and Apple touch
icons), a brief note on the generated HTML `<link>` tags needed in the
page `<head>` to actually reference these files, and the privacy note.

STEP 3 — FaviconGenerator.tsx:
- FileDropzone accepting a source image (ideally square, at least 512x512
  recommended — show a warning, not a hard block, if the uploaded image is
  smaller than ideal or non-square, since upscaling a small image produces
  a blurry favicon and non-square images need to be handled somehow —
  offer a simple center-crop-to-square option if the source isn't square).
- Live preview grid showing the source image rendered at each target size
  side by side (16x16, 32x32, 48x48, 180x180 for Apple touch icon, 192x192
  and 512x512 for Android/PWA) so the user can see how it'll actually look
  at the smallest, most detail-losing sizes before committing — this is
  genuinely useful since a detailed logo often looks fine at 512px but
  becomes an illegible blob at 16px, and that's worth surfacing visually
  rather than only generating files blindly.
- Background option for transparent source images: since favicon.ico
  historically doesn't handle transparency consistently across all
  contexts, offer a background color picker (default white) that gets
  applied when flattening for the .ico specifically, while PNG outputs can
  keep transparency if the source has it — explain this distinction briefly
  in the UI, not just the FAQ.
- Generate button producing the full set:
  - favicon.ico (multi-resolution: 16x16, 32x32, 48x48 embedded together)
  - favicon-16x16.png, favicon-32x32.png
  - apple-touch-icon.png (180x180)
  - android-chrome-192x192.png, android-chrome-512x512.png
  - A generated site.webmanifest referencing the Android icons (minimal
    valid JSON manifest, name/short_name left as placeholder text for the
    user to edit)
- "Download all as ZIP" button (reuse image-compressor's zip utility).
- Generated HTML snippet: the exact `<link rel="icon" ...>` /
  `<link rel="apple-touch-icon" ...>` tags the user needs to paste into
  their page's `<head>`, font-mono, with a CopyButton — this closes the
  loop from "I have files" to "I know how to actually use them," which is
  where a lot of competing favicon generators leave users stranded.

STEP 4 — Logic separation: apps/web/app/tools/favicon-generator/utils/:
- generateFavicons.ts — resizeToCanvas(image, size): Promise<Blob>-style
  helper per target size, plus buildIcoFile(pngBlobs: Blob[]): Promise<Blob>
  implementing the minimal .ico binary format described in CONTEXT.
- generateManifest.ts — buildWebManifest(options): string, generating the
  site.webmanifest JSON.
- generateHtmlSnippet.ts — buildFaviconHtmlTags(): string, generating the
  copyable <link> tags.
All typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the generated .ico file is genuinely well-formed (test by
   opening it in an image viewer/browser that supports .ico, or by
   validating its binary structure against the ICO format spec) rather
   than just a PNG with an .ico extension — describe how this was verified.
2. Confirm the zip export reused image-compressor's existing utility rather
   than adding a new zip dependency.
3. Confirm the small-size preview (16x16) is rendered clearly enough in the
   UI (not just generated as a tiny, hard-to-see thumbnail) that a user can
   actually judge legibility at that size before downloading.
```

## Note
**The .ico format is the real technical risk** — it's a genuine binary
container format (able to embed multiple resolutions in one file), not just
a differently-named PNG, and a shortcut implementation that just renames a
32x32 PNG to favicon.ico will work in some browsers by accident but isn't
actually correct and can fail in stricter contexts. Worth specifically
confirming this was implemented properly rather than faked.
