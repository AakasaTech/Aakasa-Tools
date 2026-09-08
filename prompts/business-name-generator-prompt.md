# Claude Code Prompt — Build Tool #60: Business Name Generator

Run after tool-shell and tools #1-59 exist. Closes out this batch. Genuinely
fun, shareable tool with a real domain-availability angle worth building
carefully given the "check availability" feature requires a server touch,
similar to Meta Tag Previewer's exception.

---

```
Build the Business Name Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/business-name-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side for name generation itself. Use `@faker-js/faker`
  (already a dependency from Random Data Generator's build, check first
  rather than adding it fresh) for word-combination building blocks, plus
  a curated set of naming pattern templates (see Step 3) — this tool's
  value is in the pattern/combination logic, not raw randomness alone.
- DOMAIN AVAILABILITY CHECK — a genuinely useful feature but one requiring
  a real server-side DNS/WHOIS-style lookup, since browsers cannot check
  domain availability client-side (no direct client-side API exists for
  this). If you build this feature, it requires a minimal API route
  (apps/web/app/api/check-domain/route.ts) similar in spirit and
  discipline to Meta Tag Previewer's fetch-meta exception: disclose the
  server touch honestly in the UI (not just the FAQ), rate-limit the
  endpoint, and keep it minimal (check availability only, don't fetch or
  return unrelated data about the domain). If implementing this feels like
  meaningfully expanding this build's scope beyond a reasonable single
  prompt, it's acceptable to ship WITHOUT domain checking in this pass and
  clearly note it as a "not implemented, would require a server-side check"
  limitation in the FAQ instead — don't fake a client-side availability
  check that can't actually work correctly.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'business-name-generator', title: 'Business Name Generator',
    shortDescription: 'Generate creative business and brand name ideas instantly.',
    category: 'seo-marketing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['random-data-generator', 'font-pairing', 'color-palette'] (check
TOOL_REGISTRY, drop unregistered). FAQ (3-4 Q&A): how the generator works
(combining industry-relevant keywords with naming patterns — compound
words, prefixes/suffixes, portmanteaus — rather than pure random word
salad), an honest note that generated names are creative starting points
requiring the user's own trademark and domain availability research before
committing to one (state this plainly — this tool doesn't and can't
guarantee a name is legally available or unclaimed), whether/how domain
checking works if implemented (per CONTEXT — disclose the server touch
honestly if built, or clearly state it's not included if not), and the
privacy note.

STEP 3 — BusinessNameGenerator.tsx:
- Input: one or more keywords/themes relevant to the business (e.g.
  "coffee," "fitness," "software") — the generator uses these as seed
  words rather than generating from nothing, producing more relevant
  results than pure randomness.
- Industry/style selector (optional, refines the naming pattern used):
  Modern/Tech (short, invented-sounding, e.g. blending syllables), Classic/
  Professional (real-word compounds, e.g. "Keyword + Co./Group/Studio"),
  Playful/Creative (puns, alliteration, portmanteaus), Descriptive (plainly
  combines the keyword with a descriptive suffix, e.g. "Keyword Solutions,"
  "Keyword Hub").
- Naming pattern library (implement several distinct pattern types,
  applied based on the selected style):
  - Keyword + suffix (Hub, Studio, Co, Labs, Works, Collective, etc.)
  - Prefix + Keyword (The, Modern, Urban, Pure, etc.)
  - Portmanteau/blend (combine the keyword with a second thematically
    related word, blending syllables — this is the most creative/complex
    pattern, keep the blending logic reasonably simple, e.g. taking the
    first half of one word and the second half of another, rather than
    attempting sophisticated linguistic blending)
  - Alliterative pairing (keyword paired with an adjective/noun starting
    with the same letter)
  - Invented/abstract (short invented-sounding words loosely inspired by
    the keyword's sound, for a more modern-tech-startup feel)
- Generate button — produces a batch of 12-20 name suggestions at once
  (browsing a batch is more useful than one-at-a-time for this kind of
  creative brainstorming tool), spanning a mix of the pattern types rather
  than only one, unless a specific style filter is applied.
- Favorite/shortlist: click to star a name, building a shortlist within the
  session (client-side state only, not persisted, consistent with the
  toolbox's established pattern) for comparing top candidates.
- Regenerate/"more like this" — given a name the user likes, generate
  additional suggestions using a similar pattern/style as a starting point.
- Per-name domain-check button (IF the domain-check feature is implemented
  per CONTEXT) — checks .com availability (and optionally a couple of
  other common TLDs) for that specific name on demand (not automatically
  for all 12-20 generated names at once, to keep the server endpoint's
  load reasonable and avoid unnecessary lookups for names the user isn't
  seriously considering).
- CopyButton per name.

STEP 4 — Logic separation: apps/web/app/tools/business-name-generator/
utils/:
- namePatterns.ts — the typed pattern-generation functions described above
  (one function per pattern type), plus curated word lists for
  suffixes/prefixes/style-appropriate vocabulary.
- generateNames.ts — generateNameSuggestions(keywords: string[], style:
  NamingStyle, count: number): string[], orchestrating the pattern
  functions to produce a varied batch.
If domain checking is implemented: apps/web/app/api/check-domain/route.ts
plus a small client-side utils/checkDomain.ts wrapper, with the same
rate-limiting and minimal-data discipline as Meta Tag Previewer's API route.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm whether domain-availability checking was implemented in this
   pass or explicitly deferred — if implemented, confirm the server touch
   is disclosed in the UI (not just the FAQ) and that the endpoint is
   rate-limited; if deferred, confirm the FAQ honestly states this
   limitation rather than implying a capability that doesn't exist.
2. Confirm the generated names are genuinely varied across the different
   pattern types for a single keyword (test with one keyword and confirm
   the batch includes recognizably different naming approaches, not 15
   minor variations of the same pattern).
3. Confirm the "trademark/availability is the user's responsibility"
   disclaimer is clearly and honestly stated, not buried.
```

## Note
**Domain-availability checking is optional in this build, and that's
deliberate** — it's a genuinely valuable feature but requires the same kind
of server-touching exception already made once (Meta Tag Previewer), and
compounding that pattern needs the same discipline (disclosure, rate
limiting) rather than casually adding a second server dependency without
the same care. It's fully acceptable for this build to ship without it and
state the limitation honestly — that's a better outcome than a rushed or
under-guarded implementation of the check.
