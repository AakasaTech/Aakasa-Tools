import type { PlatformConfig } from './platformLimits';

const URL_REGEX = /\bhttps?:\/\/\S+/gi;

function codePointLength(text: string): number {
  // Spread iterates by Unicode code point, not UTF-16 code unit — an emoji
  // outside the Basic Multilingual Plane is one character here, not two,
  // which is closer to how a human (and most platforms) would count it
  // than `text.length` alone.
  return [...text].length;
}

/**
 * Counts `text` the way `platform` actually counts it. For platforms with
 * no special rule, this is a straightforward code-point count. For
 * platforms that fixed-length-count URLs (currently only Twitter/X, via
 * its t.co link-wrapping), every detected URL counts as
 * `fixedUrlLength` characters regardless of its real length, and
 * everything else counts normally.
 *
 * This implements the specific, well-documented URL-counting rule — it
 * does NOT replicate X's full weighted-character-range algorithm (certain
 * scripts/wide characters count as more than 1 there), which is more
 * complex and less precisely documented; the UI says so explicitly rather
 * than implying perfect precision.
 */
export function countPlatformCharacters(text: string, platform: PlatformConfig): number {
  if (platform.urlCountingRule !== 'fixed-length' || !platform.fixedUrlLength) {
    return codePointLength(text);
  }

  const urls = text.match(URL_REGEX) ?? [];
  const textWithoutUrls = text.replace(URL_REGEX, '');
  return codePointLength(textWithoutUrls) + urls.length * platform.fixedUrlLength;
}

export interface HashtagMentionCounts {
  hashtags: number;
  mentions: number;
}

export function countHashtagsAndMentions(text: string): HashtagMentionCounts {
  const hashtags = text.match(/#[^\s#]+/g) ?? [];
  const mentions = text.match(/@[^\s@]+/g) ?? [];
  return { hashtags: hashtags.length, mentions: mentions.length };
}
