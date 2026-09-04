export type PathRuleType = 'allow' | 'disallow';

export interface PathRule {
  id: string;
  type: PathRuleType;
  path: string;
}

export interface UserAgentRule {
  id: string;
  userAgent: string;
  rules: PathRule[];
}

/**
 * Builds robots.txt content. Each user-agent gets its own block with only
 * its own Allow/Disallow lines — blocks are never merged, since a crawler
 * matches the FIRST block whose user-agent matches it (or the `*` block as
 * a fallback), so keeping rules scoped to their own block is what makes
 * multiple distinct crawler policies actually work as intended.
 *
 * `Crawl-delay`, when given, is repeated inside every user-agent block —
 * per the (unofficial but widely followed) convention, the directive only
 * has meaning within the block it appears in, not as a standalone
 * top-level line.
 */
export function buildRobotsTxt(rules: UserAgentRule[], sitemapUrl?: string, crawlDelay?: number): string {
  const blocks = rules
    .filter((rule) => rule.userAgent.trim() !== '')
    .map((rule) => {
      const lines = [`User-agent: ${rule.userAgent.trim()}`];
      const pathLines = rule.rules
        .filter((pathRule) => pathRule.path.trim() !== '')
        .map((pathRule) => `${pathRule.type === 'allow' ? 'Allow' : 'Disallow'}: ${pathRule.path.trim()}`);
      lines.push(...pathLines);
      if (crawlDelay !== undefined && Number.isFinite(crawlDelay) && crawlDelay > 0) {
        lines.push(`Crawl-delay: ${crawlDelay}`);
      }
      return lines.join('\n');
    });

  const trimmedSitemapUrl = sitemapUrl?.trim();
  if (trimmedSitemapUrl) {
    blocks.push(`Sitemap: ${trimmedSitemapUrl}`);
  }

  if (blocks.length === 0) return '';

  return `${blocks.join('\n\n')}\n`;
}

export const COMMON_ADMIN_PATHS = ['/admin/', '/wp-admin/', '/api/', '/private/', '/tmp/', '/cgi-bin/'];
