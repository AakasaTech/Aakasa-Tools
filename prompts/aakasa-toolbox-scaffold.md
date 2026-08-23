# Aakasa Toolbox — Monorepo Structure & Scaffolding Prompt

## 1. Repo / Route Structure

Using Next.js (App Router) so free tools get SEO via SSG, and Pro features can later add auth without a rewrite.

```
aakasa-toolbox/
├── apps/
│   └── web/                          # aakasa.dev/tools
│       ├── app/
│       │   ├── tools/
│       │   │   ├── json-formatter/
│       │   │   │   ├── page.tsx      # SSG page, SEO metadata
│       │   │   │   └── JsonFormatter.tsx  # client component (all logic here)
│       │   │   ├── password-generator/
│       │   │   ├── qr-code-generator/
│       │   │   ├── image-compressor/
│       │   │   ├── background-remover/
│       │   │   ├── word-counter/
│       │   │   ├── base64-tool/
│       │   │   ├── regex-tester/
│       │   │   ├── color-palette/
│       │   │   ├── csv-json-converter/
│       │   │   ├── unit-converter/
│       │   │   ├── invoice-generator/
│       │   │   ├── uuid-hash-generator/
│       │   │   ├── meta-tag-previewer/
│       │   │   └── csv-viewer/
│       │   ├── layout.tsx            # global shell: nav, footer, theme
│       │   └── page.tsx              # toolbox landing/index page
│       ├── public/
│       └── next.config.js
├── packages/
│   ├── ui/                           # shared design system (buttons, cards, inputs, CopyButton, FileDropzone)
│   ├── tool-shell/                   # shared layout wrapper every tool page uses:
│   │                                 #   title, description, "how it works" blurb,
│   │                                 #   related tools footer, ad slot (if any), Pro upsell banner
│   ├── analytics/                    # thin wrapper around Plausible/PostHog (privacy-friendly, no PII)
│   └── config/                       # shared eslint/tsconfig/tailwind config
├── turbo.json                        # Turborepo for build caching across 15+ tool packages
└── package.json
```

**Key architectural decisions:**
- **Every tool is 100% client-side** (`"use client"` component) — no API routes, no data leaves the browser, so `page.tsx` only handles metadata/SEO and renders the client component.
- **Shared `tool-shell` package** enforces UI consistency across all 100 tools without copy-pasting layout code — critical once you're past tool #10.
- **Pro-gated tools** (background remover, batch image compression, invoice generator with saved templates) get a lightweight `packages/auth` later using Clerk or Supabase Auth — this is the *only* place a server enters the picture, and even then it stores account/entitlement data, never user file content.
- **Turborepo** so CI only rebuilds/tests tools that changed, not all 100.

---

## 2. Claude Code Prompt — Tool #1 Template (JSON Formatter)

Use this as the first prompt in Claude Code from the repo root. It's written so the same prompt pattern (swap the tool name/logic) becomes your repeatable template for tools #2–100.

```
Build a new tool page for the Aakasa Toolbox monorepo: JSON Formatter & Validator.

CONTEXT:
- This is apps/web/app/tools/json-formatter/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- Shared components live in packages/ui and packages/tool-shell — use them, don't
  rebuild layout/nav/footer from scratch. If packages/tool-shell doesn't exist yet,
  create it first as a minimal <ToolShell title, description, children> wrapper
  with a heading, short description, and a slot for the tool UI.
- 100% client-side. No API calls, no server actions, no data storage anywhere.
  Assume the user's input may be sensitive — nothing should ever leave the browser.

REQUIREMENTS:
1. page.tsx (server component):
   - Static metadata for SEO: title "JSON Formatter & Validator - Free Online Tool | Aakasa Toolbox",
     description under 160 chars, canonical URL, OG tags.
   - Renders <JsonFormatter /> inside <ToolShell>.

2. JsonFormatter.tsx (client component, "use client"):
   - Two-pane layout: raw input textarea (left/top) and formatted output (right/bottom),
     responsive to single column on mobile.
   - Real-time validation as the user types (debounced ~300ms) — show inline error with
     line/column number if JSON is invalid, don't just fail silently.
   - Format button + auto-format toggle.
   - Minify button (collapse to single line).
   - Indent size selector (2 / 4 / tab).
   - Copy-to-clipboard button on output (use packages/ui's CopyButton if it exists,
     otherwise build a reusable one there).
   - Download as .json file button.
   - Clear/reset button.
   - Tree view toggle: render formatted JSON as a collapsible tree (key/value,
     expandable objects/arrays) as an alternative to raw text view.
   - Sample data button (loads a placeholder JSON example) for first-time users.
   - Character/byte size counter for input and output.
   - Dark mode support via existing Tailwind theme config.
   - Fully keyboard accessible; textarea should support Tab key inserting spaces,
     not losing focus.

3. Error handling:
   - Never crash on malformed input — catch JSON.parse errors and surface a
     human-readable message ("Unexpected token } at line 4, column 12") rather than
     a raw stack trace.

4. Performance:
   - Use a Web Worker for parsing/formatting if input exceeds ~500KB, so the UI
     thread doesn't freeze on large paste operations.

5. Add a short "How it works" / FAQ section below the tool (for SEO content depth,
   ~150-200 words) explaining what JSON formatting is and common use cases —
   written for a developer audience, plain and factual, no fluff.

6. Add this tool to the toolbox index page (apps/web/app/page.tsx) tool list/grid
   if that file exists.

Write clean, typed TypeScript. No `any`. Extract the JSON parsing/formatting logic
into a separate pure-function utility file (utils/jsonFormat.ts) so it's unit-testable
and reusable if another tool (e.g. JSON-to-TS converter) needs the same parser.

After building, list what you built and flag anything that should move into
packages/ui or packages/tool-shell for reuse by future tools.
```

---

## 3. How to reuse this for tools #2–100

For each subsequent tool, swap only:
- The tool name/route/metadata
- Section 2's functional requirements (the actual tool logic)
- Whether it needs a Web Worker (only for compute-heavy ones: image compression, hashing large files, CSV parsing of big files)

Everything else — the `ToolShell` usage instruction, the "100% client-side, nothing leaves the browser" constraint, the CopyButton/download pattern, dark mode, accessibility, FAQ section — stays identical. That consistency is what makes Claude Code fast on tool #20 vs. tool #2: it already knows your conventions from the shared packages.

**Suggested build order** (matches the MVP shortlist, easiest → hardest):
1. JSON Formatter *(template above)*
2. Password Generator
3. UUID/Hash Generator
4. Word/Character Counter
5. Base64 Encoder/Decoder
6. Unit Converter
7. QR Code Generator
8. Regex Tester
9. Color Palette Generator/Extractor
10. CSV ↔ JSON Converter
11. CSV Viewer/Cleaner
12. Meta Tag / OG Previewer
13. Image Compressor *(first one needing WASM codec + Web Worker)*
14. Invoice Generator *(first one worth linking to BillCraft AI signup)*
15. Background Remover *(first Pro-gated, ML-model tool — build auth/entitlements here)*
