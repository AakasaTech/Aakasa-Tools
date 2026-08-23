# Claude Code Prompt — Bootstrap the Aakasa Toolbox Monorepo

Run this FIRST, before the tool-shell prompt or the JSON formatter prompt.
This just sets up the skeleton — no tool logic yet.

---

```
Initialize a new monorepo called "aakasa-toolbox" for a suite of 100 free/paid
client-side web utility tools (JSON formatter, password generator, image
compressor, etc.), to be hosted at aakasa.dev/tools/*.

ARCHITECTURE:
- Turborepo, npm/pnpm workspaces
- apps/web — Next.js 14, App Router, TypeScript, Tailwind CSS
  - Will eventually contain one route per tool at app/tools/{slug}/
  - For now, just set up the shell: root layout, a placeholder landing page
    at app/page.tsx, and app/tools/ as an empty directory ready for tool routes
- packages/ui — shared design primitives (Button, CopyButton, FileDropzone,
  Card). Leave empty except a placeholder index.ts and README for now — these
  get built alongside the first real tool, not speculatively.
- packages/tool-shell — will hold the shared <ToolShell> layout wrapper and
  the TOOL_REGISTRY. Leave empty except a placeholder for now; I'll scaffold
  this properly in the next prompt.
- packages/config — shared eslint config, tsconfig base, tailwind config/preset
- packages/analytics — placeholder wrapper for a privacy-friendly analytics
  provider (Plausible or PostHog), no implementation yet, just the interface
  shape: track(eventName: string, props?: Record<string, unknown>): void

CONSTRAINTS TO BAKE IN NOW (these apply to every future tool, so get them
right at the root config level):
- Every tool route is entirely client-side — no API routes, no server actions,
  no database, no file storage. Document this as a hard rule in the repo's
  root README so it's visible to anyone (including future me via Claude Code)
  working in any tool folder.
- Strict TypeScript (no `any`), ESLint + Prettier configured at the root and
  inherited by all workspaces.
- Tailwind config in packages/config should define these design tokens now,
  even though no tool uses them yet:
    colors: ink #0B0D12, paper #F7F7F5, accent #5B6EF5, success #1BA672,
            danger #E8543A
    fontFamily: display 'Space Grotesk', body 'Inter', mono 'JetBrains Mono'
  apps/web should extend this shared preset, not redefine its own.
- Dark mode via class strategy (Tailwind's `dark:` variants), toggle to be
  built later but the config should support it from the start.

DEPLOYMENT TARGET:
- Vercel, static/SSG-friendly since every tool page is just a client component
  wrapped in a mostly-static page shell. Add a vercel.json only if needed —
  don't add config for things we're not using yet (no env vars, no serverless
  functions).

SETUP TASKS:
1. Root package.json, turbo.json, workspace config.
2. apps/web with a minimal working Next.js app — root layout with basic nav
   ("Aakasa Toolbox" wordmark, placeholder "Tools" link) and footer, plus a
   landing page that just says "100 browser tools, coming soon" so I have
   something to `npm run dev` and confirm works end to end.
3. Empty-but-real packages/ui, packages/tool-shell, packages/config,
   packages/analytics with valid package.json + index.ts stubs so workspace
   linking works when I build into them next.
4. Root README.md documenting: the project's purpose, the "100% client-side,
   nothing stored server-side" principle, the repo structure, and how to add
   a new tool (placeholder section — I'll fill this in properly once the
   first tool exists as a real example).
5. .gitignore, .nvmrc (use latest Node LTS), and a basic GitHub Actions
   workflow that runs lint + typecheck + build on PRs (no deploy step yet).

After setup, run `npm run dev` (or the workspace equivalent) yourself to
confirm apps/web boots cleanly with no errors, and tell me the exact commands
I'll use day-to-day (dev, build, lint, add a new workspace package).

Do NOT build any actual tool logic, the ToolShell component, or any UI
primitives yet — this prompt is scaffolding only. I'll follow up with a
separate prompt to build packages/tool-shell, then another for the first
real tool.
```

---

## Why this ordering

Bootstrapping the empty-but-real skeleton first (rather than jumping straight
to `tool-shell`) means Claude Code confirms the workspace linking, Tailwind
preset inheritance, and build pipeline all work *before* any real component
code depends on them — much easier to debug an empty `npm run dev` failure
than one buried under your first 200 lines of component code.

## Your 3-prompt sequence, in order

1. **This prompt** → empty monorepo skeleton, confirmed working
2. **tool-shell-spec.md prompt** (already drafted) → builds `packages/tool-shell` and `packages/ui`'s first real primitives
3. **json-formatter-claude-code-prompt.md** (already drafted) → first real tool, consuming both of the above

After tool #1 ships, every tool after it only needs a prompt shaped like #3.
