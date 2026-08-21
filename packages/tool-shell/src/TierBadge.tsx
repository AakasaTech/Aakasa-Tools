import { StarIcon } from './icons';

interface TierBadgeProps {
  tier: 'free' | 'pro';
}

export function TierBadge({ tier }: TierBadgeProps) {
  if (tier === 'free') {
    return (
      <span className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink/60 dark:bg-paper/10 dark:text-paper/60">
        Free
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
      <StarIcon className="h-3 w-3" aria-hidden />
      Pro
    </span>
  );
}
