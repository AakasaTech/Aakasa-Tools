import Link from 'next/link';
import { CATEGORY_LABELS, LockIcon, RelatedToolsRail, TOOL_REGISTRY, type ToolCategory } from '@aakasa/tool-shell';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveToolsSection />
      <CategorySection />
      <WhySection />
      <CtaSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 py-24 text-center sm:py-32">
      <span className="rounded-full border border-accent/40 bg-accent/[0.08] px-3 py-1.5 text-sm font-medium text-accent">
        Free &middot; 100% client-side
      </span>
      <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        100 browser tools.
        <br />
        Nothing leaves your browser.
      </h1>
      <p className="max-w-lg text-lg text-ink/70 dark:text-paper/70">
        Format JSON, generate secure passwords, compute hashes, and more — instantly, free, with
        zero signup. Everything runs client-side, always.
      </p>
      <Link
        href="/tools"
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90"
      >
        Browse all tools
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/50 dark:text-paper/50">
        <LockIcon className="h-3.5 w-3.5" aria-hidden />
        Runs entirely in your browser. Nothing you enter is uploaded or stored.
      </p>
    </section>
  );
}

function LiveToolsSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          {TOOL_REGISTRY.length} tool{TOOL_REGISTRY.length === 1 ? '' : 's'} live today
        </h2>
        <Link href="/tools" className="text-sm hover:text-accent">
          View all &rarr;
        </Link>
      </div>
      <RelatedToolsRail tools={TOOL_REGISTRY} />
    </section>
  );
}

function CategorySection() {
  const counts = TOOL_REGISTRY.reduce<Partial<Record<ToolCategory, number>>>((acc, tool) => {
    acc[tool.category] = (acc[tool.category] ?? 0) + 1;
    return acc;
  }, {});

  const categories = (Object.keys(CATEGORY_LABELS) as ToolCategory[]).sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)
  );

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
        Building toward 100 tools
      </h2>
      <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
        Across 8 categories — one is live, the rest are on the way.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const count = counts[category] ?? 0;
          const isLive = count > 0;
          return (
            <div
              key={category}
              className={
                isLive
                  ? 'rounded-lg border border-accent/30 bg-accent/[0.06] p-4'
                  : 'rounded-lg border border-dashed border-ink/15 p-4 dark:border-paper/15'
              }
            >
              <div
                className={
                  isLive
                    ? 'text-sm font-medium text-ink dark:text-paper'
                    : 'text-sm font-medium text-ink/70 dark:text-paper/70'
                }
              >
                {CATEGORY_LABELS[category]}
              </div>
              <div className={isLive ? 'mt-1 text-xs text-accent' : 'mt-1 text-xs text-ink/40 dark:text-paper/40'}>
                {isLive ? `${count} tool${count === 1 ? '' : 's'} live` : 'Coming soon'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const WHY_ITEMS = [
  {
    title: '100% client-side',
    description: 'No API routes, no server actions, no database. Whatever you paste in never leaves your browser.',
    icon: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    title: 'No account, ever',
    description: 'Every tool works instantly. No signup, no email, no paywall on the core toolset.',
    icon: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
  },
  {
    title: 'Built for developers',
    description: 'Keyboard accessible, fast, no ads or clutter — the way a tool page should be.',
    icon: (
      <>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </>
    ),
  },
];

function WhySection() {
  return (
    <section className="mx-auto max-w-5xl border-t border-ink/10 px-6 py-12 dark:border-paper/10">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {WHY_ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="h-5 w-5 text-accent"
              aria-hidden
            >
              {item.icon}
            </svg>
            <div className="font-medium text-ink dark:text-paper">{item.title}</div>
            <p className="text-sm leading-relaxed text-ink/60 dark:text-paper/60">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent/20 bg-accent/[0.08] px-8 py-10 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          Pick a tool and get to work
        </h2>
        <Link
          href="/tools"
          className="inline-flex items-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90"
        >
          Explore all tools
        </Link>
      </div>
    </section>
  );
}
