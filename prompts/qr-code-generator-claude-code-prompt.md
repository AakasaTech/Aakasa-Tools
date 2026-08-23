# Claude Code Prompt — Build Tool #13: QR Code Generator

Run this after tool-shell and tools #1-12 all exist and work. This closes
the QR-generation gap flagged in the UTM Link Builder build — once this
ships, go back and confirm UTM Link Builder's QR toggle imports this tool's
real implementation instead of its own throwaway one.

---

```
Build the QR Code Generator tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/qr-code-generator/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone, and other primitives
  from tools #1-12 — check what exists before writing anything new.
- IMPORTANT: check apps/web/app/tools/utm-link-builder/ FIRST for any
  QR-generation utility that may have been built there as a stopgap. If one
  exists, this tool's implementation should become the canonical one, and
  you should update UTM Link Builder to import from here instead of its own
  copy — flag this explicitly, don't leave two QR implementations in the
  codebase after this build.
- 100% client-side. Use the `qrcode` npm package (a well-established, small,
  dependency-light library for QR generation via Canvas/SVG — install with
  `npm install qrcode @types/qrcode` if not already present) rather than
  hand-rolling QR encoding, which involves genuinely complex error-
  correction and data-encoding logic not worth reimplementing.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. The QR code preview itself should
  render on a clean neutral background regardless of dark/light mode (QR
  codes need real contrast to scan correctly — don't let dark mode invert
  or tint the actual QR code image, only the surrounding UI chrome).

STEP 1 — Move/extract shared logic (if applicable):
If UTM Link Builder has an existing QR utility, move its core generation
function into apps/web/app/tools/qr-code-generator/utils/generateQr.ts as
the canonical implementation, then update UTM Link Builder's import to point
here. If no such utility exists yet, just build fresh in this tool's utils
folder — no migration needed.

STEP 2 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'qr-code-generator', title: 'QR Code Generator',
    shortDescription: 'Generate QR codes for URLs, text, Wi-Fi, and more, instantly.',
    category: 'seo-marketing', tier: 'free' }

STEP 3 — page.tsx (server component):
- Metadata: title "QR Code Generator - Free Online Tool | Aakasa Toolbox",
  description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="QR Code Generator"
    description="Generate QR codes for URLs, text, Wi-Fi, contact cards, and more — entirely in your browser."
    category="seo-marketing"
    tier="free"
    relatedTools={['utm-link-builder', 'meta-tag-previewer', 'barcode-generator']}
    faq={[...]}
  >
    <QrCodeGenerator />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what error correction level means and when to use a higher level
  (higher levels tolerate more damage/obstruction — like a logo overlay —
  at the cost of a denser code), recommended minimum print size for
  reliable scanning, whether these QR codes "expire" or need an account
  (no — they encode the data directly, there's no tracking/redirect service
  involved unless the user explicitly encodes a URL from a service that
  itself tracks), and confirmation everything is generated client-side with
  nothing stored or transmitted.

STEP 4 — QrCodeGenerator.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Content type tabs, each with type-appropriate input fields that get
  formatted into the correct QR payload string automatically:
  - URL/Text (default) — single text input, used as-is
  - Wi-Fi — SSID, password, encryption type (WPA/WEP/none) fields, formats
    into the standard `WIFI:T:WPA;S:mynetwork;P:mypassword;;` QR payload
    string that phone camera apps recognize and offer to auto-join
  - Contact (vCard) — name, phone, email, organization fields, formats into
    a standard vCard string so scanning offers to save a contact directly
  - Email — address, subject, body fields, formats into a `mailto:` URI
  - SMS — phone number, message fields, formats into an `sms:` URI
  - Plain text — freeform text input, used as-is (for notes, quotes, etc.)
  Each tab's formatting logic should live in the utils file (Step 6), not
  inline in the component, since these payload formats are fiddly and worth
  keeping isolated/testable.
- Live QR preview, regenerating as any field changes (debounce ~200ms is
  fine, generation itself is fast).
- Customization options:
  - Size selector (e.g. 256px / 512px / 1024px, affects export resolution)
  - Foreground/background color pickers (native color inputs styled to
    match the design system) — WARN clearly if contrast between foreground
    and background is too low for reliable scanning (a simple luminance
    check is enough; QR codes fail to scan with low contrast, this is a
    real and common mistake users make when trying to "brand" their QR code)
  - Error correction level selector: L / M / Q / H, with a one-line
    explanation of the tradeoff (higher = more damage-tolerant, denser code)
  - Optional logo/image overlay (FileDropzone, image upload, centered on
    the QR code) — if used, automatically bump error correction to at least
    level Q or H and show a note explaining why (a logo covering part of the
    code needs the extra redundancy to remain scannable) — don't let a user
    add a logo with error correction level L, that combination reliably
    produces unscannable codes
- Export buttons: Download as PNG, Download as SVG (SVG export matters for
  users who want to print at large sizes without pixelation — check that
  the `qrcode` library's toString/toBuffer SVG output path is used rather
  than only rasterizing to PNG).
- CopyButton to copy the QR image to clipboard (use the Clipboard API's
  image-write capability — check browser support and gracefully hide/disable
  this specific button if unsupported rather than showing a broken control).
- "Scan test" note: a small reminder to test the generated code with an
  actual phone camera before printing/publishing it, especially if a logo
  overlay or custom colors were used — this is genuinely useful advice, not
  filler.

STEP 5 — Accessibility/UX:
- Content type tabs should be keyboard-navigable.
- Color pickers need visible focus states.
- The low-contrast warning should be a real, visible UI element (not just a
  console warning) since it's the single most common way users break their
  own QR codes.

STEP 6 — Logic separation:
Extract into apps/web/app/tools/qr-code-generator/utils/:
  - generateQr.ts — the canonical wrapper around the `qrcode` library:
    generateQrDataUrl(payload: string, options: QrOptions): Promise<string>
    and generateQrSvg(payload: string, options: QrOptions): Promise<string>.
    This is the function UTM Link Builder (and any future tool needing QR
    codes) should import.
  - payloadFormatters.ts — pure functions per content type:
    formatWifiPayload(ssid, password, encryption), formatVCardPayload(name,
    phone, email, org), formatEmailPayload(address, subject, body),
    formatSmsPayload(number, message) — each returning the correctly-
    formatted string per that content type's standard.
  - contrastCheck.ts — a simple checkContrast(foreground: string,
    background: string): { sufficient: boolean; ratio: number } used for
    the low-contrast warning (can reuse/reference the same luminance/
    contrast math from Color Palette Generator's contrast-preview feature
    if that logic was factored out generically there — check
    apps/web/app/tools/color-palette/utils/colorConversion.ts first rather
    than reimplementing WCAG contrast math a third time in this codebase).

STEP 7 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry. Confirm UTM Link Builder's QR toggle now imports
generateQr.ts from this tool rather than any standalone copy — update it if
it doesn't yet.

After building, tell me:
1. Confirm whether UTM Link Builder had a QR stopgap implementation, and if
   so, confirm it now imports from this tool's generateQr.ts and the
   duplicate was removed.
2. Confirm whether contrastCheck.ts reused Color Palette Generator's
   existing contrast math or had to reimplement it — if reimplemented, flag
   this as the second instance of contrast-ratio logic in the codebase and
   suggest whether it's now worth extracting to a shared
   packages/color-utils (this same question was raised after tool #7 and
   is now more pressing with a second consumer).
3. Test the Wi-Fi and vCard payload formats specifically with a real phone
   camera (or confirm the payload strings exactly match the documented
   standards if a physical test isn't possible) — these two formats have
   the most finicky syntax (semicolon escaping, field ordering) and are the
   most likely to silently produce a QR code that scans but doesn't actually
   trigger the expected "join Wi-Fi" or "save contact" prompt.
```

