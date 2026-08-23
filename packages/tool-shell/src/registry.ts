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
  {
    slug: 'word-counter',
    title: 'Word & Character Counter',
    shortDescription: 'Count words, characters, sentences, and reading time instantly.',
    category: 'text-writing',
    tier: 'free',
  },
  {
    slug: 'base64-tool',
    title: 'Base64 Encoder / Decoder',
    shortDescription: 'Encode and decode Base64 text, files, and images instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'regex-tester',
    title: 'Regex Tester',
    shortDescription: 'Test and debug regular expressions with live match highlighting.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'color-palette',
    title: 'Color Palette Generator & Extractor',
    shortDescription: 'Generate color palettes or extract them from any image.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'csv-json-converter',
    title: 'CSV to JSON Converter',
    shortDescription: 'Convert between CSV and JSON formats instantly, both directions.',
    category: 'data-files',
    tier: 'free',
  },
  {
    slug: 'unit-converter',
    title: 'Unit Converter',
    shortDescription: 'Convert length, weight, temperature, and more, instantly.',
    category: 'calculators',
    tier: 'free',
  },
  {
    slug: 'invoice-generator',
    title: 'Invoice Generator',
    shortDescription: 'Create and download professional invoices as PDF, free.',
    category: 'calculators',
    tier: 'free',
  },
  {
    slug: 'meta-tag-previewer',
    title: 'Meta Tag & Open Graph Previewer',
    shortDescription: 'Preview how your page looks when shared on social media and search.',
    category: 'seo-marketing',
    tier: 'free',
  },
  {
    slug: 'utm-link-builder',
    title: 'UTM Link Builder',
    shortDescription: 'Build trackable campaign URLs with UTM parameters, instantly.',
    category: 'seo-marketing',
    tier: 'free',
  },
  {
    slug: 'qr-code-generator',
    title: 'QR Code Generator',
    shortDescription: 'Generate QR codes for URLs, text, Wi-Fi, and more, instantly.',
    category: 'seo-marketing',
    tier: 'free',
  },
  {
    slug: 'image-compressor',
    title: 'Image Compressor',
    shortDescription: 'Compress JPG, PNG, and WebP images without losing quality, free.',
    category: 'image',
    tier: 'free',
  },
];
