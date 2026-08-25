import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CodeMinifier } from './CodeMinifier';

const TITLE = 'Code Minifier & Beautifier - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Minify or beautify JavaScript, CSS, and HTML — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/code-minifier';

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

export default function CodeMinifierPage() {
  return (
    <ToolShell
      title="Code Minifier & Beautifier"
      description="Minify or beautify JavaScript, CSS, and HTML — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'sql-formatter', 'html-entity-tool']}
      faq={[
        {
          question: "What's the difference between minifying and beautifying?",
          answer:
            'Minifying strips everything a machine doesn\'t need to run the code — whitespace, line breaks, comments, and (for JavaScript specifically) shortens variable and function names — to make the file as small as possible for production delivery. Beautifying is the opposite: it adds consistent indentation and line breaks back in to make code readable for a human, typically to inspect or debug a minified file someone else produced, or to clean up inconsistently-formatted code.',
        },
        {
          question: 'Why does minifying JavaScript rename my variables?',
          answer:
            "Whitespace removal alone only goes so far — a genuinely size-optimized minifier also renames long, descriptive variable and function names (calculateOrderTotal, subtotal) to short ones (a single letter, typically) wherever it's safe to do so, since names have zero meaning to the JavaScript engine executing the code. This is called mangling, and it's a meaningful additional size reduction beyond whitespace alone. The tradeoff: mangled code is much harder to read if you ever need to debug it directly, which is why real production pipelines pair minification with a source map that maps the mangled code back to the original — this tool does not generate source maps, so treat its output as a quick one-off transform, not a replacement for a proper build pipeline.",
        },
        {
          question: 'When should I minify versus beautify?',
          answer:
            "Minify when you're shipping a file to production and want the smallest possible transfer size. Beautify when you're trying to read or debug code that's already minified, inconsistently formatted, or just unfamiliar — turning a single dense line back into readable, indented code you can actually follow.",
        },
        {
          question: 'Is my code stored or transmitted anywhere?',
          answer:
            'No. All minification and beautification happens locally in your browser using JavaScript libraries — nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <CodeMinifier />
    </ToolShell>
  );
}
