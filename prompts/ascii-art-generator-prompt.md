# Claude Code Prompt — Build Tool #69: Text-to-ASCII Art Generator

Run after tool-shell and tools #1-68 exist. Closes out the Text & Writing
category batch. Fun, low-risk, purely visual novelty tool.

---

```
Build the Text-to-ASCII Art Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/ascii-art-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `figlet` npm package (the standard library for
  rendering text as ASCII banner art using FIGlet font files — install
  with `npm install figlet @types/figlet`; figlet fonts are plain-text
  data files under permissive/public-domain-style licenses commonly
  bundled with the library itself, confirm the specific fonts bundled with
  whichever npm package version is installed are appropriately licensed
  for redistribution, which is standard practice for this well-established
  library but worth a quick confirmation rather than assuming). Do not
  hand-roll ASCII font rendering — figlet's font format and rendering are
  well-established and reimplementing it would be pure wasted effort.
- Design tokens as established. Output MUST render in a monospace font
  (font-mono) — ASCII art depends entirely on consistent character width
  for correct alignment, a proportional font would completely break the
  visual result.

STEP 1 — Register:
  { slug: 'ascii-art-generator', title: 'Text to ASCII Art Generator',
    shortDescription: 'Convert text into ASCII art banners instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['word-counter', 'case-converter', 'html-entity-tool']. FAQ (3-4 Q&A):
what ASCII art text banners are and common uses (code comments, terminal
splash screens, README headers, forum signatures), a note on font/style
variety (figlet supports many distinct font styles, briefly mention this),
a practical note that ASCII art depends on monospace rendering to display
correctly (pasting into a context that doesn't use a monospace font will
break the alignment — worth stating since this trips people up when they
paste ASCII art into, say, a proportional-font email client or a chat app
that doesn't preserve whitespace), and the privacy note.

STEP 3 — AsciiArtGenerator.tsx:
- Text input (single line or short phrase — ASCII banner fonts are
  typically used for short text, a character limit warning if the input
  gets long enough that rendering becomes impractically wide, e.g. beyond
  ~20-30 characters depending on font, rather than a hard block).
- Font/style selector: a curated selection from figlet's available fonts
  (don't necessarily expose figlet's entire font library if it's very
  large — pick a well-regarded, visually distinct subset, e.g. 15-25 fonts
  spanning classic block-letter styles, slim/small styles, and a few
  playful/decorative ones) shown with the font NAME as a label; ideally
  render a small always-visible preview of each font option using the
  current input text (or a default sample if input is empty) so users can
  browse styles visually rather than guessing from font names alone.
- Live-generated ASCII art output (font-mono, in a scrollable/horizontally-
  scrollable container if the output is wider than the display area, since
  ASCII banners can be quite wide for longer input text).
- Width/wrapping option: figlet supports a max-width parameter that wraps
  or adjusts rendering — expose this as a simple control if useful, default
  to a reasonably wide value that avoids premature wrapping for typical
  short inputs.
- CopyButton on the output (this is THE core action for this tool — most
  users generate ASCII art specifically to copy and paste it elsewhere,
  make sure the copy behavior preserves exact whitespace/formatting
  correctly, not trimmed or collapsed).
- Download as .txt option.

STEP 4 — Logic separation: apps/web/app/tools/ascii-art-generator/utils/
generateAsciiArt.ts — a thin typed async wrapper around figlet:
generateAscii(text: string, font: string, options?: { width?: number }):
Promise<string>, handling figlet's callback-or-promise API appropriately
(check the installed figlet version's API shape — older versions use a
callback style, confirm whether a promise-based wrapper is needed).

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the CopyButton preserves exact ASCII art formatting when copied
   — test by generating a banner, copying it, and pasting into a plain
   text editor to confirm the alignment/whitespace is preserved exactly as
   displayed, not collapsed or trimmed.
2. Confirm which figlet font subset was chosen and that each renders
   correctly (no broken/garbled output) for a typical short text input.
3. Confirm figlet's bundled font licensing was checked and is appropriate
   for use in this product (state what was found, even if briefly).
```

## Note
This is one of the lowest-risk builds in the catalog — mostly a UI wrapper
around a mature, purpose-built library. The one thing worth actually
verifying is that copy-to-clipboard preserves exact whitespace (a common
way this specific kind of tool can subtly disappoint users if the
clipboard write path trims or normalizes whitespace somewhere along the
way), since precise formatting is the entire point of ASCII art.
