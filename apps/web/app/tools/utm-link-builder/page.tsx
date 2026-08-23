import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { UtmLinkBuilder } from './UtmLinkBuilder';

const TITLE = 'UTM Link Builder - Free Campaign URL Generator | Aakasa Toolbox';
const DESCRIPTION =
  'Build trackable campaign URLs with UTM parameters — instantly, entirely in your browser, nothing sent anywhere.';
const CANONICAL_URL = 'https://aakasa.dev/tools/utm-link-builder';

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

export default function UtmLinkBuilderPage() {
  return (
    <ToolShell
      title="UTM Link Builder"
      description="Build trackable campaign URLs with UTM parameters — instantly, in your browser."
      category="seo-marketing"
      tier="free"
      relatedTools={['meta-tag-previewer']}
      faq={[
        {
          question: 'What are UTM parameters and why do they matter?',
          answer:
            'UTM parameters are small tags added to the end of a URL that tell analytics platforms like Google Analytics where a visit came from. When someone clicks a tagged link, the platform reads those tags and attributes the resulting traffic, sign-up, or purchase back to the specific campaign, channel, or link that drove it — without them, that visit just shows up as generic "direct" or referral traffic with no campaign context.',
        },
        {
          question: 'What does each of the five UTM parameters mean?',
          answer:
            'utm_source, utm_medium, and utm_campaign are the three parameters most analytics platforms need to attribute traffic properly: source is where the click came from (e.g. "newsletter" or "google"), medium is the channel that delivered it (e.g. "email" or "cpc"), and campaign is the specific initiative the link belongs to (e.g. "spring_launch"). utm_term and utm_content are optional extras: term is mainly used for paid search keyword tracking, and content differentiates similar links within the same campaign — for example, tagging two different call-to-action buttons that point to the same page so you can see which one performs better.',
        },
        {
          question: 'Does capitalization or spacing in these values matter?',
          answer:
            'Yes — analytics platforms treat UTM values as case-sensitive exact strings, so "Facebook" and "facebook" are logged as two separate sources even though they mean the same thing to a human. This is a genuinely common mistake that quietly fragments reports across a team. Stick to lowercase, use underscores or hyphens instead of spaces, and keep naming consistent across everyone tagging links — this tool normalizes values to lowercase and trims whitespace by default to help avoid it.',
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer:
            'No. The URL is built entirely in your browser using standard URL parsing — nothing you type is uploaded, logged, or stored on a server. Saved presets and the session link list live only in memory for this page load and disappear when you reload or close the tab.',
        },
      ]}
    >
      <UtmLinkBuilder />
    </ToolShell>
  );
}
