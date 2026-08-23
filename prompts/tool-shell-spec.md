# packages/tool-shell — Component Spec

## Purpose
Single shared layout wrapper every one of the 100 tool pages renders inside. Owns:
page chrome (nav/footer), SEO-adjacent content blocks (title, description, FAQ),
Pro upsell slot, and related-tools cross-linking — so individual tool components
only ever contain their own functional UI.

## Design tokens (packages/config/tailwind, referenced here)
```
colors:
  ink:      '#0B0D12'   // primary text / dark bg
  paper:    '#F7F7F5'   // light bg
  accent:   '#5B6EF5'   // indigo — actions, links, focus rings, the edge-rule signature
  success:  '#1BA672'   // copy/success states
  danger:   '#E8543A'   // errors only — never decorative

fonts:
  display: 'Space Grotesk'   // h1/h2, tool titles
  body:    'Inter'           // paragraphs, labels, buttons
  mono:    'JetBrains Mono'  // ALL tool input/output — this is the signature
```

## Props API

```typescript
interface ToolShellProps {
  /** Tool name, e.g. "JSON Formatter & Validator" */
  title: string;
  /** One-line value prop, ~60-100 chars, shown under title */
  description: string;
  /** Category badge, e.g. "Developer Tools" — links to /tools?category=... */
  category: ToolCategory;
  /** Free | Pro — renders badge + upsell banner if 'pro' */
  tier: 'free' | 'pro';
  /** Slugs of 3-4 related tools for the footer cross-link rail */
  relatedTools: string[];
  /** Optional FAQ/how-it-works content, rendered below the tool UI for SEO depth */
  faq?: { question: string; answer: string }[];
  /** The actual tool UI */
  children: React.ReactNode;
}

type ToolCategory =
  | 'text-writing' | 'developer' | 'color-design' | 'image'
  | 'pdf' | 'calculators' | 'data-files' | 'seo-marketing';
```

## Layout structure (top to bottom)

1. **Breadcrumb** — `Toolbox / {category} / {title}` (SEO + orientation)
2. **Header block** — `title` (display font, text-3xl), `description` beneath (body font, text-muted), tier badge inline (Free = quiet gray pill, Pro = accent-filled pill)
3. **Privacy note** — small, permanent, same wording on all 100 tools:
   *"Runs entirely in your browser. Nothing you enter is uploaded or stored."*
   This is a trust/differentiation signal — make it a real UI element, not fine print.
4. **`children`** — the tool itself, in a bordered card with the 2px accent left-edge rule (the layout signature)
5. **Pro upsell banner** (only if `tier === 'pro'` AND user not entitled) — one line + CTA, dismissible, never a modal/interrupt
6. **FAQ section** (if provided) — `<details>`-based accordion, plain semantic HTML for crawlability
7. **Related tools rail** — 3-4 cards linking to `relatedTools` slugs, pulled from a static tool registry (see below)
8. **Footer** — shared site footer (packages/ui), not rebuilt per tool

## Supporting piece: tool registry

Create `packages/tool-shell/registry.ts` — a single static array as the source of truth for every tool's metadata (slug, title, category, tier, icon). `ToolShell` reads from this to resolve `relatedTools` slugs into full cards, and the toolbox index page (`/tools`) reads the same array to render its grid. This avoids duplicating tool metadata in 100 different `page.tsx` files.

```typescript
export interface ToolMeta {
  slug: string;
  title: string;
  shortDescription: string;
  category: ToolCategory;
  tier: 'free' | 'pro';
}

export const TOOL_REGISTRY: ToolMeta[] = [
  { slug: 'json-formatter', title: 'JSON Formatter & Validator',
    shortDescription: 'Format, validate, and minify JSON instantly.',
    category: 'developer', tier: 'free' },
  // ...append one entry per tool as it's built
];
```

## Component implementation

```tsx
// packages/tool-shell/ToolShell.tsx
'use client';

import { TOOL_REGISTRY, type ToolCategory } from './registry';
import { Breadcrumb } from './Breadcrumb';
import { TierBadge } from './TierBadge';
import { ProUpsellBanner } from './ProUpsellBanner';
import { FaqAccordion } from './FaqAccordion';
import { RelatedToolsRail } from './RelatedToolsRail';

interface ToolShellProps {
  title: string;
  description: string;
  category: ToolCategory;
  tier: 'free' | 'pro';
  relatedTools: string[];
  faq?: { question: string; answer: string }[];
  children: React.ReactNode;
}

export function ToolShell({
  title,
  description,
  category,
  tier,
  relatedTools,
  faq,
  children,
}: ToolShellProps) {
  const related = TOOL_REGISTRY.filter((t) => relatedTools.includes(t.slug));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Breadcrumb category={category} title={title} />

      <header className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">
            {title}
          </h1>
          <TierBadge tier={tier} />
        </div>
        <p className="max-w-2xl text-base text-ink/70 dark:text-paper/70">
          {description}
        </p>
      </header>

      <p className="mt-4 flex items-center gap-2 text-sm text-ink/50 dark:text-paper/50">
        <LockIcon className="h-4 w-4" aria-hidden />
        Runs entirely in your browser. Nothing you enter is uploaded or stored.
      </p>

      {/* Signature: 2px accent left-edge rule on the tool's own card */}
      <section
        className="mt-6 rounded-lg border border-ink/10 bg-paper pl-4 shadow-sm
                   dark:border-paper/10 dark:bg-ink"
        style={{ borderLeft: '2px solid #5B6EF5' }}
      >
        <div className="py-6 pr-4">{children}</div>
      </section>

      {tier === 'pro' && <ProUpsellBanner toolTitle={title} />}

      {faq && faq.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-paper">
            How it works
          </h2>
          <FaqAccordion items={faq} />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-paper">
            Related tools
          </h2>
          <RelatedToolsRail tools={related} />
        </section>
      )}
    </main>
  );
}
```

## Sub-components to scaffold alongside it

- `Breadcrumb.tsx` — plain text trail, category links to `/tools?category=`
- `TierBadge.tsx` — `free`: `bg-ink/5 text-ink/60`; `pro`: `bg-accent text-white`, small lock/star icon
- `ProUpsellBanner.tsx` — one-liner, e.g. *"This is a Pro tool. [Upgrade] for unlimited use."*, dismissible via local component state (not persisted — no localStorage per your artifact constraints if this shell is ever previewed as an artifact; in the real Next.js app this can use a cookie)
- `FaqAccordion.tsx` — native `<details>/<summary>`, no JS animation library needed
- `RelatedToolsRail.tsx` — horizontal scroll on mobile, 3-4 col grid on desktop, each card = icon + title + one-line description, links to `/tools/{slug}`

## Notes for Claude Code prompt when scaffolding this

Feed the whole spec above verbatim as context, then add:
> Build packages/tool-shell as described. Use Tailwind classes matching the token
> names above (extend tailwind.config with the ink/paper/accent/success/danger
> colors and display/body/mono font families first). Keep every sub-component
> small and single-purpose. No client-side data persistence anywhere in this
> package — the ProUpsellBanner's dismiss state resets on reload unless a
> deliberate cookie is added later for the real (non-artifact) app.
