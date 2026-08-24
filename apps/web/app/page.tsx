import type { SVGProps } from 'react';
import Link from 'next/link';
import { CATEGORY_LABELS, CategoryIcon, LockIcon, TOOL_REGISTRY, type ToolCategory } from '@aakasa/tool-shell';

export default function HomePage() {
  return (
    <>
      <HeroSection />
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

// Categories fulfilled by a separate, dedicated app rather than a route in
// this repo's TOOL_REGISTRY — PDF tools live at PDFCraft, not app/tools/pdf-*.
const EXTERNAL_CATEGORY_URLS: Partial<Record<ToolCategory, string>> = {
  pdf: 'https://pdfcraft.aakasa.dev',
};

function CategorySection() {
  const counts = TOOL_REGISTRY.reduce<Partial<Record<ToolCategory, number>>>((acc, tool) => {
    acc[tool.category] = (acc[tool.category] ?? 0) + 1;
    return acc;
  }, {});

  const categories = (Object.keys(CATEGORY_LABELS) as ToolCategory[]).sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)
  );

  const liveCategoryCount = categories.filter((category) => (counts[category] ?? 0) > 0).length;
  const hasExternalCategory = categories.some((category) => EXTERNAL_CATEGORY_URLS[category]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">Building toward 100 tools</h2>
      <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
        Across {categories.length} categories — {liveCategoryCount} live here
        {hasExternalCategory ? ', plus PDF tools at a dedicated app' : ''}, the rest on the way.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const count = counts[category] ?? 0;
          const isLive = count > 0;
          const externalUrl = EXTERNAL_CATEGORY_URLS[category];
          const isAvailable = isLive || !!externalUrl;

          const cardClasses = isAvailable
            ? 'flex flex-col gap-1 rounded-lg border border-accent/30 bg-accent/[0.06] p-4 transition-colors hover:border-accent/60'
            : 'flex flex-col gap-1 rounded-lg border border-dashed border-ink/15 p-4 dark:border-paper/15';

          const statusText = isLive
            ? `${count} tool${count === 1 ? '' : 's'} live`
            : externalUrl
              ? 'Available at PDFCraft'
              : 'Coming soon';

          const content = (
            <>
              <div className="flex items-center gap-1.5">
                <CategoryIcon
                  category={category}
                  className={isAvailable ? 'h-4 w-4 text-accent' : 'h-4 w-4 text-ink/40 dark:text-paper/40'}
                  aria-hidden
                />
                {externalUrl && <ExternalLinkIcon className="ml-auto h-3 w-3 text-accent/60" aria-hidden />}
              </div>
              <div
                className={
                  isAvailable
                    ? 'text-sm font-medium text-ink dark:text-paper'
                    : 'text-sm font-medium text-ink/70 dark:text-paper/70'
                }
              >
                {CATEGORY_LABELS[category]}
              </div>
              <div className={isAvailable ? 'text-xs text-accent' : 'text-xs text-ink/40 dark:text-paper/40'}>
                {statusText}
              </div>
            </>
          );

          if (isLive) {
            return (
              <Link key={category} href={`/tools?category=${category}`} className={cardClasses}>
                {content}
              </Link>
            );
          }

          if (externalUrl) {
            return (
              <a key={category} href={externalUrl} target="_blank" rel="noopener noreferrer" className={cardClasses}>
                {content}
              </a>
            );
          }

          return (
            <div key={category} className={cardClasses}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
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
