# Claude Code Prompt — Build Tool #65: Slug Generator

Run after tool-shell and tools #1-64 exist. Closes the dangling
'slug-generator' reference from Case Converter. Simple transform with one
real internationalization consideration.

---

```
Build the Slug Generator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/slug-generator/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string transform. Use the native
  String.prototype.normalize('NFD') Unicode normalization approach to
  correctly strip diacritics/accents (e.g. "café" → "cafe", "Müller" →
  "muller") rather than a hand-maintained character-replacement map, which
  would only cover a subset of accented characters — the normalize-then-
  strip-combining-marks technique is a standard, complete approach for this.
- Design tokens as established. Input/output in font-mono.

STEP 1 — Register:
  { slug: 'slug-generator', title: 'Slug Generator',
    shortDescription: 'Convert text into clean, URL-friendly slugs instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['case-converter', 'url-encoder-decoder', 'utm-link-builder']. FAQ
(3-4 Q&A): what a URL slug is and why it matters (clean, readable,
SEO-friendly URL segments — e.g. turning "My Blog Post Title!" into
"my-blog-post-title"), how accented/non-Latin characters are handled
(explain the transliteration/stripping approach plainly, and be honest
that fully non-Latin scripts, e.g. Chinese or Arabic text, don't have a
meaningful Latin-character "slug" equivalent — the tool will strip what it
can't transliterate, which may produce a very short or empty result for
non-Latin input, worth stating this limitation rather than pretending
universal support), and the privacy note.

STEP 3 — SlugGenerator.tsx:
- Input textarea or single-line input (a slug is typically generated from
  a single title/phrase, though supporting multi-line input to batch-
  generate several slugs at once — one per line — is a nice, low-effort
  addition worth including).
- Live-generated slug output as the input changes.
- Options:
  - Separator character: hyphen (default, the near-universal convention)
    or underscore.
  - Lowercase enforcement (default ON — slugs are conventionally all
    lowercase; allow disabling for edge cases where mixed case is
    intentionally wanted, though hyphen-default lowercase should remain
    the primary behavior).
  - Max length (optional numeric input — truncates the slug to a maximum
    character length, breaking at a word/separator boundary rather than
    mid-word, useful for platforms with slug length constraints).
  - Remove stop words (optional toggle — strips common words like "a,"
    "the," "and," "of" from the slug for a shorter, cleaner result; keep
    this OFF by default since removing words changes the actual title
    content represented in the URL, which not everyone wants, but offer it
    as an option for those who do).
- CopyButton on the output (per-line if batch mode produced multiple
  slugs).

STEP 4 — Logic separation: apps/web/app/tools/slug-generator/utils/
generateSlug.ts — generateSlug(text: string, options: { separator: '-' |
'_'; lowercase: boolean; maxLength?: number; removeStopWords: boolean }):
string, implementing: Unicode NFD normalization + combining-mark stripping
(per CONTEXT) for accent removal, non-alphanumeric character replacement
with the chosen separator, collapsing multiple consecutive separators into
one, trimming leading/trailing separators, and the optional stop-word
removal and max-length truncation (at a separator boundary, not mid-word).
Pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm accented characters are correctly transliterated — test with
   input like "Café dé Paris — Résumé" and state the actual generated
   slug output, confirming accents are stripped to their base Latin
   letters rather than being dropped entirely or left as broken characters.
2. Confirm max-length truncation breaks at a separator boundary rather than
   mid-word — test with a long input and a short max-length setting, and
   confirm the output doesn't end with a partial/cut-off word.
3. State what happens with genuinely non-Latin input (e.g. a phrase in
   Japanese or Arabic) — confirm the behavior matches the honest limitation
   described in the FAQ (graceful degradation to a short/empty result)
   rather than crashing or producing garbled output.
```

## Note
**Unicode normalization for accent-stripping is the one piece of logic
worth getting right rather than hand-rolling** — the NFD-normalize-then-
strip-combining-marks technique correctly handles the vast majority of
Latin-script accented characters in one general approach, whereas a manual
character-replacement map (é→e, ñ→n, etc.) would need to enumerate dozens
of cases and inevitably miss some. Worth confirming the general technique
was used rather than a partial hardcoded list.
