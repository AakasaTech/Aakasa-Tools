import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { DiffTool } from './DiffTool';

const TITLE = 'Text & Code Diff Checker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Compare two texts or code snippets and see the differences — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/diff-tool';

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

export default function DiffToolPage() {
  return (
    <ToolShell
      title="Text & Code Diff Checker"
      description="Compare two texts or code snippets and see the differences — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'code-minifier', 'word-counter']}
      faq={[
        {
          question: 'What does a diff actually show me?',
          answer:
            "A diff compares two pieces of text and highlights exactly what's different: content only in the Original (a removal), content only in the Changed version (an addition), and content present in both (unchanged). Instead of re-reading both versions line by line to spot what moved, you get the changes called out directly.",
        },
        {
          question: "What's the difference between line, word, and character diffing?",
          answer:
            "Line-level diffing compares whole lines — a line either matches exactly or it doesn't, with no detail about what changed inside it. That's the right choice for comparing whole files or config where you mainly care which lines moved. Word and character-level diffing go further: for a line that changed, they highlight exactly which words or characters differ within it, which is far more useful for prose or short snippets — two sentences that share most of their words would just look like one big removed line and one big added line under line-level diffing, but word-level diffing shows precisely which words changed.",
        },
        {
          question: 'Does this only work for code?',
          answer:
            "No — it works for any plain text. Code and config files are a common use case since line-level diffing maps naturally onto them, but it works just as well for comparing two drafts of an email, a paragraph of prose, or any other plain text.",
        },
        {
          question: 'Is my text stored or transmitted anywhere?',
          answer:
            'No. The comparison happens entirely locally in your browser — nothing you paste here is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <DiffTool />
    </ToolShell>
  );
}
