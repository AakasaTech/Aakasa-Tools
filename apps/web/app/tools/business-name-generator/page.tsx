import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { BusinessNameGenerator } from './BusinessNameGenerator';

const TITLE = 'Business Name Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate creative business and brand name ideas instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/business-name-generator';

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

export default function BusinessNameGeneratorPage() {
  return (
    <ToolShell
      title="Business Name Generator"
      description="Generate creative business and brand name ideas instantly."
      category="seo-marketing"
      tier="free"
      relatedTools={['random-data-generator', 'font-pairing', 'color-palette']}
      faq={[
        {
          question: 'How does this generate names?',
          answer:
            "It combines the keywords you enter with a set of naming patterns — real-word compounds (Keyword + Co./Studio/Hub), prefixes (The/Modern/Urban + Keyword), portmanteau blends (combining your keyword with a second word, syllable-blended together), alliterative pairings, and short invented-sounding words loosely built from your keyword. Using your own keywords as the seed, rather than generating from nothing, keeps results relevant to what you're actually naming instead of pure word-salad randomness.",
        },
        {
          question: 'Can I actually use one of these names?',
          answer:
            "Treat every result as a creative starting point, not a cleared name. This tool has no way to know whether a name is trademarked, already in active business use, or otherwise legally unavailable — that requires your own trademark search (and, in the US, ideally a USPTO search) before you commit to anything. It's stated here plainly because it matters: a name this tool suggests could easily already belong to someone else.",
        },
        {
          question: 'Does this check domain availability?',
          answer:
            "No — not in this version. Checking real domain availability requires a live server-side lookup against domain registries, which is a meaningfully different (and separately fragile) feature from the client-side name generation this tool does. Rather than fake a check that can't work correctly from the browser alone, this was left out entirely: after picking a name you like, check its domain availability yourself directly with a registrar.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every name is generated locally in your browser. Nothing you type is uploaded or stored.',
        },
      ]}
    >
      <BusinessNameGenerator />
    </ToolShell>
  );
}
