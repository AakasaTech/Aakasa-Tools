# Claude Code Prompt — Build Tool #46: GIF Maker from Images

Run after tool-shell and tools #1-45 exist. Introduces a real client-side
encoding performance consideration — GIF encoding is CPU-intensive and
belongs in a Web Worker from the start, not as an afterthought.

---

```
Build the GIF Maker for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/gif-maker/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `gif.js` npm package (the standard client-side
  GIF encoder, built with Web Worker support natively — install with
  `npm install gif.js` or check for a maintained fork if the original
  package shows signs of being unmaintained; `gifenc` is a modern, faster,
  actively-maintained alternative worth checking too — pick whichever is
  better-maintained at build time and note the choice). GIF encoding is
  genuinely CPU-intensive (palette quantization across many frames) —
  ensure whichever library is chosen actually runs its encoding work in a
  Web Worker (most GIF encoding libraries in this space are built with this
  in mind, but confirm rather than assume, since blocking the main thread
  for GIF encoding of even a modest number of frames would make the tab
  visibly freeze).
- Design tokens as established.

STEP 1 — Register:
  { slug: 'gif-maker', title: 'GIF Maker',
    shortDescription: 'Create animated GIFs from a series of images, free.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['image-compressor', 'image-resizer', 'format-converter']. FAQ (3-4 Q&A):
how this tool works (upload a sequence of images, set the frame order and
timing, export as an animated GIF), practical guidance on GIF file size
(more frames, larger dimensions, and more colors all increase file size
significantly — GIF is not an efficient format by modern standards, brief
honest note that very large/long GIFs may produce large files, and that
this is an inherent property of the GIF format, not a limitation of this
tool specifically), a note on GIF's 256-color-per-frame palette limitation
(images with smooth gradients or photos may show visible banding/dithering
in GIF output — this is expected GIF behavior, not a bug), and the privacy
note.

STEP 3 — GifMaker.tsx:
- FileDropzone accepting multiple images (the frame sequence).
- Frame list/timeline: thumbnails of each uploaded image in order,
  drag-to-reorder (the frame sequence is core to what makes this an
  animation, reordering needs to be a real, easy interaction, not an
  afterthought), with a delete-frame button per thumbnail and an "add more
  frames" option.
- Per-frame duration control: either a global duration applied to all
  frames (simpler default, e.g. "100ms per frame") OR per-frame individual
  duration override (a small numeric input per thumbnail for users who
  want variable timing, e.g. holding on the last frame longer) — support
  both, global as the default/primary control with per-frame override
  available for users who want it.
- Output dimension control: since input images may vary in size, all
  frames need to be normalized to one consistent output dimension for a
  valid GIF — options: use the first frame's dimensions, use the largest
  frame's dimensions (scaling others up), or let the user specify explicit
  dimensions, with each source frame scaled/letterboxed to fit (choose a
  sensible default — "use the first frame's dimensions, scale/crop others
  to match" is a reasonable default — and expose the choice rather than
  hiding it, since mismatched aspect ratios need SOME resolution strategy
  and the user should know which one is being applied).
- Loop setting: loop forever (default, standard GIF behavior) vs. play
  once.
- Live preview: an actual animated preview of the GIF-in-progress (using
  the same frame/timing data, rendered via a simple canvas animation loop
  or by generating a low-res preview GIF, whichever is more practical) so
  users can check the result before committing to the full encode.
- Quality/color settings: number of colors in the palette (GIF max 256,
  offer a slider or preset options like 256/128/64 — fewer colors = smaller
  file, more banding), dithering toggle (can reduce visible banding on
  gradient-heavy source images at the cost of a slightly noisier look —
  brief explanation of the tradeoff).
- Encode/Generate button — triggers the actual GIF encoding (this is the
  potentially slow, worker-based operation), with a clear progress
  indicator (frame-by-frame or percentage progress if the library exposes
  it) since this can take real time for many/large frames.
- Download button once encoding completes.
- File size estimate/actual size shown once generated.

STEP 4 — Performance:
- Confirm the encoding library's Web Worker usage is actually active (per
  CONTEXT) — this is not optional for this tool, unlike some earlier
  "add a worker if testing shows it's needed" guidance; GIF encoding is
  reliably CPU-intensive enough that main-thread encoding would be a poor
  experience even for a modest frame count.
- Warn (not block) on a very large combined frame set (e.g. more than 50
  frames or very large per-frame dimensions) that encoding may take a
  while.

STEP 5 — Logic separation: apps/web/app/tools/gif-maker/utils/:
- normalizeFrames.ts — pure-ish function resizing/fitting an array of
  source images to a consistent target dimension per the chosen strategy.
- encodeGif.ts — a thin typed wrapper around the chosen encoding library:
  encodeGifFromFrames(frames: NormalizedFrame[], options: GifEncodeOptions,
  onProgress?: (percent: number) => void): Promise<Blob>.

STEP 6 — Verify: registry entry resolves.

After building, tell me:
1. Confirm which GIF encoding library was used (gif.js vs. gifenc vs.
   other) and why, and confirm its Web Worker usage was verified (not
   assumed) — describe how this was checked.
2. Confirm drag-to-reorder frames actually works correctly and that the
   generated GIF's frame order matches the reordered sequence (not the
   original upload order) — test by uploading 3 frames, reordering them,
   and confirming the exported GIF plays in the reordered sequence.
3. Confirm the dimension-normalization strategy chosen as default and
   confirm mismatched-aspect-ratio source frames are handled visibly
   correctly (not stretched/distorted unexpectedly) in the output.
```

## Note
**Web Worker usage is non-negotiable for this specific tool**, unlike the
more conditional "add a worker if testing shows it's needed" guidance given
to earlier tools — GIF encoding's palette quantization across multiple
frames is reliably CPU-intensive, and this needs to be confirmed as actually
implemented (most purpose-built GIF libraries handle this internally, but
it's worth explicit verification) rather than assumed to be fine because it
worked in a quick 2-3-frame test during development.
