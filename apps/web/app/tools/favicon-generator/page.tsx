import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FaviconGenerator } from './FaviconGenerator';

const TITLE = 'Favicon Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate favicons in every required size from one image — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/favicon-generator';

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

export default function FaviconGeneratorPage() {
  return (
    <ToolShell
      title="Favicon Generator"
      description="Generate favicons in every required size from one image — entirely in your browser."
      category="color-design"
      tier="free"
      relatedTools={['image-compressor', 'color-palette', 'css-gradient-generator']}
      faq={[
        {
          question: 'Why do I need so many different sizes?',
          answer:
            "Different browsers, devices, and contexts each request a specific size: a browser tab wants a small icon, iOS home-screen shortcuts want a much larger one, Android and PWA install prompts want their own sizes again, and a legacy favicon.ico still gets requested by default by some browsers and tools. One image can't cover all of that — each context asks for its own file, so this tool generates the full set at once instead of you having to resize and export each one by hand.",
        },
        {
          question: 'What exactly does this generate, and what is each file for?',
          answer:
            'favicon.ico is the classic multi-resolution icon file for broad, legacy-compatible support. favicon-16x16.png and favicon-32x32.png cover modern browsers directly. apple-touch-icon.png (180×180) is what iOS uses when someone adds your site to their home screen. android-chrome-192x192.png and android-chrome-512x512.png cover Android and PWA install icons, referenced from the generated site.webmanifest.',
        },
        {
          question: 'Do I need to do anything besides download the files?',
          answer:
            'Yes — upload the files to your site\'s root (or wherever your setup expects them), and add the generated `<link>` tags to your page\'s `<head>` so browsers actually know the files are there. This tool generates those exact tags for you to copy, rather than leaving you to look up the right markup separately.',
        },
        {
          question: 'Is my image uploaded anywhere?',
          answer: 'No. Every resize, the .ico file itself, and the zip download are all built locally in your browser — your image is never sent anywhere.',
        },
      ]}
    >
      <FaviconGenerator />
    </ToolShell>
  );
}
