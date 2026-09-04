export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export const CHANGE_FREQ_OPTIONS: ChangeFreq[] = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export interface SitemapUrlEntry {
  id: string;
  loc: string;
  /** ISO date (YYYY-MM-DD), optional. */
  lastmod?: string;
  changefreq?: ChangeFreq;
  /** 0.0–1.0, optional — a relative hint to crawlers, not a ranking guarantee. */
  priority?: number;
}

export const SITEMAP_URL_LIMIT = 50_000;

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Builds a valid sitemap.xml per the sitemaps.org protocol — the
 * `<urlset>` root element with its required namespace, and one `<url>`
 * element per entry with `<loc>` and any optional `<lastmod>`,
 * `<changefreq>`, `<priority>` children. */
export function buildSitemapXml(urls: SitemapUrlEntry[]): string {
  const urlElements = urls
    .filter((entry) => entry.loc.trim() !== '')
    .map((entry) => {
      const lines = [`  <url>`, `    <loc>${escapeXmlText(entry.loc.trim())}</loc>`];
      if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority !== undefined && Number.isFinite(entry.priority)) {
        lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }
      lines.push(`  </url>`);
      return lines.join('\n');
    });

  return [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="${SITEMAP_NAMESPACE}">`, ...urlElements, `</urlset>`].join('\n') + '\n';
}

/** Parses one URL per line from a pasted block of text — blank lines and
 * surrounding whitespace are ignored. */
export function parseUrlList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
