/**
 * Pure HTML <head> tag extraction — deliberately NOT built on DOMParser.
 * DOMParser is a browser-only Web API; the paste-HTML mode runs in the
 * browser but the URL-fetch mode runs inside a Next.js API route on the
 * Node.js runtime, where DOMParser doesn't exist and pulling in a DOM
 * library (jsdom/linkedom) just to read a handful of <meta>/<link>/<title>
 * tags would be a lot of weight for a narrow, well-defined job. This file
 * is a small hand-written tag scanner instead — regex-based, no DOM API of
 * any kind — so the exact same function runs unmodified in both the
 * browser and the API route with zero environment branching.
 */

export interface MetaTagData {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  faviconUrl: string | null;
  /** Keyed by the full property, e.g. "og:title" -> "...". */
  ogTags: Record<string, string>;
  /** Keyed by the full name, e.g. "twitter:card" -> "summary". */
  twitterTags: Record<string, string>;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&');
}

const ATTR_REGEX = /([a-zA-Z][a-zA-Z0-9:_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

function parseAttributes(tagSource: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_REGEX.exec(tagSource)) !== null) {
    const name = match[1]!.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[name] = decodeEntities(value);
  }
  return attrs;
}

function extractHeadSlice(html: string): string {
  const headMatch = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html);
  if (headMatch) {
    return headMatch[1]!;
  }
  // Malformed/partial HTML (no closing </head>, or none at all) — fall
  // back to everything before <body>, or the whole input if there's no
  // <body> either. Real-world pasted HTML fragments are often incomplete.
  const bodyIndex = html.search(/<body[^>]*>/i);
  return bodyIndex === -1 ? html : html.slice(0, bodyIndex);
}

function resolveUrl(value: string | undefined, baseUrl: string | undefined): string | null {
  if (!value) {
    return null;
  }
  if (!baseUrl) {
    return value;
  }
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

/**
 * Extracts <title>, meta description, og:* tags, twitter:* tags, the
 * canonical link, and the favicon link from raw HTML. `baseUrl`, when
 * given (URL-fetch mode knows the source URL; paste-HTML mode doesn't),
 * resolves relative image/link URLs to absolute ones so preview cards can
 * actually load them.
 */
export function parseMetaTags(html: string, baseUrl?: string): MetaTagData {
  const head = extractHeadSlice(html);

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head);
  const title = titleMatch ? decodeEntities(titleMatch[1]!).trim() : null;

  let description: string | null = null;
  const ogTags: Record<string, string> = {};
  const twitterTags: Record<string, string> = {};

  const metaTagRegex = /<meta\b[^>]*>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaTagRegex.exec(head)) !== null) {
    const attrs = parseAttributes(metaMatch[0]);
    const content = attrs.content;
    if (content === undefined) {
      continue;
    }

    const name = attrs.name?.toLowerCase();
    const property = attrs.property?.toLowerCase();

    if (name === 'description' && description === null) {
      description = content;
    }
    if (name?.startsWith('twitter:')) {
      twitterTags[name] = content;
    }
    // og:* tags are supposed to use `property`, but real-world pages
    // sometimes (incorrectly) use `name` instead — a previewer tool should
    // still pick those up rather than silently missing them.
    if (property?.startsWith('og:')) {
      ogTags[property] = content;
    } else if (name?.startsWith('og:') && ogTags[name] === undefined) {
      ogTags[name] = content;
    }
  }

  let canonicalUrl: string | null = null;
  let faviconUrl: string | null = null;
  let fallbackIconUrl: string | null = null;

  const linkTagRegex = /<link\b[^>]*>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkTagRegex.exec(head)) !== null) {
    const attrs = parseAttributes(linkMatch[0]);
    const rel = attrs.rel?.toLowerCase();
    if (!rel || !attrs.href) {
      continue;
    }
    if (rel === 'canonical' && canonicalUrl === null) {
      canonicalUrl = resolveUrl(attrs.href, baseUrl);
    } else if ((rel === 'icon' || rel === 'shortcut icon') && faviconUrl === null) {
      faviconUrl = resolveUrl(attrs.href, baseUrl);
    } else if (rel === 'apple-touch-icon' && fallbackIconUrl === null) {
      fallbackIconUrl = resolveUrl(attrs.href, baseUrl);
    }
  }

  if (ogTags['og:image']) {
    ogTags['og:image'] = resolveUrl(ogTags['og:image'], baseUrl) ?? ogTags['og:image'];
  }
  if (twitterTags['twitter:image']) {
    twitterTags['twitter:image'] = resolveUrl(twitterTags['twitter:image'], baseUrl) ?? twitterTags['twitter:image'];
  }

  return {
    title,
    description,
    canonicalUrl,
    faviconUrl: faviconUrl ?? fallbackIconUrl,
    ogTags,
    twitterTags,
  };
}

export interface EffectiveSocialTags {
  title: string | null;
  description: string | null;
  image: string | null;
  cardType: 'summary' | 'summary_large_image';
  siteName: string | null;
}

/**
 * Twitter/X falls back to Open Graph tags for anything it doesn't have its
 * own twitter:* tag for — this reproduces that fallback chain so the
 * Twitter preview card renders what Twitter would actually show, not just
 * whatever twitter:* tags happen to be present.
 */
export function getEffectiveTwitterTags(data: MetaTagData): EffectiveSocialTags {
  const cardTypeRaw = data.twitterTags['twitter:card'];
  const cardType: 'summary' | 'summary_large_image' = cardTypeRaw === 'summary_large_image' ? 'summary_large_image' : 'summary';

  return {
    title: data.twitterTags['twitter:title'] ?? data.ogTags['og:title'] ?? data.title,
    description: data.twitterTags['twitter:description'] ?? data.ogTags['og:description'] ?? data.description,
    image: data.twitterTags['twitter:image'] ?? data.ogTags['og:image'] ?? null,
    cardType,
    siteName: data.twitterTags['twitter:site'] ?? data.ogTags['og:site_name'] ?? null,
  };
}

export interface EffectiveOgTags {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

/** Facebook/LinkedIn read og:* tags directly, falling back to <title>/meta description only when OG tags are entirely absent. */
export function getEffectiveOgTags(data: MetaTagData): EffectiveOgTags {
  return {
    title: data.ogTags['og:title'] ?? data.title,
    description: data.ogTags['og:description'] ?? data.description,
    image: data.ogTags['og:image'] ?? null,
    siteName: data.ogTags['og:site_name'] ?? null,
  };
}
