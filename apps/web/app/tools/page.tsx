import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORY_LABELS, TOOL_REGISTRY } from '@aakasa/tool-shell';

export const metadata: Metadata = {
  title: 'All Tools | Aakasa Toolbox',
  description: 'Browse every free, client-side browser tool in the Aakasa Toolbox.',
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">Tools</h1>
      <p className="mt-2 text-base text-ink/70 dark:text-paper/70">
        {TOOL_REGISTRY.length} tool{TOOL_REGISTRY.length === 1 ? '' : 's'} so far — 100 coming.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOL_REGISTRY.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 text-sm transition-colors hover:border-accent/40 dark:border-paper/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink dark:text-paper">{tool.title}</span>
              {tool.tier === 'pro' && (
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                  Pro
                </span>
              )}
            </div>
            <span className="text-ink/60 dark:text-paper/60">{tool.shortDescription}</span>
            <span className="text-xs text-ink/40 dark:text-paper/40">
              {CATEGORY_LABELS[tool.category]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
