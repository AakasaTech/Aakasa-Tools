# Claude Code Prompt — Build Tool #58: Robots.txt & Sitemap.xml Generator

Run after tool-shell and tools #1-57 exist. Two related but distinct SEO
file generators in one tool — genuinely useful for your own product sites,
not just toolbox visitors.

---

```
Build the Robots.txt & Sitemap.xml Generator for the Aakasa Toolbox
monorepo.

CONTEXT:
- Route: apps/web/app/tools/robots-sitemap-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string/XML generation — no library strictly
  needed, though a small XML-building helper (or the native
  XMLSerializer/DOMParser approach established in XML Formatter's build)
  can keep sitemap XML generation clean; either approach is fine given the
  output structure is simple and well-defined.
- Design tokens as established. Generated file content in font-mono.

STEP 1 — Register:
  { slug: 'robots-sitemap-generator', title: 'Robots.txt & Sitemap Generator',
    shortDescription: 'Generate robots.txt and XML sitemap files for your website, free.',
    category: 'seo-marketing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['meta-tag-previewer', 'utm-link-builder', 'http-status-codes']. FAQ
(3-4 Q&A): what robots.txt controls (instructing search engine crawlers
which parts of a site they may or may not crawl — note plainly that
robots.txt is a voluntary convention, not a security/access-control
mechanism, since well-behaved crawlers respect it but it doesn't actually
block access to disallowed paths, a common misconception worth correcting),
what a sitemap.xml does (helps search engines discover and understand the
structure/priority of pages on a site, doesn't guarantee indexing), where
these files need to be placed (the root of the domain, e.g.
example.com/robots.txt), and the privacy note.

STEP 3 — RobotsSitemapGenerator.tsx:
Two tabs:

  TAB A — Robots.txt Generator:
  - User-agent rule builder: add one or more rule blocks, each specifying
    a user-agent (default "*" for all crawlers, with common named presets
    like Googlebot, Bingbot available to select), and a list of Allow/
    Disallow path rules for that user-agent.
  - Common presets/quick-add buttons: "Disallow all" (blocks everything —
    useful for staging/dev sites), "Allow all" (explicitly permissive,
    equivalent to no restrictions but sometimes wanted explicitly), "Block
    common admin/system paths" (a preset adding typical disallow entries
    like /admin/, /wp-admin/, /api/ — clearly labeled as a generic starting
    point the user should review and adjust, not a guaranteed-correct
    config for their specific site).
  - Sitemap reference field: an optional field to include a `Sitemap:` line
    pointing to the site's sitemap.xml URL (a real, commonly-included
    robots.txt directive linking the two file types together).
  - Crawl-delay field (optional, a numeric seconds value — note in a small
    inline hint that this directive isn't universally respected by all
    crawlers, notably Google ignores it, so set expectations honestly).
  - Live-generated robots.txt content (font-mono), CopyButton and Download
    (robots.txt) button.

  TAB B — Sitemap.xml Generator:
  - URL entry: add one or more page URLs, either by pasting a list (one
    per line, parsed and added in bulk) or adding them individually.
  - Per-URL optional metadata: last modified date (date picker, or "use
    today"), change frequency (dropdown: always/hourly/daily/weekly/
    monthly/yearly/never), priority (0.0-1.0, with a brief note that this
    is a relative hint to crawlers, not a ranking guarantee).
  - Bulk-apply: set the same change frequency/priority across all entries
    at once, then adjust individual ones as needed — saves repetitive
    per-URL editing for a large site with mostly-similar pages.
  - Live-generated valid sitemap.xml content (font-mono, proper XML with
    correct namespace declarations per the sitemaps.org protocol),
    CopyButton and Download (sitemap.xml) button.
  - URL count and a practical size/count warning if the list grows very
    large (the sitemap protocol has a documented per-file limit — 50,000
    URLs / 50MB uncompressed — mention this limit if the user's list
    approaches it, with a brief note that sites exceeding it need a
    sitemap INDEX file referencing multiple sitemap files, which is out of
    scope for this build's basic generator but worth being aware of rather
    than silently producing an invalid oversized file).

STEP 4 — Logic separation: apps/web/app/tools/robots-sitemap-generator/
utils/:
- buildRobotsTxt.ts — buildRobotsTxt(rules: UserAgentRule[], sitemapUrl?:
  string, crawlDelay?: number): string, correct robots.txt directive
  formatting.
- buildSitemapXml.ts — buildSitemapXml(urls: SitemapUrlEntry[]): string,
  generating valid XML per the sitemaps.org schema (correct root element,
  namespace, and per-url elements: loc, lastmod, changefreq, priority).
Both pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the generated sitemap.xml is well-formed and valid against the
   sitemaps.org protocol — test by parsing the generated output back
   through DOMParser (or an XML validator) and confirming no errors, and
   confirm the required namespace declaration is present and correct.
2. Confirm the generated robots.txt correctly formats multiple user-agent
   blocks with their own distinct Allow/Disallow rules (not merging rules
   across different user-agents incorrectly).
3. Confirm the FAQ/UI correctly states that robots.txt is a voluntary
   convention, not an access-control mechanism — this is worth double-
   checking wasn't accidentally stated as if it were a security feature.
```

## Note
**The "robots.txt isn't security" clarification is worth taking seriously**
— it's a genuinely common misconception (people sometimes believe
disallowing a path in robots.txt prevents access to it, when it only
requests that well-behaved crawlers not index it) and a tool that
generates these files has a responsibility to correct that expectation
clearly rather than implicitly reinforcing it by silence. The sitemap XML
validity check (parsing the generated output back through a parser) is the
concrete way to confirm correctness beyond "the string looks plausible."
