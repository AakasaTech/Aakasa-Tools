# Claude Code Prompt — Build Tool #24: SQL Query Formatter

Run after tool-shell and tools #1-23 exist. Straightforward wrapper around a
mature formatting library — low implementation risk, mostly UI work.

---

```
Build the SQL Query Formatter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/sql-formatter/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `sql-formatter` npm package (well-established,
  supports multiple SQL dialects) — install with `npm install sql-formatter`.
  Do not hand-roll SQL parsing/formatting — SQL dialect differences (MySQL,
  PostgreSQL, T-SQL, etc.) and keyword/clause formatting rules are exactly
  the kind of thing a mature library handles correctly.
- Design tokens as established; input/output panes in font-mono.

STEP 1 — Register:
  { slug: 'sql-formatter', title: 'SQL Query Formatter',
    shortDescription: 'Format and beautify SQL queries instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['json-formatter', 'regex-tester', 'json-to-typescript']. FAQ (3-4 Q&A):
what SQL formatting improves (readability of complex JOINs/subqueries,
consistent keyword casing/indentation for team consistency), which SQL
dialects are supported (list whatever sql-formatter's language option
actually supports — check its docs rather than guessing), a note that this
tool formats syntax only and does NOT validate that the query is
semantically correct or would actually run against a real database schema
(be explicit about this scope boundary), and the privacy note.

STEP 3 — SqlFormatter.tsx:
- Dialect selector: dropdown of supported dialects from sql-formatter (e.g.
  Standard SQL, MySQL, PostgreSQL, T-SQL/SQL Server, PL/SQL, BigQuery —
  match whatever the library actually exposes).
- Input textarea (font-mono), output panel (font-mono, read-only).
- Formatting options exposed by the library, surfaced as simple controls:
  - Keyword case (uppercase / lowercase / preserve)
  - Indent size
  - Comma placement (before/after, if the library supports it)
- Minify/compact toggle (collapse to single line, if supported — otherwise
  a simple whitespace-collapse fallback).
- CopyButton and Download (.sql) on output.
- Sample query button (a moderately complex example with a JOIN and WHERE
  clause, so the formatting value is visible immediately — a trivial
  single-table SELECT doesn't demonstrate the tool's value).
- Error handling: sql-formatter is generally lenient/best-effort rather than
  a strict parser that throws on invalid SQL — confirm its actual behavior
  on malformed input (does it throw, or does it just format whatever it can
  parse and leave the rest as-is?) and handle whichever behavior it
  actually has, rather than assuming a specific error-handling contract
  without checking.

STEP 4 — Logic separation: apps/web/app/tools/sql-formatter/utils/
formatSql.ts — formatQuery(sql: string, dialect: string, options:
FormatOptions): { result: string; error?: string }, wrapping sql-formatter.
Typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm sql-formatter's actual error-handling behavior on malformed SQL
   input (throws vs. best-effort partial formatting) and confirm the tool's
   error handling matches what the library actually does, rather than
   assuming.
2. List which dialects are actually available via the library's options and
   confirm the dialect selector's list matches exactly (don't show a
   dialect option that the installed library version doesn't actually
   support).
```

## Note
This is a low-risk, mostly-wrapper build — the main thing worth confirming
is that the dialect selector and error-handling assumptions in the UI
actually match sql-formatter's real API surface rather than a guessed one,
since library APIs and supported dialect lists can differ from what's
assumed without checking.
