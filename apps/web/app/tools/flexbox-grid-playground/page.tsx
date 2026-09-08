import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FlexboxGridPlayground } from './FlexboxGridPlayground';

const TITLE = 'CSS Flexbox & Grid Playground - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Visually build and understand CSS Flexbox and Grid layouts, free.';
const CANONICAL_URL = 'https://aakasa.dev/tools/flexbox-grid-playground';

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

export default function FlexboxGridPlaygroundPage() {
  return (
    <ToolShell
      title="CSS Flexbox & Grid Playground"
      description="Visually build and understand CSS Flexbox and Grid layouts, free."
      category="color-design"
      tier="free"
      relatedTools={['css-gradient-generator', 'box-shadow-generator', 'border-radius-generator']}
      faq={[
        {
          question: 'What are Flexbox and Grid, and when should I use each?',
          answer:
            'Both are CSS layout systems, but they solve different problems. Flexbox is for one-dimensional layouts — arranging items along a single row or column, like a navbar or a button group — and excels at distributing space and alignment along that one axis. Grid is for two-dimensional layouts — rows AND columns together, like a page layout with a header, sidebar, content area, and footer — and excels at precisely placing items into specific cells. A common rule of thumb: reach for Flexbox when you\'re laying things out in a line, and Grid when you need to control both rows and columns at once.',
        },
        {
          question: 'How do I use this tool?',
          answer:
            "Adjust the container properties (like flex-direction or grid-template-columns) and watch the live preview update immediately — it's real CSS applied to real boxes, not an illustration. Select an individual item to give it its own overrides (like a different flex-grow, or a grid item that spans multiple columns), and copy the generated CSS at the bottom into your own project when you're happy with the result. The preset buttons load a few common, genuinely useful layout patterns as a starting point or a worked example to learn from.",
        },
        {
          question: 'Is anything I build here saved or uploaded?',
          answer: 'No — everything runs and stays entirely in your browser. Nothing is sent anywhere or saved between visits.',
        },
      ]}
    >
      <FlexboxGridPlayground />
    </ToolShell>
  );
}
