# Claude Code Prompt — Build Tool #28: HTTP Status Code Reference

Run after tool-shell and tools #1-27 exist. The simplest build in the
catalog so far — static reference data plus search/filter UI, no real
computation or parsing risk at all.

---

```
Build the HTTP Status Code Reference for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/http-status-codes/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Entirely static reference data plus filter/search UI —
  no external library, no computation beyond string matching.
- Design tokens as established; status codes themselves render in
  font-mono, descriptions in font-body.

STEP 1 — Register:
  { slug: 'http-status-codes', title: 'HTTP Status Code Reference',
    shortDescription: 'Look up HTTP status codes and their meanings instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['curl-to-code', 'json-formatter', 'regex-tester']. FAQ (3-4 Q&A): how HTTP
status codes are grouped into classes (1xx informational, 2xx success, 3xx
redirection, 4xx client error, 5xx server error) and what each class
broadly signals, a note on a few commonly-confused codes worth calling out
specifically (401 Unauthorized vs. 403 Forbidden — a very common point of
confusion, explain the actual distinction: 401 means "you need to
authenticate," 403 means "you're authenticated but not allowed"; 301 vs
302/307/308 redirect semantics and caching implications briefly), that
some codes are non-standard/vendor-specific (e.g. 418, some CDN/platform-
specific codes) and this reference sticks to the official IANA-registered
set, and the privacy note (low-stakes here, but keep consistent).

STEP 3 — HttpStatusCodes.tsx:
- Search/filter input at the top (filters by code number or keyword in the
  name/description as the user types — e.g. typing "redirect" surfaces all
  3xx codes, typing "404" jumps straight to that entry).
- Class filter chips: All / 1xx / 2xx / 3xx / 4xx / 5xx — quick-filter
  buttons above or beside the search input.
- Code list, grouped by class with clear section headers, each entry
  showing:
  - Status code number (font-mono, prominent)
  - Standard reason phrase (e.g. "Not Found")
  - Plain-language description of when/why this code is used (a sentence
    or two per code, not just the official spec title copied verbatim —
    write original, clear explanations rather than copying RFC text
    directly, both for copyright reasons and because RFC language is often
    unnecessarily formal for a quick-reference tool)
  - Class color-coding (a small colored indicator per class, using the
    design system's tokens sensibly — success-tinted for 2xx, a neutral/
    informational tint for 1xx and 3xx, danger-tinted for 4xx/5xx, this is
    a case where the danger color's use as "error" genuinely maps to the
    content rather than being decorative)
- CopyButton per entry (copies "404 Not Found" or similar short form —
  useful for pasting into commit messages, code comments, documentation).
- Deep-linkable entries: each code should be reachable via a URL fragment/
  anchor (e.g. /tools/http-status-codes#404) so users can bookmark or share
  a link directly to a specific code's explanation — on load, scroll to and
  highlight the linked entry if a fragment is present.
- Include the full standard set: all commonly-referenced 1xx/2xx/3xx/4xx/5xx
  codes (not an exhaustive obscure list, but comprehensive for the codes
  developers actually encounter — roughly 60-80 entries is a reasonable
  target, covering the full IANA-registered set minus truly obscure/
  deprecated ones).

STEP 4 — Logic separation: apps/web/app/tools/http-status-codes/data/
statusCodes.ts — a typed static array/const of { code: number; phrase:
string; description: string; class: '1xx' | '2xx' | '3xx' | '4xx' | '5xx' }
entries. This is pure data, not logic, but keeping it in its own file (not
inline in the component) keeps the component focused on rendering/filtering.
apps/web/app/tools/http-status-codes/utils/filterCodes.ts — a small pure
filterStatusCodes(codes, query, classFilter) function for the search/filter
logic, testable independent of the data itself.

STEP 5 — Verify: registry entry resolves, and confirm the URL-fragment
deep-linking actually scrolls to and highlights the correct entry when
visiting a URL like /tools/http-status-codes#404 directly (not just when
navigating within the page).

After building, tell me:
1. Confirm the total count of status codes included and confirm the data
   was written as original descriptions rather than copied verbatim from
   any RFC or external reference source (per the copyright note in Step 3).
2. Confirm deep-linking via URL fragment works on a fresh page load (not
   just when clicking an in-page link) — this requires reading
   window.location.hash on mount and scrolling to the matching entry,
   worth confirming it was actually implemented rather than assumed to work
   automatically from a plain anchor id.
```

## Note
This is intentionally the lowest-risk build in the current batch — no
parsing, no external library, no correctness-critical computation. The one
thing actually worth checking is that the status code descriptions were
written originally rather than lifted from RFC text or another site
verbatim, and that deep-linking (a small but genuinely useful feature for a
reference tool people will want to bookmark/link to specific entries of)
actually works on a cold page load, not just in-session navigation.
