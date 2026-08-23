import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { MetaTagPreviewer } from './MetaTagPreviewer';

const TITLE = 'Meta Tag & Open Graph Previewer - Free SEO Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Preview how your page looks when shared on Twitter, Facebook, LinkedIn, and Google — paste HTML or enter a URL.';
const CANONICAL_URL = 'https://aakasa.dev/tools/meta-tag-previewer';

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

export default function MetaTagPreviewerPage() {
  return (
    <ToolShell
      title="Meta Tag & Open Graph Previewer"
      description="Preview how your page looks when shared on Twitter, Facebook, LinkedIn, and Google — paste HTML or enter a URL."
      category="seo-marketing"
      tier="free"
      relatedTools={['word-counter', 'robots-sitemap-generator', 'utm-link-builder']}
      faq={[
        {
          question: 'What are Open Graph tags, and why do they matter?',
          answer:
            'Open Graph (og:*) tags are meta tags that control how a link looks when it\'s shared — the title, description, and image shown on Facebook, LinkedIn, Slack, and most other platforms that generate a link preview. They\'re not a search ranking factor by themselves, but a page without them (or with a missing og:image) often gets a blank or awkward-looking preview, which measurably affects whether people click a shared link.',
        },
        {
          question: "What's the difference between og:* tags and twitter:* tags?",
          answer:
            'Open Graph tags (og:title, og:description, og:image) are the standard most platforms read. Twitter/X has its own separate tag set (twitter:card, twitter:title, twitter:image, and so on) — but if a page has Open Graph tags and no Twitter-specific ones, Twitter falls back to reading the og:* tags instead of showing nothing. This tool reflects that fallback directly in the Twitter/X preview, not just in this explanation.',
        },
        {
          question: 'What image size should og:image be?',
          answer:
            '1200×630 pixels is the widely-used standard, giving a roughly 1.91:1 aspect ratio that displays well across Facebook, LinkedIn, and Twitter\'s large-image card. This tool can\'t verify an image\'s actual pixel dimensions from markup alone — only confirm whether an og:image tag exists.',
        },
        {
          question: "Why does the URL mode need a server request, when the rest of the toolbox doesn't?",
          answer:
            'Browsers block a page from fetching another site\'s HTML directly (CORS), and most sites don\'t send the permissive headers needed to allow it — so previewing a live URL requires a small server-side fetch. That request only reads the page\'s <head> section for its meta tags; it\'s never stored, and the full page body is never downloaded or returned. Pasting HTML directly, in the other tab, avoids this entirely and stays fully client-side like every other tool here.',
        },
      ]}
    >
      <MetaTagPreviewer />
    </ToolShell>
  );
}
