# Claude Code Prompt — Build Tool #3: UUID / Hash Generator

Run this after packages/tool-shell, JSON Formatter (#1), and Password
Generator (#2) all exist and work. By now packages/ui and packages/tool-shell
should be stable enough that this tool needs very little new scaffolding —
if it doesn't, that's worth noting before tool #4.

---

```
Build the UUID / Hash Generator tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/uuid-hash-generator/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and whatever else got added while
  building JSON Formatter and Password Generator (check for a range slider,
  toggle/checkbox group, and strength-meter-style components before writing
  new ones — this tool needs a toggle group and possibly a file dropzone,
  both of which may already exist or be close to what's needed).
- 100% client-side. Use the Web Crypto API (crypto.randomUUID() for UUIDs,
  crypto.subtle.digest() for hashing) — no external UUID or hash libraries,
  the browser natively supports everything this tool needs.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. All generated IDs/hashes render in
  font-mono, per the cross-tool convention.

This tool actually covers TWO related utilities in one page (UUID generation
and hash generation) since they share an audience and a "generate an
identifier from input" mental model. Build them as two clearly separated
sections/tabs within the same tool, not as two separate pages.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'uuid-hash-generator', title: 'UUID & Hash Generator',
    shortDescription: 'Generate UUIDs and compute MD5/SHA hashes instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "UUID & Hash Generator - Free Online Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="UUID & Hash Generator"
    description="Generate UUIDs and compute cryptographic hashes — entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['json-formatter', 'base64-tool', 'password-generator']}
    faq={[...]}
  >
    <UuidHashGenerator />
  </ToolShell>
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what a UUID is and when v4 vs other versions matter, what a hash is
  and common use cases (checksums, deduplication, non-secret lookups), an
  explicit note that MD5/SHA-1 are NOT suitable for password storage (this
  tool is for checksums/identifiers, not credential hashing — say this
  plainly, don't bury it), and confirmation nothing typed here leaves the
  browser.

STEP 3 — UuidHashGenerator.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI. Two sections
(tabs or clearly divided panels, your call on which reads better):

  SECTION A — UUID Generator:
  - Generate button, produces a UUID v4 immediately on page load (don't
    require a click for an empty tool).
  - CopyButton on the generated UUID.
  - "Generate 10" bulk button — lists 10 UUIDs, each individually copyable,
    plus copy-all. (Same pattern as Password Generator's bulk feature —
    reuse that component/logic if it was built generically enough there;
    check apps/web/app/tools/password-generator/ before writing this from
    scratch.)
  - Format toggle: with hyphens (standard) vs without hyphens vs uppercase.
  - Brief inline note this is UUID v4 (random), not v1 (timestamp-based) or
    v5 (namespace-based) — no need to support those versions, just be
    accurate about what's generated.

  SECTION B — Hash Generator:
  - Text input (textarea, font-mono) for the string to hash.
  - Algorithm selector: MD5, SHA-1, SHA-256, SHA-512. Note: Web Crypto's
    subtle.digest() does NOT support MD5 natively — if MD5 is included,
    implement it via a small pure-JS MD5 function (well-known compact
    implementations exist) and clearly comment in the code that MD5 is the
    one algorithm not using Web Crypto, for legacy-compatibility use cases
    only (git blobs, non-security checksums), and should be visually/textually
    flagged in the UI as "not cryptographically secure" next to the option.
  - Output hash in font-mono, updates live as the user types (debounced
    ~200ms) or on an explicit "Compute" button — your call on which feels
    better for a hash of live-typed text (bulk pasted text likely wants a
    button so it doesn't recompute mid-paste awkwardly).
  - CopyButton on the output.
  - Optional: file input (drag-and-drop, reuse packages/ui's FileDropzone if
    it exists) to hash file contents instead of typed text — compute the
    hash via FileReader + the same digest functions, entirely client-side,
    no upload. This is a nice differentiator over most simple online hash
    tools. Show file name and size once selected, and a max-size warning
    (e.g. 100MB) since very large files will hash slowly in the main thread.

STEP 4 — Performance:
If a selected file exceeds ~10MB, move the hashing into a Web Worker so the
UI doesn't freeze. Put it at
apps/web/app/tools/uuid-hash-generator/workers/hash.worker.ts. Text-input
hashing doesn't need a worker — it's fast enough on the main thread.

STEP 5 — Logic separation:
Extract into apps/web/app/tools/uuid-hash-generator/utils/:
  - generateUuid.ts — generateUuidV4(options: { hyphens: boolean, uppercase:
    boolean }): string
  - hash.ts — computeHash(input: string | ArrayBuffer, algorithm: 'MD5' |
    'SHA-1' | 'SHA-256' | 'SHA-512'): Promise<string>
Pure, typed functions (no `any`), unit-testable, and reusable if a future
tool (e.g. a dedicated "File Checksum Verifier") wants computeHash directly.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Whether the bulk-generation UI from Password Generator was directly
   reusable here, or had to be rebuilt — if it had to be rebuilt, suggest
   what shape a shared packages/ui component would need to actually cover
   both cases.
2. Confirm which hash algorithms ended up using native Web Crypto vs a
   custom implementation (should be exactly MD5 as the one exception).
```

---

## Notes

- **MD5 caveat is the one tricky part** — Web Crypto's `subtle.digest()` doesn't
  support it, so this is the first tool needing a small bundled algorithm
  implementation rather than pure browser APIs. Worth reviewing that output
  specifically rather than assuming it "just works" like SHA did.
- **Security framing matters in the copy**: the FAQ and UI both explicitly say
  MD5/SHA-1/SHA-256 here are for checksums/identifiers, not password hashing
  — this protects users from a common misuse and protects you from being the
  tool that quietly encouraged bad security practice.
- This is a good checkpoint tool: if the bulk-UUID pattern reuses cleanly from
  Password Generator's bulk-password pattern, that's real evidence your
  shared-package strategy is working three tools in.
