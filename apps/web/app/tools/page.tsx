import type { Metadata } from 'next';
import { CATEGORY_LABELS, TOOL_REGISTRY, type ToolCategory } from '@aakasa/tool-shell';
import { ToolsExplorer } from './ToolsExplorer';

export const metadata: Metadata = {
  title: 'All Tools | Aakasa Toolbox',
  description: 'Browse every free, client-side browser tool in the Aakasa Toolbox, organized by category.',
};

function isToolCategory(value: string): value is ToolCategory {
  return value in CATEGORY_LABELS;
}

interface ToolsIndexPageProps {
  searchParams: { category?: string };
}

export default function ToolsIndexPage({ searchParams }: ToolsIndexPageProps) {
  const requested = searchParams.category;
  const initialCategory = requested && isToolCategory(requested) ? requested : undefined;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">Tools</h1>
      <p className="mt-2 text-base text-ink/70 dark:text-paper/70">
        {TOOL_REGISTRY.length} tool{TOOL_REGISTRY.length === 1 ? '' : 's'}, organized by category — search or filter
        to find the one you need.
      </p>

      <div className="mt-8">
        <ToolsExplorer initialCategory={initialCategory} />
      </div>
    </div>
  );
}