---

## Notes

- **This tool exists partly to pay down a debt** — UTM Link Builder was told
  to build a stopgap QR implementation if this tool didn't exist yet.
  Step 1 and the closing questions explicitly require checking for and
  consolidating that duplication rather than leaving two QR code paths in
  the codebase going forward.
- **The contrast-math question is now a second data point**, not just a
  first — Color Palette Generator raised whether WCAG contrast logic should
  become a shared `packages/color-utils`, and this tool needs the same math
  for its low-contrast warning. Two consumers of the same non-trivial logic
  is a reasonable trigger to actually extract it now rather than continuing
  to defer the decision into tool #14, #15, etc.
- **Wi-Fi and vCard payload formats are the real correctness risk** — both
  have finicky escaping rules (semicolons in Wi-Fi payloads need backslash-
  escaping if they appear in the SSID/password itself, vCard has strict
  field ordering) where a subtly wrong format produces a QR code that scans
  fine as *data* but fails to trigger the phone's expected action (auto-join
  Wi-Fi, save contact). This is easy to get "looks right" wrong, hence the
  explicit request for real-device or spec-accurate verification.
- **Logo overlay + error correction interaction is a real, common user
  mistake** worth guarding against actively (auto-bumping error correction
  level, not just documenting the tradeoff) rather than trusting users to
  understand QR error correction theory before they break their own code.
