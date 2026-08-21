'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProUpsellBannerProps {
  toolTitle: string;
}

/**
 * Dismiss state is local component state only — it resets on reload. A
 * deliberate cookie can be added later for the real app; no persistence
 * belongs in this package until that's a considered decision.
 */
export function ProUpsellBanner({ toolTitle }: ProUpsellBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink dark:text-paper">
      <p>
        <span className="font-medium">{toolTitle}</span> is a Pro tool.{' '}
        <Link href="/pricing" className="font-medium text-accent hover:underline">
          Upgrade
        </Link>{' '}
        for unlimited use.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-ink/40 hover:text-ink/70 dark:text-paper/40 dark:hover:text-paper/70"
      >
        &times;
      </button>
    </div>
  );
}
