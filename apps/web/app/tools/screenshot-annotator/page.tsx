import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ScreenshotAnnotator } from './ScreenshotAnnotator';

const TITLE = 'Screenshot Annotator & Editor - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Annotate screenshots with arrows, text, shapes, and blur — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/screenshot-annotator';

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

export default function ScreenshotAnnotatorPage() {
  return (
    <ToolShell
      title="Screenshot Annotator & Editor"
      description="Annotate screenshots with arrows, text, shapes, and blur — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-resizer', 'watermark-adder', 'image-compressor']}
      faq={[
        {
          question: 'What is this tool useful for?',
          answer:
            "Anywhere you need to mark up a screenshot before sharing it: bug reports (circling the broken element), tutorials and documentation (numbered step markers walking through a UI), and general feedback (arrows and highlights pointing at exactly what you mean) rather than describing a screen position in words.",
        },
        {
          question: 'What annotation tools are available?',
          answer:
            'Arrows, rectangle and ellipse outlines, freehand pen drawing, draggable text boxes, a blur/pixelate tool for redacting sensitive details, semi-transparent highlight boxes, and auto-numbered step markers for sequential tutorials — each one independently movable, resizable, and deletable after you place it.',
        },
        {
          question: 'Does this tool capture screenshots for me?',
          answer:
            "No — to be clear about what this actually does: it annotates an image you already have. It doesn't request any screen-capture or OS-level permission, and it can't take a screenshot on its own. Use your OS or browser's own screenshot shortcut first, then drop, browse to, or paste that image in here to mark it up.",
        },
        {
          question: 'Is my screenshot uploaded anywhere?',
          answer:
            "No, and this matters more here than in most tools — screenshots very often contain genuinely sensitive information (open emails, account details, internal dashboards). Everything in this tool, including the blur/redaction step, happens entirely on your device using the Canvas API. Nothing is ever uploaded.",
        },
      ]}
    >
      <ScreenshotAnnotator />
    </ToolShell>
  );
}
