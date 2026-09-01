import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FontPairing } from './FontPairing';

const TITLE = 'Font Pairing Previewer - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Preview and compare Google Font pairings for headings and body text — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/font-pairing';

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

export default function FontPairingPage() {
  return (
    <ToolShell
      title="Font Pairing Previewer"
      description="Preview and compare Google Font pairings for headings and body text — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['color-palette', 'css-gradient-generator', 'contrast-checker']}
      faq={[
        {
          question: 'What actually makes two fonts pair well?',
          answer:
            "Contrast in style, more than similarity. A distinctive display or serif font for headings paired with a clean, highly legible sans-serif (or vice versa) tends to work well, because each one is clearly doing a different job — one grabs attention, the other carries the reading. Two very similar fonts side by side often just look like a mistake, and two equally bold, attention-grabbing fonts tend to compete rather than complement each other.",
        },
        {
          question: 'Can I actually use these fonts commercially?',
          answer:
            "Yes — every font in this tool comes from Google Fonts, and all of them are released under open licenses (mostly the SIL Open Font License) that explicitly permit free commercial use, no attribution required. That's a genuine, practical reason Google Fonts is the default choice for so many real projects.",
        },
        {
          question: 'How do I actually use a pairing I like on a real site?',
          answer:
            'Copy the generated Google Fonts embed link into your page\'s `<head>` (or use the equivalent `@fontsource` npm package if you\'d rather bundle the font files yourself instead of loading them from Google\'s CDN), then apply the generated font-family CSS to your headings and body text — both are provided below the preview, ready to paste in.',
        },
        {
          question: 'Is anything I do here sent anywhere?',
          answer:
            "Your font choices, favorites, and settings never leave this browser tab. The one thing that does come from outside is the font files themselves, loaded from Google Fonts' public CDN — the same public asset request any website using Google Fonts makes, not something specific to you or your input.",
        },
      ]}
    >
      <FontPairing />
    </ToolShell>
  );
}
