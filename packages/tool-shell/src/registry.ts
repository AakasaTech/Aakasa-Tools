export type ToolCategory =
  | 'text-writing'
  | 'developer'
  | 'color-design'
  | 'image'
  | 'pdf'
  | 'calculators'
  | 'data-files'
  | 'seo-marketing';

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  'text-writing': 'Text & Writing',
  developer: 'Developer Tools',
  'color-design': 'Color & Design',
  image: 'Image Tools',
  pdf: 'PDF Tools',
  calculators: 'Calculators',
  'data-files': 'Data & Files',
  'seo-marketing': 'SEO & Marketing',
};

export interface ToolMeta {
  slug: string;
  title: string;
  shortDescription: string;
  category: ToolCategory;
  tier: 'free' | 'pro';
}

/**
 * Single source of truth for every tool's metadata. ToolShell reads this to
 * resolve `relatedTools` slugs into full cards, and the /tools index page
 * reads the same array to render its grid — append one entry per tool as
 * it's built rather than duplicating this metadata in individual page.tsx
 * files.
 */
export const TOOL_REGISTRY: ToolMeta[] = [
  {
    slug: 'json-formatter',
    title: 'JSON Formatter & Validator',
    shortDescription: 'Format, validate, and minify JSON instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'password-generator',
    title: 'Password Generator',
    shortDescription: 'Generate strong, random passwords instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'uuid-hash-generator',
    title: 'UUID & Hash Generator',
    shortDescription: 'Generate UUIDs and compute MD5/SHA hashes instantly.',
    category: 'developer',
    tier: 'free',
  },
];
