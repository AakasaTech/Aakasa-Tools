'use client';

import type { ReactNode } from 'react';
import { TOOL_REGISTRY, type ToolCategory } from './registry';
import { Breadcrumb } from './Breadcrumb';
import { TierBadge } from './TierBadge';
import { ProUpsellBanner } from './ProUpsellBanner';
import { FaqAccordion } from './FaqAccordion';
import { RelatedToolsRail } from './RelatedToolsRail';
import { LockIcon } from './icons';

export interface ToolShellProps {
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
  children: ReactNode;
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
  const related = TOOL_REGISTRY.filter((tool) => relatedTools.includes(tool.slug));

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
        <p className="max-w-2xl text-base text-ink/70 dark:text-paper/70">{description}</p>
      </header>

      <p className="mt-4 flex items-center gap-2 text-sm text-ink/50 dark:text-paper/50">
        <LockIcon className="h-4 w-4" aria-hidden />
        Runs entirely in your browser. Nothing you enter is uploaded or stored.
      </p>

      {/* Signature: 2px accent left-edge rule on the tool's own card */}
      <section className="mt-6 rounded-lg border-y border-r border-l-2 border-ink/10 border-l-accent bg-paper pl-4 shadow-sm dark:border-paper/10 dark:bg-ink">
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
