# Claude Code Prompt — Build Tool #12: UTM Link Builder

Run this after tool-shell and tools #1-11 all exist and work. This is a
return to a fully client-side, low-risk build after Meta Tag Previewer's
server-touching complexity — good pacing, and it's a tool you'll likely use
yourself for tracking Aakasa Digital's own marketing links.

---

```
Build the UTM Link Builder tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/utm-link-builder/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-11
  — check what exists before writing anything new.
- 100% client-side. Pure string/URL manipulation using the native URL API
  (`new URL()` and `URLSearchParams`) — no libraries needed, and no server
  contact at all, unlike tool #11. This tool should feel like a return to
  the toolbox's normal privacy posture after Meta Tag Previewer's necessary
  exception.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. The generated URL output uses
  font-mono.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'utm-link-builder', title: 'UTM Link Builder',
    shortDescription: 'Build trackable campaign URLs with UTM parameters, instantly.',
    category: 'seo-marketing', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "UTM Link Builder - Free Campaign URL Generator | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="UTM Link Builder"
    description="Build trackable campaign URLs with UTM parameters — instantly, in your browser."
    category="seo-marketing"
    tier="free"
    relatedTools={['meta-tag-previewer', 'qr-code-generator', 'url-encoder-decoder']}
    faq={[...]}
  >
    <UtmLinkBuilder />
  </ToolShell>
  Note: check TOOL_REGISTRY first — 'url-encoder-decoder' likely doesn't
  exist yet. Drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what UTM parameters are and how analytics platforms (Google
  Analytics, etc.) use them to attribute traffic, what each of the five
  standard parameters means (source, medium, campaign, term, content) and
  when to use the optional ones (term/content) vs. the required ones
  (source/medium/campaign), a brief naming-convention tip (lowercase,
  consistent, no spaces — since inconsistent casing like "Facebook" vs
  "facebook" fragments analytics reports, a genuinely common real-world
  mistake worth calling out), and confirmation this tool builds URLs
  entirely client-side with nothing sent anywhere.

STEP 3 — UtmLinkBuilder.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Base URL input (the destination page, validated as a well-formed URL
  before allowing parameter generation — use the native URL constructor
  in a try/catch to validate rather than a hand-rolled regex).
- UTM parameter fields:
  - utm_source (required) — e.g. "newsletter", "twitter", "google"
  - utm_medium (required) — e.g. "email", "cpc", "social"
  - utm_campaign (required) — e.g. "spring_launch"
  - utm_term (optional) — typically paid search keyword tracking
  - utm_content (optional) — differentiate similar content/links in the
    same campaign, e.g. A/B testing two CTAs
  - Each field should have a small placeholder example AND a short inline
    hint text (not just a tooltip — visible by default) since first-time
    users genuinely don't know what goes in these fields without guidance.
- Common-value suggestions: a small set of clickable chips for utm_source
  (Google, Facebook, Twitter/X, LinkedIn, Newsletter, Instagram) and
  utm_medium (cpc, social, email, referral, organic) that fill the
  respective field when clicked — speeds up the common case without forcing
  free text entry every time.
- Live-generated URL output as the user fills in fields, font-mono, updating
  in real time — show it building up incrementally (base URL, then each
  param appended) rather than only appearing once all required fields are
  filled, so users can see the mechanics of what's happening.
- Validation state: clearly indicate which required fields are still empty
  (a small inline marker, not a blocking error until they actually try to
  copy/use it) — utm_source/medium/campaign are commonly required by
  analytics platforms to attribute properly, so the tool should nudge toward
  filling all three without being obnoxious about it if someone genuinely
  only wants a subset for their own tracking scheme.
- Case/whitespace normalization option: a toggle (default ON) that
  auto-lowercases and trims whitespace from parameter VALUES as they're
  typed (not the base URL, only the UTM values) to prevent the exact
  analytics-fragmentation mistake mentioned in the FAQ — with a small note
  explaining why this default exists, and letting power users turn it off
  if they have a deliberate reason not to.
- CopyButton on the final generated URL.
- QR code generation shortcut: a "Generate QR code for this link" button
  that — IF the QR Code Generator tool (tool that will exist at
  /tools/qr-code-generator, check TOOL_REGISTRY) is already built — either
  links to it with the URL pre-filled via a query param handoff, or if
  that's not feasible without modifying the QR tool, simply links to it and
  notes the user can paste the URL there. If the QR tool doesn't exist yet
  in the registry, omit this feature entirely rather than linking to a
  nonexistent page — don't build speculative cross-tool integration for a
  tool that isn't registered yet.
- "Save as preset" (session-only, not persisted across page reloads —
  consistent with every other tool's no-storage stance): lets a user define
  a base URL + fixed utm_source/utm_medium once (e.g. their own newsletter
  platform), then quickly generate multiple campaign links varying just
  utm_campaign/utm_content for a batch of links in one sitting. Implement
  with plain React state, not localStorage — reinforce in a UI note that
  this resets on reload, don't let users assume it persists.
- List view of generated links within the session: each time a URL is
  successfully built and copied, optionally add it to a simple in-page list
  (session-only React state) so a user building several campaign links in
  one sitting can see/copy previous ones without regenerating — small UX
  win for the realistic "batch of campaign links" use case, not persisted.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/utm-link-builder/utils/:
  - buildUtmUrl.ts — buildUtmUrl(baseUrl: string, params: UtmParams):
    { url: string; error?: string }, using native URL/URLSearchParams,
    handling the case where the base URL already has query parameters
    (append UTM params correctly rather than overwriting/breaking existing
    ones — test this specifically, it's an easy thing to get subtly wrong).
  - normalizeUtmValue.ts — normalizeUtmValue(value: string): string,
    implementing the lowercase/trim normalization as a pure, isolated
    function.
  Both pure, typed (no `any`), unit-testable.

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry. Specifically test a base URL that already contains its
own query parameters (e.g. "https://example.com/page?ref=abc") to confirm
UTM params get appended correctly rather than the existing "ref=abc"
parameter being lost or malformed.

After building, tell me:
1. Confirm buildUtmUrl.ts correctly preserves existing query parameters on
   the base URL when appending UTM params — state the actual output for the
   test case above, don't just assert it works.
2. Whether the QR Code Generator tool was already registered at the time of
   this build — if so, confirm the handoff integration works; if not,
   confirm the feature was correctly omitted rather than linking to a
   broken page.
3. Whether the session-only "list of generated links" and "save as preset"
   features added meaningful complexity worth keeping, or whether they felt
   like scope creep on what should be a simple tool — an honest gut-check,
   not just confirmation everything got built.
```

---

## Notes

- **Existing query parameters on the base URL is the one real correctness
  trap here** — a naive implementation might just concatenate `?utm_source=...`
  onto the base URL, which breaks entirely if the base URL already has its
  own `?ref=abc`. Using `URLSearchParams` correctly handles this, but it's
  worth explicitly verifying rather than trusting it was done right by
  default — the prompt asks for the actual test output specifically for
  this reason.
- **This tool is a good one to actually use yourself** once built — for
  tracking traffic from your own SEO content, newsletter, or social posts
  back to aakasa.dev/billcraft/supportcraft, closing the loop on the SEO
  strategy work already in your history.
- The **QR code handoff feature is conditional on build order** — since
  QR Code Generator isn't built yet in your sequence, this prompt explicitly
  tells Claude Code to omit that integration now rather than link to a
  dead page, and to revisit it once QR Code Generator ships (worth a small
  follow-up prompt later: "add the UTM→QR handoff now that QR Code
  Generator exists").
