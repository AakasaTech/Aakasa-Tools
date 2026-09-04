export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'threads';

export interface PlatformConfig {
  id: Platform;
  label: string;
  charLimit: number;
  urlCountingRule?: 'literal' | 'fixed-length';
  fixedUrlLength?: number;
  hashtagLimit?: number;
  /** Shown in the UI next to the platform's limit — how current/verified
   * this figure is, since platform limits change and aren't within this
   * toolbox's control to guarantee indefinitely. */
  limitNote: string;
}

/**
 * Figures verified via each platform's own current documentation (or, for
 * Facebook/Threads/Twitter's t.co behavior, cross-checked against multiple
 * independent 2026 sources) at the time this tool was built — not assumed
 * from memory. Platform limits do change; the figures below are a
 * snapshot, not a guarantee they'll stay accurate indefinitely.
 */
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    id: 'twitter',
    label: 'Twitter / X',
    charLimit: 280,
    urlCountingRule: 'fixed-length',
    fixedUrlLength: 23,
    limitNote:
      '280 is the standard (free-account) limit. X Premium subscribers get a much higher limit (reported up to 25,000 characters) — not modeled here. Every URL is counted as exactly 23 characters via X\'s t.co link-wrapping, regardless of its real length.',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    charLimit: 3000,
    limitNote: "Verified directly against LinkedIn's own official Help documentation. Limits can vary by post type (articles use a different, larger limit).",
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    charLimit: 63206,
    limitNote:
      'This is the technical hard limit on what Facebook will accept. In practice, the feed truncates posts behind a "See more" link after roughly 477 characters on desktop, well before this limit is reached.',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    charLimit: 2200,
    hashtagLimit: 30,
    limitNote: "The long-standing, widely documented caption limit. Instagram separately caps hashtags at 30 per caption — posts with more aren't accepted.",
  },
  threads: {
    id: 'threads',
    label: 'Threads',
    charLimit: 500,
    limitNote: "Threads does not shorten URLs the way X does — every character in a link counts at its full literal length.",
  },
};

export const PLATFORMS: Platform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'threads'];
