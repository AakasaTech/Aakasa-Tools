import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { SvgToPng } from './SvgToPng';

const TITLE = 'SVG to PNG Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert SVG files to PNG, JPG, or WebP instantly — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/svg-to-png';

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

export default function SvgToPngPage() {
  return (
    <ToolShell
      title="SVG to PNG Converter"
      description="Convert SVG files to PNG, JPG, or WebP instantly — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['format-converter', 'favicon-generator', 'image-resizer']}
      faq={[
        {
          question: 'Why would I convert an SVG to PNG or another raster format?',
          answer:
            "Mainly compatibility — plenty of tools, platforms, and upload forms only accept raster formats (PNG, JPG, WebP), not vector SVGs. It's also useful whenever you need a fixed-pixel-dimension version of a vector graphic for a specific spot, like a fixed-size thumbnail or avatar.",
        },
        {
          question: 'How does the output resolution work — is it based on the SVG file?',
          answer:
            "It's a choice you make, not a fixed property of the file. SVG is resolution-independent — it doesn't have an inherent pixel size the way a photo does — so when converting to a raster format you're deciding what pixel dimensions to render it at. This tool defaults to the SVG's own declared size, but you can set any width and height, or use the 1x/2x/3x/4x quick-scale buttons for exporting the same graphic at multiple pixel densities.",
        },
        {
          question: 'Can this tool convert a PNG back into an SVG?',
          answer:
            "No, and it's worth being upfront about that: going from raster to vector requires actually tracing shapes out of pixels and reconstructing them as vector paths — a fundamentally different and much harder problem than what this tool does. This tool only goes one direction, vector to raster.",
        },
        {
          question: 'Is my SVG uploaded anywhere?',
          answer:
            'No. Parsing, rendering, and converting your SVG all happen locally in your browser — nothing is sent to a server, whether you upload a file or paste raw markup.',
        },
      ]}
    >
      <SvgToPng />
    </ToolShell>
  );
}
