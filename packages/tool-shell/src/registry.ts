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
    slug: 'dpi-calculator',
    title: 'Image DPI & Dimension Calculator',
    shortDescription: 'Calculate print size, pixel dimensions, and DPI/PPI instantly.',
    category: 'calculators',
    tier: 'free',
  },
  {
    slug: 'percentage-calculator',
    title: 'Percentage Calculator',
    shortDescription: 'Calculate percentages, percentage change, and more, instantly.',
    category: 'calculators',
    tier: 'free',
  },
  {
    slug: 'bmi-calculator',
    title: 'BMI Calculator',
    shortDescription: 'Calculate Body Mass Index (BMI) instantly.',
    category: 'calculators',
    tier: 'free',
  },
  {
    slug: 'age-calculator',
    title: 'Age & Date Difference Calculator',
    shortDescription: 'Calculate age or the exact time between two dates, instantly.',
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
    slug: 'barcode-generator',
    title: 'Barcode Generator',
    shortDescription: 'Generate barcodes in multiple formats — Code 128, EAN, UPC, and more.',
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
  {
    slug: 'csv-viewer',
    title: 'CSV Viewer & Cleaner',
    shortDescription: 'View, edit, and clean messy CSV data in a spreadsheet-like grid.',
    category: 'data-files',
    tier: 'free',
  },
  {
    slug: 'url-encoder-decoder',
    title: 'URL Encoder & Decoder',
    shortDescription: 'Encode and decode URLs and query strings instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'jwt-decoder',
    title: 'JWT Decoder',
    shortDescription: 'Decode and inspect JWT tokens — header and payload, instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'cron-builder',
    title: 'Cron Expression Builder',
    shortDescription: 'Build and understand cron expressions with a visual editor.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'html-entity-tool',
    title: 'HTML Entity Encoder & Decoder',
    shortDescription: 'Encode and decode HTML entities instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'timestamp-converter',
    title: 'Timestamp Converter',
    shortDescription: 'Convert Unix timestamps to human-readable dates and back, instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'json-to-typescript',
    title: 'JSON to TypeScript Generator',
    shortDescription: 'Generate TypeScript interfaces from JSON instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'xml-formatter',
    title: 'XML Formatter & Validator',
    shortDescription: 'Format, validate, and minify XML instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'yaml-json-converter',
    title: 'YAML to JSON Converter',
    shortDescription: 'Convert between YAML and JSON formats instantly, both directions.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'sql-formatter',
    title: 'SQL Query Formatter',
    shortDescription: 'Format and beautify SQL queries instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'code-minifier',
    title: 'Code Minifier & Beautifier',
    shortDescription: 'Minify or beautify JavaScript, CSS, and HTML instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'diff-tool',
    title: 'Text & Code Diff Checker',
    shortDescription: 'Compare two texts or code snippets and see the differences instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'curl-to-code',
    title: 'cURL to Code Converter',
    shortDescription: 'Convert cURL commands to JavaScript, Python, and more, instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'http-status-codes',
    title: 'HTTP Status Code Reference',
    shortDescription: 'Look up HTTP status codes and their meanings instantly.',
    category: 'developer',
    tier: 'free',
  },
  {
    slug: 'css-gradient-generator',
    title: 'CSS Gradient Generator',
    shortDescription: 'Design and export CSS gradients with a live visual editor.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'contrast-checker',
    title: 'Contrast Checker',
    shortDescription: 'Check color contrast against WCAG accessibility standards, instantly.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'favicon-generator',
    title: 'Favicon Generator',
    shortDescription: 'Generate favicons in every required size from one image, free.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'box-shadow-generator',
    title: 'CSS Box-Shadow Generator',
    shortDescription: 'Design and export CSS box-shadows with a live visual editor.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'border-radius-generator',
    title: 'CSS Border-Radius & Blob Generator',
    shortDescription: 'Design rounded corners and organic blob shapes with a visual editor.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'font-pairing',
    title: 'Font Pairing Previewer',
    shortDescription: 'Preview and compare Google Font pairings for headings and body text.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'placeholder-image-generator',
    title: 'Placeholder Image Generator',
    shortDescription: 'Generate placeholder images with custom dimensions, colors, and text.',
    category: 'color-design',
    tier: 'free',
  },
  {
    slug: 'image-resizer',
    title: 'Image Resizer & Cropper',
    shortDescription: 'Resize and crop images to exact dimensions, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'format-converter',
    title: 'Image Format Converter',
    shortDescription: 'Convert images between PNG, JPG, WebP, and AVIF, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'exif-viewer',
    title: 'EXIF Data Viewer & Remover',
    shortDescription: 'View and remove hidden metadata (including GPS location) from photos, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'watermark-adder',
    title: 'Watermark Adder',
    shortDescription: 'Add a text or image watermark to your photos, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'meme-generator',
    title: 'Meme Generator',
    shortDescription: 'Create memes with custom text, free, no watermark, no signup.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'background-remover',
    title: 'Background Remover',
    shortDescription: 'Remove image backgrounds automatically, free, no upload required.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'screenshot-annotator',
    title: 'Screenshot Annotator & Editor',
    shortDescription: 'Annotate screenshots with arrows, text, shapes, and blur, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'image-rotator',
    title: 'Image Rotator & Flipper',
    shortDescription: 'Rotate and flip images instantly, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'svg-to-png',
    title: 'SVG to PNG Converter',
    shortDescription: 'Convert SVG files to PNG, JPG, or WebP instantly.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'gif-maker',
    title: 'GIF Maker',
    shortDescription: 'Create animated GIFs from a series of images, free.',
    category: 'image',
    tier: 'free',
  },
  {
    slug: 'collage-maker',
    title: 'Collage Maker',
    shortDescription: 'Combine multiple photos into one collage layout, free.',
    category: 'image',
    tier: 'free',
  },
];
