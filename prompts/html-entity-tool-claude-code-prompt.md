# Claude Code Prompt — Build Tool #19: HTML Entity Encoder / Decoder

Run this after tool-shell and tools #1-18 all exist and work. This is one of
the simplest builds in the catalog so far — a good pace-recovery tool after
JWT Decoder and Cron Builder's heavier framing/correctness requirements.

---

```
Build the HTML Entity Encoder/Decoder tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/html-entity-tool/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-18
  — check what exists before writing anything new. This tool should need
  zero new primitives.
- 100% client-side. Use the DOM itself for correct entity encoding/decoding
  (create a detached element, set/read textContent vs. innerHTML — this is
  the standard, correct, dependency-free way to do this in a browser
  environment and handles the full named-entity table plus numeric
  references correctly without needing a hand-maintained entity lookup
  table). Do not hand-roll a partial entity map (e.g. just &amp; &lt; &gt;
  &quot; &#39;) as the primary implementation — the DOM-based approach
  handles the complete HTML5 named character reference set correctly and
  isn't meaningfully more complex to implement.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Input/output panes use font-mono.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'html-entity-tool', title: 'HTML Entity Encoder & Decoder',
    shortDescription: 'Encode and decode HTML entities instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "HTML Entity Encoder & Decoder - Free Online Tool |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="HTML Entity Encoder & Decoder"
    description="Encode and decode HTML entities — entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['json-formatter', 'base64-tool', 'url-encoder-decoder']}
    faq={[...]}
  >
    <HtmlEntityTool />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what HTML entities are and why they're needed (representing
  characters that have special meaning in HTML markup, like < and &, or
  characters outside the basic ASCII range, so they display correctly
  rather than being interpreted as markup), the difference between named
  entities (&amp;, &copy;) and numeric character references (&#169;,
  &#x00A9;), a brief practical note on when this matters (e.g. safely
  displaying user-submitted text within HTML, or embedding special
  characters/symbols in a webpage), and confirmation nothing typed here is
  stored or transmitted.

STEP 3 — HtmlEntityTool.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Direction toggle: Encode / Decode.
- Two-pane layout: input (top/left) and output (bottom/right), font-mono
  both, live conversion as the user types (debounced ~150ms — this
  operation is cheap, keep it snappy).
- Encode mode options:
  - "Encode only special characters" (default — < > & " ' and similar
    HTML-significant characters) vs. "Encode all non-ASCII characters"
    (also converts accented letters, symbols, emoji, etc. to numeric
    references — useful for maximum compatibility in older/stricter
    contexts, less commonly needed but worth including as a toggle)
  - Output format for encoded entities: named where available, falling back
    to numeric (default, most human-readable) vs. always numeric (some
    users specifically want numeric references for consistency/compatibility
    reasons — make this a simple toggle, not a hidden preference)
- Decode mode: straightforward — takes text containing entities (named
  and/or numeric, decimal and hex) and outputs the decoded plain text. No
  additional options needed, decoding is unambiguous.
- CopyButton on output.
- Swap button (swaps input/output and flips encode/decode direction).
- Live preview: for encode mode specifically, show a small rendered preview
  of how the encoded output would actually display in an HTML page (i.e.
  render the encoded string via dangerouslySetInnerHTML in a sandboxed
  preview area, or more simply just decode it back for display purposes,
  to visually confirm round-trip correctness) — this is a nice sanity-check
  feature; if implementing a live rendered preview, be careful this preview
  area itself doesn't become an XSS vector if a user pastes actual HTML tags
  as input expecting them to be encoded — the preview should render the
  OUTPUT of encoding (which by definition contains no live tags anymore
  once correctly encoded), never render raw unencoded user input directly.
- Common entity reference table (collapsible section): a short list of
  frequently-needed named entities (©, ®, ™, non-breaking space, em dash,
  common accented characters, currency symbols) with their entity codes
  shown, each individually copyable — genuinely useful quick-reference
  content, not just SEO padding.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/html-entity-tool/utils/htmlEntities.ts as
pure, typed functions (no `any`):
  - encodeEntities(text: string, options: { fullNonAscii: boolean;
    format: 'named-or-numeric' | 'numeric-only' }): string — using the
    DOM-based approach described above.
  - decodeEntities(text: string): string — using the DOM-based approach.
  Since these rely on DOM APIs (document.createElement), make sure they're
  only called client-side (they will be, since this whole component is
  "use client", but note this in a comment since the util file itself isn't
  inherently client-only and shouldn't be imported into any server
  component elsewhere in the app).

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Confirm the encode/decode functions correctly round-trip a string
   containing a mix of basic special characters (<, >, &), an accented
   character (é), and an emoji — encode it, then decode the result, and
   confirm you get back the exact original string.
2. Confirm the live preview feature (if implemented) does not introduce an
   XSS/injection risk — explain specifically how raw user input is kept out
   of any dangerouslySetInnerHTML or equivalent rendering path, since this
   is the one place in an otherwise-trivial tool where a shortcut
   implementation could accidentally create a real vulnerability (ironic,
   for a tool whose whole purpose is escaping HTML safely).
3. Confirm which output format (named-vs-numeric preference) was used as
   the default and that toggling between the two encode options actually
   changes the output for a character that has both a named and numeric
   representation (e.g. © as &copy; vs. &#169;).
```

---

## Notes

- **Use the DOM, don't hand-roll an entity table** — this is explicitly
  called out because a tempting shortcut (a small hardcoded map of the ~10
  most common entities) would technically "work" for simple cases but
  silently fail on the hundreds of other named entities in the HTML5 spec.
  The DOM-based technique (set textContent, read innerHTML, and the
  reverse) is simpler to implement correctly than a hand-maintained table
  and handles the full spec for free.
- **The live preview feature is the one place a "trivial" tool could
  accidentally introduce a real vulnerability** — a tool whose entire
  purpose is escaping potentially-dangerous HTML characters would be
  ironic to also be the one tool in the catalog with an actual XSS hole, if
  the preview naively rendered raw unencoded input. Worth specifically
  confirming the data flow here rather than assuming a preview feature is
  automatically safe just because the tool's purpose is encoding.
- This is a genuinely fast, low-risk build — good to run back-to-back with
  #17 and #18 rather than needing its own dedicated review pass.
