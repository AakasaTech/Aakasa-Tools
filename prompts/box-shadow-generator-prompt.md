# Claude Code Prompt — Build Tool #32: CSS Box-Shadow Generator

Run after tool-shell and tools #1-31 exist. Simple, visual, low-risk build
— similar shape to CSS Gradient Generator but smaller in scope.

---

```
Build the CSS Box-Shadow Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/box-shadow-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- Import color utilities from packages/color-utils (established in tool
  #29) for the shadow color picker — do not reimplement hex/RGB conversion.
- 100% client-side, pure CSS string generation.
- Design tokens as established. Large, prominent live preview area (a
  sample card/box showing the actual shadow effect), generated CSS in
  font-mono below/beside it.

STEP 1 — Register:
  { slug: 'box-shadow-generator', title: 'CSS Box-Shadow Generator',
    shortDescription: 'Design and export CSS box-shadows with a live visual editor.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['css-gradient-generator', 'border-radius-generator', 'color-palette']
(check TOOL_REGISTRY, drop unregistered slugs — border-radius-generator is
likely not built yet). FAQ (3-4 Q&A): what each box-shadow parameter
controls (offset-x, offset-y, blur radius, spread radius, color), the
difference between outer shadows (default) and inset shadows, a note that
multiple shadows can be layered/comma-separated for more complex effects
(and that this tool supports building several stacked shadows), and the
privacy note.

STEP 3 — BoxShadowGenerator.tsx:
- Live preview: a sample box/card on a neutral background, showing the
  actual rendered shadow, updating in real time.
- Per-shadow-layer controls (support multiple layers, since real-world
  polished shadows are very often 2-3 layered shadows rather than one):
  - Offset X / Offset Y (sliders + numeric input, can be negative)
  - Blur radius (slider + numeric input, non-negative)
  - Spread radius (slider + numeric input, can be negative)
  - Color picker with alpha/opacity control (shadows are almost always
    semi-transparent — the color picker needs an alpha channel, not just
    RGB/hex; use an rgba() or a hex-with-alpha representation)
  - Inset toggle (outer vs. inner shadow)
  - Remove-this-layer button
- "Add another shadow layer" button — each layer gets its own control set
  as above, all layers composited together in the live preview and combined
  into a single comma-separated box-shadow CSS value.
- Layer reordering (simple up/down buttons per layer, or drag-to-reorder if
  not meaningfully more effort — layer order affects visual stacking).
- Preset shadow styles (a small gallery — e.g. "Subtle", "Soft", "Sharp",
  "Elevated card", "Glow", "Long shadow" — each loading a sensible
  pre-configured layer set) so users have a reasonable starting point
  rather than tuning five numbers from a flat default.
- Generated CSS output (font-mono): the complete `box-shadow: ...;`
  declaration, correctly comma-separating multiple layers.
- CopyButton on the CSS output.
- Preview background toggle (light/dark sample background) since shadow
  visibility and "correctness" of the look depends heavily on what it's
  shown against — letting users check both is genuinely useful, not just
  cosmetic.

STEP 4 — Logic separation: apps/web/app/tools/box-shadow-generator/utils/
buildBoxShadow.ts — buildBoxShadowCss(layers: ShadowLayer[]): string,
correctly formatting and comma-joining multiple shadow layers per CSS
syntax (inset keyword position, correct value ordering: offset-x offset-y
blur spread color). Pure, typed, no `any`. Import color formatting from
packages/color-utils where applicable.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm generated CSS with 2+ layers is valid — test by pasting the
   actual output into a simple test element and confirming it renders as
   expected in a browser, not just that the string is well-formed-looking.
2. Confirm the alpha/opacity control on shadow color actually affects the
   rendered preview (test with a low-alpha and high-alpha value and
   describe the visible difference) since this is easy to accidentally
   omit if the color picker component wasn't built with alpha in mind from
   the start.
```

## Note
**Alpha/opacity on the shadow color is the one detail worth double-
checking** — most color pickers (including the one likely reused from
earlier tools) default to opaque RGB/hex without an alpha channel, but
shadows look wrong/too harsh without transparency, so this tool specifically
needs that capability even if it wasn't needed elsewhere in the toolbox so
far.
