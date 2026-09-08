# Claude Code Prompt — Build Tool #34: Font Pairing Previewer

Run after tool-shell and tools #1-33 exist. First tool needing web font
loading — introduces a real licensing/attribution consideration not present
in prior tools.

---

```
Build the Font Pairing Previewer for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/font-pairing/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side EXCEPT for loading actual web font files, which
  necessarily come from a font host — use Google Fonts (the standard,
  free, well-licensed source for this exact use case) loaded via their
  standard <link> or @import mechanism, or the `@fontsource` npm packages
  for the specific fonts you choose to support (prefer @fontsource
  packages if the font list is a fixed curated set, since it avoids a
  runtime dependency on Google's CDN being reachable and keeps font
  loading consistent with the rest of the app's bundling — pick whichever
  approach is simpler given how many fonts you're supporting, but note the
  choice in your summary). This is NOT a violation of the "100% client-side,
  nothing touches our server" principle — no user data is involved, this is
  just loading public font assets, conceptually similar to loading a shared
  CSS/JS dependency, not a privacy-relevant server interaction. Do not
  confuse this with the server-touching exception made for Meta Tag
  Previewer — that involved fetching user-provided URLs; this involves
  loading a small fixed catalog of font files, a fundamentally different
  and non-privacy-relevant kind of external resource.
- Design tokens as established, though the PREVIEW text itself should
  render in whatever fonts are being compared, not the toolbox's own
  font-display/font-body — this tool's whole purpose is showing other
  fonts clearly.

STEP 1 — Register:
  { slug: 'font-pairing', title: 'Font Pairing Previewer',
    shortDescription: 'Preview and compare Google Font pairings for headings and body text.',
    category: 'color-design', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['color-palette', 'css-gradient-generator', 'contrast-checker']. FAQ
(3-4 Q&A): what makes a good font pairing generally (contrast in style —
e.g. a distinctive display font for headings paired with a clean, highly
legible font for body text — rather than two very similar fonts, or two
extremely different/clashing ones), that all fonts shown here are from
Google Fonts and free for commercial use under their respective open
licenses (state this plainly since licensing is a genuine practical
question for anyone picking fonts for a real project), how to actually
implement a chosen pairing in a real website (brief mention of Google
Fonts' embed link or @fontsource package approach), and the privacy note
(clarify this refers to user input/data, not the font loading itself,
which is just fetching public assets).

STEP 3 — FontPairing.tsx:
- Curated font list: a reasonably broad but curated set (not literally all
  1000+ Google Fonts — pick roughly 40-60 well-regarded, broadly useful
  fonts spanning serif, sans-serif, display, and monospace categories) so
  the selection UI stays manageable and every included font is genuinely
  good quality, rather than including obscure or poorly-designed entries
  just for volume.
- Heading font selector and Body font selector (separate searchable
  dropdowns/comboboxes — reuse the searchable combobox pattern established
  in Unit Converter/Timestamp Converter if factored into packages/ui;
  check first), each showing the font name rendered IN that font within the
  dropdown option itself (so users can visually browse, not just read
  names) — this requires the font files to actually be loaded for preview
  purposes, which has a real performance cost if done naively for all 40-60
  fonts at once; lazy-load font files only as needed (e.g. load a font's
  file when it becomes visible/hovered in the dropdown, or load the full
  curated set progressively/in the background rather than blocking on all
  of them up front) rather than eagerly loading every candidate font's
  file on page load.
- Live preview area: a realistic mock content layout (a page title, a
  subheading, a paragraph or two of body text, maybe a button or small UI
  element) rendered with the selected heading/body font pairing — this
  should look like an actual sample of a real page, not just two isolated
  lines of text, since that's what actually helps someone judge a pairing.
- Font size controls: adjustable heading and body text sizes (sliders) so
  users can see the pairing at their actual intended scale, not just a
  fixed default size.
- "Randomize pairing" button — picks a random heading/body combination from
  the curated list, biased toward genuinely reasonable pairings if easy to
  encode (e.g. avoid pairing two very similar sans-serifs, or two
  competing display fonts) rather than fully uniform random selection;
  a simple heuristic (e.g. maintain a small curated list of category
  pairings known to work well — serif heading + sans body, display heading
  + serif body, etc. — and randomize within that structure) is preferable
  to pure randomness here, but don't over-engineer a sophisticated
  pairing-quality algorithm.
- Favorite/save pairings within the session (client-side state only, not
  persisted — resets on reload, consistent with the toolbox's established
  no-storage pattern) — a small list of pairings the user has starred while
  browsing, useful when comparing several candidates in one sitting.
- Export: generated CSS `@import`/`<link>` snippet for the Google Fonts
  embed of the chosen pairing, plus the corresponding `font-family` CSS
  declarations for heading/body — font-mono, CopyButton.

STEP 4 — Logic separation: apps/web/app/tools/font-pairing/utils/:
- fontCatalog.ts — the curated typed list of { name: string; category:
  'serif' | 'sans-serif' | 'display' | 'monospace'; googleFontsFamily:
  string } entries.
- pairingSuggestions.ts — a small typed structure encoding which category
  combinations are considered good pairings, used by the randomize
  heuristic described above.
- generateEmbedCode.ts — buildFontEmbedSnippet(headingFont, bodyFont):
  { linkTag: string; cssDeclarations: string }.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the lazy-loading approach for font previews in the dropdown —
   describe what was actually implemented and roughly how many font files
   get loaded on initial page load versus on-demand, since eagerly loading
   40-60 web fonts up front would be a genuinely bad first-load experience.
2. Confirm whether @fontsource packages or Google Fonts' hosted CDN link
   was used, and the reasoning.
3. Confirm the "randomize" heuristic actually avoids obviously poor pairings
   (test a handful of randomize clicks and describe whether the results
   looked like reasonable pairings or occasionally produced clashing/
   redundant combinations).
```

## Note
**Font loading performance is the real engineering concern here** — this is
a tool whose core interaction (browsing a font picker where each option
previews in its own font) inherently wants to load many font files, which
directly conflicts with fast page load if done naively. Lazy/progressive
loading isn't a nice-to-have here, it's necessary for the tool to feel
responsive rather than janky on first visit.
