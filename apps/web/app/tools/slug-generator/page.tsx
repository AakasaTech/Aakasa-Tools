import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { SlugGenerator } from './SlugGenerator';

const TITLE = 'Slug Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert text into clean, URL-friendly slugs instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/slug-generator';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL_URL,
    siteName: 'Aakasa Toolbox',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function SlugGeneratorPage() {
  return (
    <ToolShell
      title="Slug Generator"
      description="Convert text into clean, URL-friendly slugs instantly."
      category="text-writing"
      tier="free"
      relatedTools={['case-converter', 'url-encoder-decoder', 'utm-link-builder']}
      faq={[
        {
          question: 'What is a URL slug, and why does it matter?',
          answer:
            'It\'s the clean, readable segment of a URL that identifies a specific page — turning a title like "My Blog Post Title!" into "my-blog-post-title" instead of leaving spaces, punctuation, and capitalization that would need to be escaped in a URL. A good slug is easier to read, share, and remember, and it\'s a small, genuine factor in how search engines and readers alike interpret what a page is about.',
        },
        {
          question: 'How are accented and non-Latin characters handled?',
          answer:
            "Accented Latin characters are transliterated to their base letter — \"café\" becomes \"cafe\", \"Müller\" becomes \"Muller\" — using Unicode normalization to decompose each accented character and strip the accent mark, so this covers the full range of Latin accents correctly, not just a handful of common ones. Genuinely non-Latin scripts (Chinese, Arabic, Japanese, and similar) are a real limitation worth stating honestly: there's no meaningful Latin-alphabet slug equivalent to invent for them, so that content is simply stripped rather than transliterated, which can produce a very short or even empty result for non-Latin input. This tool doesn't pretend to solve that — it's a Latin-script slugifier, not a universal one.",
        },
        {
          question: 'Can I generate slugs for a whole list of titles at once?',
          answer:
            'Yes — paste multiple lines into the input and each non-empty line gets its own generated slug, with an individual copy button per line plus a "copy all" option for the whole batch.',
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer: 'No — every slug is generated locally in your browser.',
        },
      ]}
    >
      <SlugGenerator />
    </ToolShell>
  );
}
