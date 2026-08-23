# Claude Code Prompt — Build Tool #5: Base64 Encoder/Decoder

Run this after packages/tool-shell, JSON Formatter (#1), Password Generator
(#2), UUID/Hash Generator (#3), and Word Counter (#4) all exist and work.

---

```
Build the Base64 Encoder/Decoder tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/base64-tool/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone (from UUID/Hash Generator
  if built there), and other primitives from tools #1-4 — check what exists
  before writing anything new.
- 100% client-side. Use native browser APIs (btoa/atob for text, FileReader +
  btoa for files, with proper UTF-8 handling — see Step 3 note on the
  btoa/UTF-8 pitfall) — no external base64 libraries needed.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Input/output areas use font-mono
  per the cross-tool convention.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'base64-tool', title: 'Base64 Encoder / Decoder',
    shortDescription: 'Encode and decode Base64 text, files, and images instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Base64 Encoder & Decoder - Free Online Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Base64 Encoder / Decoder"
    description="Encode and decode Base64 — text, files, or images — entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['json-formatter', 'uuid-hash-generator', 'url-encoder']}
    faq={[...]}
  >
    <Base64Tool />
  </ToolShell>
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what Base64 is and why it's used (embedding binary in text formats —
  JSON, URLs, email, data URIs), the common mistake of assuming Base64 is
  encryption (it's not — explicitly say encoding ≠ encryption, Base64 is
  trivially reversible and provides no confidentiality), how to generate a
  data URI for an image, and confirmation nothing uploaded here is stored or
  transmitted.

STEP 3 — Base64Tool.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI. Three modes,
as tabs:

  TAB A — Text:
  - Two-pane layout: plain text input (left/top), Base64 output (right/bottom),
    both font-mono, single column on mobile.
  - Encode/Decode mode toggle (or auto-detect direction based on which pane
    the user typed in — auto-detect is nicer UX if straightforward, but a
    manual toggle is fine and more predictable; your call).
  - IMPORTANT: plain btoa()/atob() break on non-ASCII text (emoji, accented
    characters, etc.) because they only handle Latin1. Use the proper UTF-8
    -safe pattern (encode via TextEncoder to bytes, then convert bytes to
    Base64, and the reverse for decode) so the tool doesn't silently mangle
    non-English input. Put this in the utils file, not inline.
  - On decode: if the input isn't valid Base64, show a clear inline error
    ("Invalid Base64 string") rather than throwing or showing garbled output.
  - CopyButton on the output.
  - Swap button to flip input/output panes (quick re-encode of a decode
    result, or vice versa).

  TAB B — File:
  - FileDropzone (reuse from packages/ui if it exists) — drag/drop or click
    to select any file.
  - Encodes the file to a Base64 string via FileReader, shown in a read-only
    font-mono output area.
  - Show file name, size, and detected MIME type once selected.
  - Max size warning/soft limit (e.g. 25MB) since very large files produce
    very large Base64 strings that can make the textarea sluggish — for
    files above this, still allow it but show a performance warning rather
    than hard-blocking.
  - CopyButton on the output, plus a "Download as .txt" button for cases
    where the encoded string is too large to comfortably copy/paste.

  TAB C — Image → Data URI:
  - Same as Tab B but specifically framed for images: FileDropzone accepting
    image/* only, and once encoded, wrap the result as a proper data URI
    (`data:image/png;base64,...`) rather than raw Base64.
  - Show a live preview of the image (using the generated data URI as the
    <img> src — nice way to visually confirm the round-trip worked).
  - CopyButton on the full data URI string.
  - Small note in the UI: data URIs are best for small images (icons,
    small illustrations) since large embedded images bloat HTML/CSS file
    size — this is genuinely useful guidance for the audience using this tool.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/base64-tool/utils/base64.ts as pure, typed
functions (no `any`):
  - encodeText(input: string): string       // UTF-8 safe
  - decodeText(input: string): string       // throws a typed error on invalid input, caught in the component
  - encodeFile(file: File): Promise<string> // returns raw base64, no data URI prefix
  - fileToDataUri(file: File): Promise<string> // returns full data:mime;base64,... string
Pure, testable, and reusable if a future tool needs Base64 handling (e.g. a
JWT decoder, which is Base64Url under the hood, could import encodeText/
decodeText's byte-handling logic).

STEP 5 — Performance:
For files above ~10MB, do the FileReader read + encoding off the main thread
via a Web Worker at
apps/web/app/tools/base64-tool/workers/encode.worker.ts, so a large file
doesn't freeze the tab. Text-mode encode/decode never needs a worker — it's
effectively instant at any reasonable textarea length.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Whether FileDropzone was reused as-is from an earlier tool or needed
   changes — and if changes were needed, what was missing from the original
   so it can be made properly generic now rather than tool #6 needing the
   same fix again.
2. Confirm the UTF-8-safe encode/decode path was actually used (test mentally
   with an emoji or accented character) rather than raw btoa/atob, since the
   naive version will look correct for plain ASCII test input and only fail
   on real-world text.
```

---

## Notes

- **The btoa/UTF-8 pitfall is the main risk here** — `btoa()` on its own
  throws or corrupts output on any character outside Latin1. It's an easy
  thing for a fast implementation to get "working" on obvious test cases
  (plain English words) while silently failing on real content. Worth
  testing this one yourself with an emoji before considering it done.
- **The encoding ≠ encryption note in the FAQ isn't filler** — Base64 tools
  attract users who mistakenly think encoding hides data. Stating this
  plainly is a small trust-building/liability-reducing detail worth keeping.
- This is your second tool using FileDropzone (after UUID/Hash Generator's
  optional file-hashing feature) — the "what needed to change" question in
  the closing report is meant to catch drift before more file-handling tools
  (image compressor, background remover) build on top of an inconsistent API.
