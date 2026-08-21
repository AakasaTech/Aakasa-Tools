import Link from 'next/link';
import { CATEGORY_LABELS, type ToolCategory } from './registry';

interface BreadcrumbProps {
  category: ToolCategory;
  title: string;
}

export function Breadcrumb({ category, title }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink/50 dark:text-paper/50">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/tools" className="hover:text-accent">
            Toolbox
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href={`/tools?category=${category}`} className="hover:text-accent">
            {CATEGORY_LABELS[category]}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-ink/70 dark:text-paper/70">
          {title}
        </li>
      </ol>
    </nav>
  );
}
