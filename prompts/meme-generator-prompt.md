# Claude Code Prompt — Build Tool #40: Meme Generator

Run after tool-shell and tools #1-39 exist. Closes out this batch. Shares
Canvas text-rendering techniques with Watermark Adder directly — reuse
where sensible.

---

```
Build the Meme Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/meme-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- Check apps/web/app/tools/watermark-adder/utils/ for any reusable
  Canvas text-rendering helpers (outlined/stroked text rendering
  specifically — classic meme text style uses a bold font with a thick
  white-fill-black-stroke treatment, which is a similar text+outline
  compositing operation to what Watermark Adder already implements).
- 100% client-side, Canvas API — no library needed.
- Design tokens as established. The meme editor's own text controls can use
  the toolbox's normal UI styling; the actual meme canvas/preview should
  render the classic Impact-style meme font treatment regardless of the
  toolbox's own design tokens, since that's a genre convention users expect.

STEP 1 — Register:
  { slug: 'meme-generator', title: 'Meme Generator',
    shortDescription: 'Create memes with custom text, free, no watermark, no signup.',
    category: 'image', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['watermark-adder', 'image-resizer', 'format-converter']. FAQ (3-4 Q&A):
how the tool works (upload or pick a template, add top/bottom or custom
text boxes, download), a brief, careful note on copyright regarding meme
TEMPLATES specifically — see the critical content note below — and the
privacy note (uploaded images processed entirely client-side).

CRITICAL CONTENT NOTE — READ BEFORE BUILDING:
Do NOT include a built-in library/gallery of popular pre-existing meme
template IMAGES (e.g. well-known reaction image templates, movie/TV
screenshots, celebrity photos commonly used as meme templates). Most of
these are copyrighted images (film stills, photos of real identifiable
people, etc.) and bundling them into the toolbox — even as "just templates
everyone uses" — creates real copyright and right-of-publicity exposure
that isn't worth taking on, especially for a tool meant to be a genuine,
durable part of your product catalog rather than a quick prototype. This
tool should be BYO-image only (the user uploads their own base image) with
purely original, generic placeholder shapes/colors offered as non-
copyrighted starting canvases if you want to offer any built-in starting
point at all (e.g. a plain colored background, not a recognizable meme
template). If asked to add a "trending templates" or "popular templates"
gallery in a future iteration, that would need real licensing/sourcing
diligence — out of scope for this build, and worth flagging back to me
explicitly if you're tempted to include one to "make the tool more
useful," rather than silently including copyrighted reference images.

STEP 3 — MemeGenerator.tsx:
- FileDropzone accepting a base image (the user's own upload — per the
  critical note, no bundled template gallery).
- Text boxes: start with the classic top-text/bottom-text pair pre-
  positioned, but allow adding additional freely-positioned text boxes
  (click-to-add, drag-to-reposition) beyond just the classic two, since
  many memes today use more flexible text placement than the classic
  top/bottom-only format.
- Per-text-box controls: text content, font size (auto-fit-to-width option
  as the classic behavior — text scales down to fit the image width rather
  than overflowing, this is expected meme-generator behavior), font family
  (default to a bold sans-serif; Impact is the traditional meme font but
  may not be reliably available as a system/web font — use a suitable free
  alternative bold condensed sans-serif, e.g. from the curated set in Font
  Pairing Previewer if built, or a safe web-available bold sans fallback),
  text color (default white), outline/stroke color and width (default
  black, thick enough to read clearly against varied backgrounds — this is
  the signature meme-text look, reuse the outlined-text rendering approach
  from Watermark Adder if factored generically), and text alignment.
- Drag-to-reposition each text box directly on the canvas preview (not just
  numeric x/y inputs — the direct-manipulation interaction is core to how
  people expect to use a meme generator).
- Delete button per text box.
- Live canvas preview showing the composited result.
- Download button (PNG, since memes are typically shared as PNG for crisp
  text rendering — JPEG's lossy compression tends to visibly degrade sharp
  text edges).
- "Copy to clipboard" button (reuse existing Clipboard API image-write
  implementation if factored generically from an earlier tool).

STEP 4 — Logic separation: apps/web/app/tools/meme-generator/utils/
renderMeme.ts — renderMemeToCanvas(canvas, baseImage, textBoxes:
TextBoxConfig[]): void, handling the auto-fit-text-to-width sizing logic
and outlined text rendering (reusing/extracting the shared outline-text
helper from Watermark Adder if that refactor is straightforward — if not
straightforward, implement independently here rather than forcing an
awkward shared abstraction, and note this in your summary). Pure-ish
canvas-drawing function, typed, no `any`.

STEP 5 — Verify: registry entry resolves. Explicitly confirm no bundled
meme template images were added anywhere in this build — check the
final component/assets for any embedded/bundled image files beyond
whatever this tool's own UI chrome needs (icons, etc.) — this tool should
ship with zero example meme images included.

After building, tell me:
1. Confirm explicitly: no copyrighted or recognizable meme template images
   were bundled into this build — state this plainly, don't just assume it
   wasn't done, actually check the final file list for any added image
   assets beyond UI icons.
2. Confirm the auto-fit-text-to-width behavior works correctly for both a
   very short text string and a very long one on the same image (short
   text should render at a reasonable default size, not shrink to fit as
   if it were long; long text should shrink to avoid overflowing the image
   width).
3. Confirm whether Watermark Adder's outlined-text rendering logic was
   successfully reused here, or independently reimplemented — either is
   fine, just report which.
```

## Note
**The "no bundled copyrighted templates" instruction is the one thing worth
double-checking most carefully in this build** — it's a very natural,
tempting addition for an AI implementation to make unprompted ("a meme
generator should probably have some popular templates to start with"), and
it's exactly the kind of well-intentioned scope addition that creates real
legal exposure for a product you're planning to operate long-term under
your own brand. The explicit verification step in Step 5 exists specifically
to catch this if it happens despite the instruction, not because it's
expected to happen — but worth treating as a real gate before shipping this
tool live regardless of what Claude Code reports.
