export type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface StrengthMeterProps {
  level: StrengthLevel;
  /** Optional supporting detail shown next to the label, e.g. "62.4 bits of entropy". */
  detail?: string;
}

const SEGMENT_COUNT = 4;

const LEVEL_META: Record<StrengthLevel, { label: string; rank: number; tone: 'danger' | 'success' }> = {
  weak: { label: 'Weak', rank: 1, tone: 'danger' },
  fair: { label: 'Fair', rank: 2, tone: 'danger' },
  strong: { label: 'Strong', rank: 3, tone: 'success' },
  'very-strong': { label: 'Very strong', rank: 4, tone: 'success' },
};

/**
 * Generic strength meter — not password-specific. Any tool that reduces
 * something to a weak/fair/strong/very-strong rating (a future Password
 * Strength Checker included) can reuse this without importing anything
 * from the password generator.
 */
export function StrengthMeter({ level, detail }: StrengthMeterProps) {
  const meta = LEVEL_META[level];
  const toneClass = meta.tone === 'danger' ? 'bg-danger' : 'bg-success';

  return (
    <div>
      <div
        role="meter"
        aria-valuenow={meta.rank}
        aria-valuemin={1}
        aria-valuemax={SEGMENT_COUNT}
        aria-label={`Strength: ${meta.label}`}
        className="flex gap-1"
      >
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={`h-1.5 flex-1 rounded-full ${
              index < meta.rank ? toneClass : 'bg-ink/10 dark:bg-paper/10'
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-ink/60 dark:text-paper/60">
        <span className="font-medium text-ink dark:text-paper">{meta.label}</span>
        {detail && <span>{detail}</span>}
      </div>
    </div>
  );
}
