import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { GitignoreGenerator } from './GitignoreGenerator';

const TITLE = '.gitignore Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate a .gitignore file for your stack — Node, Python, Java, and more — right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/gitignore-generator';

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

export default function GitignoreGeneratorPage() {
  return (
    <ToolShell
      title=".gitignore Generator"
      description="Generate a .gitignore file for your stack — Node, Python, Java, and more."
      category="developer"
      tier="free"
      relatedTools={['json-formatter']}
      faq={[
        {
          question: 'What does a .gitignore file actually do?',
          answer:
            "It tells Git which files and patterns to leave out of version control — things like build artifacts, installed dependencies, editor and OS-specific files, and local secrets. Anything matching a pattern in .gitignore never gets tracked or committed, which keeps a repository free of clutter that doesn't belong in source control (and keeps things like local .env secrets from accidentally being pushed).",
        },
        {
          question: 'Where do these templates come from?',
          answer:
            "Every template bundled in this tool is sourced verbatim from GitHub's own official, community-maintained gitignore template collection (the github/gitignore repository) — the de facto standard reference for this kind of content. Credit to GitHub and the many contributors who maintain that collection.",
        },
        {
          question: 'Can I combine multiple templates?',
          answer:
            'Yes — selecting several at once (for example Node + macOS + VS Code) is extremely common and fully supported. The generated file merges every selected template into one, adding a clear section-header comment for each one\'s contribution and automatically removing any line that\'s duplicated across more than one selected template, so nothing is repeated.',
        },
        {
          question: 'Does this tool store or upload anything I enter?',
          answer: 'No. Everything — template selection, combining, and your custom additions — happens entirely in your browser. Nothing is sent to a server, logged, or saved.',
        },
      ]}
    >
      <GitignoreGenerator />
    </ToolShell>
  );
}
