import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { RobotsSitemapGenerator } from './RobotsSitemapGenerator';

const TITLE = 'Robots.txt & Sitemap Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate robots.txt and XML sitemap files for your website, free.';
const CANONICAL_URL = 'https://aakasa.dev/tools/robots-sitemap-generator';

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

export default function RobotsSitemapGeneratorPage() {
  return (
    <ToolShell
      title="Robots.txt & Sitemap Generator"
      description="Generate robots.txt and XML sitemap files for your website, free."
      category="seo-marketing"
      tier="free"
      relatedTools={['meta-tag-previewer', 'utm-link-builder', 'http-status-codes']}
      faq={[
        {
          question: 'What does robots.txt actually control?',
          answer:
            "It tells search engine crawlers which parts of your site they may or may not crawl. Worth stating plainly since it's a common misconception: robots.txt is a voluntary convention, not a security or access-control mechanism. Well-behaved crawlers (Googlebot, Bingbot, and most legitimate search engines) respect it, but a Disallow rule doesn't actually block anyone from requesting that URL — anyone with the link, or a crawler that ignores the file entirely, can still access it. Never rely on robots.txt to keep something private or secure; use real authentication or access controls for that.",
        },
        {
          question: 'What does sitemap.xml do?',
          answer:
            "It helps search engines discover the pages on your site and understand their relative structure and priority — especially useful for large sites, or pages that aren't well-linked internally. It doesn't guarantee those pages get indexed or ranked; it's a discovery aid, not a promise.",
        },
        {
          question: 'Where do these files need to go?',
          answer:
            'Both belong at the root of your domain — for example, example.com/robots.txt and example.com/sitemap.xml. A robots.txt placed anywhere else (like example.com/pages/robots.txt) is not read by crawlers.',
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every file is generated locally in your browser. Nothing is uploaded or stored.',
        },
      ]}
    >
      <RobotsSitemapGenerator />
    </ToolShell>
  );
}
