# Claude Code Prompt — Build Tool #11: Meta Tag & Open Graph Previewer

Run this after tool-shell and tools #1-10 all exist and work. This tool
also dogfoods internally — you'll likely use it yourself to check OG tags
across billcraft.aakasa.dev, supportcraft.aakasa.dev, and every future
Craft product page.

---

```
Build the Meta Tag & Open Graph Previewer tool for the Aakasa Toolbox
monorepo.

CONTEXT:
- Route: apps/web/app/tools/meta-tag-previewer/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-10
  — check what exists before writing anything new.
- TWO INPUT MODES this tool must support:
  (a) Paste raw HTML directly (fully client-side, parse with DOMParser —
      no network request, works for any HTML including localhost/private
      pages the user pastes in)
  (b) Enter a URL and fetch it — THIS MODE REQUIRES A SERVER-SIDE FETCH,
      since browsers block cross-origin fetches of arbitrary pages via CORS,
      and most sites don't send permissive CORS headers on their HTML. This
      is a deliberate, narrow exception to the toolbox's "100% client-side,
      nothing touches a server" rule — flag this clearly in the UI (a small
      note: "Fetching by URL requires our server to load the page's HTML;
      pasting HTML directly stays fully local") so the privacy promise
      elsewhere in the toolbox isn't misrepresented for this one mode.
      Implement this as a single minimal API route
      (apps/web/app/api/fetch-meta/route.ts) that fetches the given URL
      server-side, extracts ONLY the <head> meta tags (not the full page
      body), and returns them — never store the fetched HTML, never log the
      URLs requested beyond normal, short-lived server request logs, and
      strip this endpoint down to the absolute minimum needed (fetch, parse
      <head>, return meta tag key/values as JSON, discard everything else
      immediately). Rate-limit this endpoint (a simple in-memory or edge
      rate limit is fine — this doesn't need a database) to prevent it being
      abused as an open URL-fetching proxy.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Raw tag output uses font-mono; the
  social preview cards should visually mimic the actual platforms (Twitter/X,
  Facebook, LinkedIn, Google search result) as closely as reasonably possible
  without directly copying their exact proprietary UI chrome — approximate
  the layout/proportions, not a pixel-perfect clone.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'meta-tag-previewer', title: 'Meta Tag & Open Graph Previewer',
    shortDescription: 'Preview how your page looks when shared on social media and search.',
    category: 'seo-marketing', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Meta Tag & Open Graph Previewer - Free SEO Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags (yes, this
  page should itself have good OG tags — slightly meta, worth getting right
  as a demonstration).
- Renders:
  <ToolShell
    title="Meta Tag & Open Graph Previewer"
    description="Preview how your page looks when shared on Twitter, Facebook, LinkedIn, and Google — paste HTML or enter a URL."
    category="seo-marketing"
    tier="free"
    relatedTools={['word-counter', 'robots-sitemap-generator', 'utm-link-builder']}
    faq={[...]}
  >
    <MetaTagPreviewer />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what Open Graph tags are and why they matter (controlling how links
  look when shared, not a ranking factor itself but affects click-through),
  the difference between og:* tags (Facebook/LinkedIn/most platforms) and
  twitter:* card tags (Twitter/X has its own tag set, falls back to OG tags
  if twitter-specific ones are missing — explain this fallback behavior
  since it's a common point of confusion), recommended image dimensions
  (1200x630 is the widely-used OG image standard, mention it), and be
  explicit and honest about the URL-fetch mode requiring a server request
  (this is the one tool in the toolbox where that's true — don't gloss over
  it in the FAQ just because it's inconvenient to explain).

STEP 3 — MetaTagPreviewer.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Input mode toggle: "Paste HTML" / "Enter URL", clearly labeled with the
  privacy distinction from Step CONTEXT visible near the URL mode
  specifically (not buried in the FAQ only).
- Paste HTML mode: textarea (font-mono), parse via DOMParser client-side,
  extract: <title>, <meta name="description">, <meta property="og:*">,
  <meta name="twitter:*">, canonical <link rel="canonical">, and favicon
  <link rel="icon">.
- URL mode: text input for the URL, "Fetch" button, calls the
  /api/fetch-meta route, shows a loading state, handles fetch failures
  gracefully (invalid URL, site blocks bots, timeout, 404, etc.) with clear
  per-failure-type messages rather than a generic "something went wrong."
- Extracted tags summary table: tag name, extracted value, and a status
  indicator (present / missing / present-but-too-long) for the important
  ones — title (recommend ~50-60 char limit), description (~150-160 char
  limit), og:image (flag if missing or if dimensions can't be verified from
  markup alone).
- Live preview cards for each platform, laid out as separate labeled
  sections:
  - Google search result preview (title, URL, description, styled to
    loosely resemble an actual SERP snippet)
  - Facebook/LinkedIn share preview (large image, title, description,
    domain — these two platforms render very similarly so one preview
    styled generically as "Facebook & LinkedIn" is fine, no need to build
    two nearly-identical previews)
  - Twitter/X card preview (supports both "summary" and "summary_large_image"
    card types based on the twitter:card tag value if present, falling back
    to OG tags if twitter-specific tags are absent — reflect the actual
    fallback behavior in what's rendered, not just in the FAQ text)
  - If og:image or twitter:image is missing entirely, show a clear
    placeholder in the preview (not a broken image icon) with a note that
    most platforms won't render a rich preview without one
- Raw extracted tags view (collapsible): the actual <meta> tag markup as
  text, font-mono, with a CopyButton — useful for users who want to paste
  corrected/example tags directly into their own HTML.
- Missing/recommended tags checklist: a short list flagging commonly-missed
  tags (e.g. "No twitter:card tag found — Twitter will fall back to Open
  Graph tags" / "No canonical URL found" / "Description is 340 characters —
  most platforms will truncate around 160") — genuinely actionable, not just
  decorative.

STEP 4 — API route (apps/web/app/api/fetch-meta/route.ts):
- Accept a POST (not GET, to avoid the URL being casually cached/logged in
  more places than necessary) with { url: string } in the body.
- Validate the URL (must be http/https, reject obviously malformed input)
  before fetching — don't let this become an SSRF vector; explicitly block
  requests to private/internal IP ranges (localhost, 127.0.0.1, 10.x, 192.168.x,
  169.254.x, etc.) since this endpoint fetches arbitrary user-supplied URLs
  server-side and that's a classic SSRF risk if not guarded.
- Fetch the URL server-side with a reasonable timeout (~8s), parse only the
  <head> section (don't download/return the full page body), extract the
  same tag set as the client-side paste mode, return as JSON.
- Rate limit by IP (a simple sliding-window counter is sufficient, doesn't
  need Redis/a database for this volume — an in-memory Map with periodic
  cleanup is fine for a single-instance deploy; note in a comment that a
  multi-instance deploy would need a shared store like Upstash Redis, but
  don't build that now).
- Never persist the fetched HTML or the requested URL anywhere beyond
  normal transient server request logs.

STEP 5 — Logic separation:
Extract into apps/web/app/tools/meta-tag-previewer/utils/:
  - parseMetaTags.ts — parseMetaTags(html: string): MetaTagData, used by
    BOTH the client-side paste mode (called directly in the browser) and the
    server-side API route (called after fetching) — write this so it works
    in both environments (no DOM-only APIs like `document`; use DOMParser
    which is available in both browser and, if needed, a lightweight
    server-side equivalent — check what's available in the Next.js API
    route runtime and adjust accordingly, this is worth getting right since
    duplicate parsing logic between client and server would be a
    maintenance trap).
  - tagValidation.ts — pure functions checking title/description length,
    presence of required tags, image dimension recommendations — feeding
    the "missing/recommended tags checklist" UI.

STEP 6 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry. Test URL mode against at least one real external URL you
control (e.g. aakasa.dev itself) to confirm the SSRF guard doesn't
accidentally block legitimate external requests while still blocking
internal/private IP ranges.

After building, tell me:
1. Confirm the SSRF guard was actually tested against at least one internal
   IP range (e.g. attempt to fetch http://localhost or http://169.254.169.254,
   the common cloud metadata endpoint address) and blocked correctly — this
   is a real security control, not a nice-to-have, and needs to be verified
   rather than assumed.
2. Whether parseMetaTags.ts was actually shared cleanly between the
   client-side paste mode and the server-side API route, or whether the
   runtime differences forced two separate implementations — if two, flag
   the duplication so it can be revisited.
3. Confirm the rate limiter is in place and describe its current limits
   (requests per IP per time window) so this can be tuned later based on
   real usage.
```

