# Aakasa Toolbox

A suite of 100 free/paid browser utility tools (JSON formatter, password generator,
image compressor, and more), hosted at `aakasa.dev/tools/*`.

## The one hard rule

**Every tool is 100% client-side.** No API routes, no server actions, no database, no
file storage — ever. Whatever a user pastes, types, or uploads into a tool never leaves
their browser. This applies to every tool page under `apps/web/app/tools/`, with no
exceptions, and it applies to any future tool added to this repo. If a feature seems to
need a server, it either doesn't belong in `apps/web/app/tools/`, or it needs an explicit
architecture decision (see `packages/tool-shell`'s eventual Pro-gating notes) before it's
built — don't quietly add an API route to make something easier.

## Repo structure

```
aakasa-toolbox/
├── apps/
│   └── web/                 # aakasa.dev — Next.js 14 App Router app
│       ├── app/
│       │   ├── tools/       # one route per tool, e.g. app/tools/json-formatter/
│       │   ├── layout.tsx   # global shell: nav, footer, theme
│       │   └── page.tsx     # toolbox landing page
│       └── public/
├── packages/
│   ├── ui/                  # shared design primitives (Button, CopyButton, FileDropzone, Card)
│   ├── tool-shell/          # shared <ToolShell> layout wrapper + TOOL_REGISTRY
│   ├── analytics/           # privacy-friendly analytics wrapper (Plausible/PostHog), interface only
│   └── config/               # shared eslint config, tsconfig base, tailwind preset
├── turbo.json
└── package.json
```

`packages/ui`, `packages/tool-shell`, and `packages/analytics` are currently placeholders
— they get built out alongside the first real tool rather than speculatively ahead of
time.

## Commands

```bash
npm run dev         # start apps/web in dev mode
npm run build        # build all workspaces
npm run lint          # lint all workspaces
npm run typecheck     # typecheck all workspaces
npm run format        # format the repo with prettier
```

To add a new workspace package:

```bash
mkdir packages/<name>
```

then add a `package.json` with `"name": "@aakasa/<name>"` inside it — npm workspaces
picks it up automatically on the next `npm install` at the repo root, no other
registration needed.

## Design tokens

Colors, fonts, and dark mode are defined once in `packages/config/tailwind/preset.js`
and consumed by every app via `presets: [...]` in its own `tailwind.config.ts`. Don't
redefine colors or fonts locally in an app or tool — extend the shared preset.

## Deployment

Deployed to Vercel as a static/SSG Next.js app. No environment variables, no serverless
functions — every tool page is a client component wrapped in a static page shell.

## Adding a new tool

_(Placeholder — this section will be filled in with a real walkthrough once the first
tool, `packages/tool-shell`, and `packages/ui` exist as working examples.)_
