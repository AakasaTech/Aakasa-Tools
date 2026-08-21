import Link from 'next/link';
import type { ToolMeta } from './registry';

interface RelatedToolsRailProps {
  tools: ToolMeta[];
}

export function RelatedToolsRail({ tools }: RelatedToolsRailProps) {
  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4">
      {tools.map((tool) => (
        <Link
          key={tool.slug}
          href={`/tools/${tool.slug}`}
          className="flex min-w-[220px] flex-col gap-2 rounded-lg border border-ink/10 p-4 text-sm transition-colors hover:border-accent/40 sm:min-w-0 dark:border-paper/10"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 font-display text-sm font-semibold text-accent"
            aria-hidden
          >
            {tool.title.charAt(0)}
          </span>
          <span className="font-medium text-ink dark:text-paper">{tool.title}</span>
          <span className="text-ink/60 dark:text-paper/60">{tool.shortDescription}</span>
        </Link>
      ))}
    </div>
  );
}