---

## Notes

- **This is the first (and should stay the only, for now) tool that touches
  a server** — every other tool in the toolbox has been genuinely 100%
  client-side. URL fetching is fundamentally impossible to do purely
  client-side due to CORS, so this is a deliberate, narrow, disclosed
  exception rather than scope creep. The disclosure has to be honest and
  visible in the UI itself, not just the FAQ, so it doesn't quietly
  contradict the privacy promise made everywhere else in the toolbox.
- **SSRF is the real security risk here, not a theoretical one** — an
  endpoint that fetches arbitrary user-supplied URLs server-side is a
  classic vector for reaching internal services, cloud metadata endpoints
  (169.254.169.254 is the AWS/GCP/Azure metadata address specifically worth
  testing against, relevant given your EKS infrastructure work), or other
  internal-network resources if not explicitly guarded. This needs to
  actually be tested, not just coded and assumed correct.
- **Rate limiting matters more here than anywhere else in the toolbox**
  since this is the one endpoint that costs you server resources per
  request and could be abused as a free open URL-fetching proxy if
  unguarded — worth revisiting the limit once you see real traffic patterns.
- This tool is worth using on your own Craft product pages once built — it's
  a legitimate way to catch missing/broken OG tags on billcraft.aakasa.dev
  and supportcraft.aakasa.dev before a bad social preview costs you
  click-through.
