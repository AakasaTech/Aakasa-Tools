'use client';

import { useMemo, useState, type ReactNode, type SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_LABELS, CategoryIcon, TOOL_REGISTRY, TierBadge, type ToolCategory, type ToolMeta } from '@aakasa/tool-shell';

interface ToolsExplorerProps {
  initialCategory?: ToolCategory;
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ToolCategory[];

function matchesQuery(tool: ToolMeta, query: string): boolean {
  return (
    tool.title.toLowerCase().includes(query) ||
    tool.shortDescription.toLowerCase().includes(query) ||
    CATEGORY_LABELS[tool.category].toLowerCase().includes(query)
  );
}

export function ToolsExplorer({ initialCategory }: ToolsExplorerProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(initialCategory ?? null);
  const [query, setQuery] = useState('');

  const countsByCategory = useMemo(() => {
    const counts = new Map<ToolCategory, number>();
    for (const tool of TOOL_REGISTRY) {
      counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  // Busiest categories first — matches the ordering the homepage's category
  // teaser already uses, so the two pages present tools consistently.
  const orderedCategories = useMemo(
    () => [...ALL_CATEGORIES].sort((a, b) => (countsByCategory.get(b) ?? 0) - (countsByCategory.get(a) ?? 0)),
    [countsByCategory],
  );

  function selectCategory(category: ToolCategory | null) {
    setSelectedCategory(category);
    router.replace(category ? `/tools?category=${category}` : '/tools', { scroll: false });
  }

  function clearFilters() {
    setQuery('');
    selectCategory(null);
  }

  const trimmedQuery = query.trim().toLowerCase();
  const visibleTools = TOOL_REGISTRY.filter((tool) => {
    if (selectedCategory && tool.category !== selectedCategory) return false;
    if (trimmedQuery && !matchesQuery(tool, trimmedQuery)) return false;
    return true;
  });

  const groups = orderedCategories
    .map((category) => ({ category, tools: visibleTools.filter((tool) => tool.category === category) }))
    .filter((group) => group.tools.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40 dark:text-paper/40"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools…"
            aria-label="Search tools"
            className="w-full rounded-md border border-ink/10 bg-paper py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip active={selectedCategory === null} onClick={() => selectCategory(null)}>
            All <span className="opacity-60">({TOOL_REGISTRY.length})</span>
          </CategoryChip>
          {orderedCategories.map((category) => {
            const count = countsByCategory.get(category) ?? 0;
            if (count === 0) return null;
            return (
              <CategoryChip key={category} active={selectedCategory === category} onClick={() => selectCategory(category)}>
                <CategoryIcon category={category} className="h-3.5 w-3.5" aria-hidden />
                {CATEGORY_LABELS[category]} <span className="opacity-60">({count})</span>
              </CategoryChip>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50 dark:border-paper/15 dark:text-paper/50">
          No tools match {trimmedQuery ? `“${query.trim()}”` : 'this filter'}.{' '}
          <button type="button" onClick={clearFilters} className="font-medium text-accent hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CategoryIcon category={group.category} className="h-5 w-5 text-accent" aria-hidden />
              <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">
                {CATEGORY_LABELS[group.category]}
              </h2>
              <span className="text-sm text-ink/40 dark:text-paper/40">{group.tools.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-ink/10 text-ink/70 hover:border-accent/40 hover:text-ink dark:border-paper/10 dark:text-paper/70 dark:hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}

function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 text-sm transition-colors hover:border-accent/40 dark:border-paper/10"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 font-display text-sm font-semibold text-accent"
          aria-hidden
        >
          {tool.title.charAt(0)}
        </span>
        {tool.tier === 'pro' && <TierBadge tier="pro" />}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-ink dark:text-paper">{tool.title}</span>
        <span className="text-ink/60 dark:text-paper/60">{tool.shortDescription}</span>
      </div>
    </Link>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
