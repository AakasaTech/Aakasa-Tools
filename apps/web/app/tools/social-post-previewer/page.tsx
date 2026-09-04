import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { SocialPostPreviewer } from './SocialPostPreviewer';

const TITLE = 'Social Media Post Previewer - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Preview and check character limits for posts across social platforms.';
const CANONICAL_URL = 'https://aakasa.dev/tools/social-post-previewer';

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

export default function SocialPostPreviewerPage() {
  return (
    <ToolShell
      title="Social Media Post Previewer"
      description="Preview and check character limits for posts across social platforms."
      category="seo-marketing"
      tier="free"
      relatedTools={['word-counter', 'meta-tag-previewer', 'utm-link-builder']}
      faq={[
        {
          question: 'Which platforms and limits does this cover?',
          answer:
            'Twitter/X (280 characters, with links counted at a fixed 23 characters via t.co link-wrapping), LinkedIn (3,000 characters), Facebook (63,206 characters, though the feed truncates much sooner behind a "See more" link), Instagram (2,200-character captions, 30-hashtag maximum), and Threads (500 characters, with links counted at their real length — Threads doesn\'t shorten them).',
        },
        {
          question: 'How current are these limits?',
          answer:
            "These reflect each platform's own documented rules as verified when this tool was built — they aren't guaranteed to stay accurate indefinitely, since platforms change their limits over time and that's entirely outside this toolbox's control. For anything business-critical, double-check the figure against the platform's current official guidance before relying on it.",
        },
        {
          question: "Why does a short URL sometimes make a post's character count go up more than expected, or a long one barely register?",
          answer:
            "This is specific to how a platform handles links. Twitter/X wraps every URL in a post through its own t.co shortener and counts it as exactly 23 characters no matter how long the real URL is — so a 90-character link only \"costs\" 23 characters there, and pre-shortening it yourself doesn't save any more space, since X re-wraps it anyway. Threads, by contrast, doesn't shorten links at all — a long URL there counts at its full literal length. This is why the same post can have very different remaining-character counts on different platforms.",
        },
        {
          question: 'Is anything I write here sent anywhere?',
          answer: 'No — everything is counted and previewed locally in your browser. Nothing you write is uploaded or stored.',
        },
      ]}
    >
      <SocialPostPreviewer />
    </ToolShell>
  );
}
