import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ReadmeGenerator } from './ReadmeGenerator';

const TITLE = 'README Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate a well-structured README.md for your project, instantly, right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/readme-generator';

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

export default function ReadmeGeneratorPage() {
  return (
    <ToolShell
      title="README Generator"
      description="Generate a well-structured README.md for your project, instantly."
      category="developer"
      tier="free"
      relatedTools={['gitignore-generator', 'license-generator', 'markdown-to-html']}
      faq={[
        {
          question: 'What makes a good README?',
          answer:
            "A clear one-line description of what the project does, straightforward installation steps, a working usage example, and — for anything accepting outside contributions — a short contributing guide. Badges and a table of contents help at a glance, but the description and usage example are what actually get someone from \"found this repo\" to \"got it running.\"",
        },
        {
          question: 'How do the generated sections map to common conventions?',
          answer:
            'Each toggleable section mirrors a convention seen across most real-world READMEs: badges (shields.io-style build/version/license/package badges), a table of contents auto-linked to the headings you have enabled, features as a bullet list, a configuration table for environment variables, and separate installation/usage/contributing/license sections. Reordering or disabling any of them updates the generated Markdown — and the table of contents — immediately.',
        },
        {
          question: 'Can I start from a template instead of a blank form?',
          answer:
            'Yes — three starting templates (Minimal, Open Source Project, Internal Tool) pre-fill a sensible subset of sections with placeholder content, which you can then edit, reorder, or turn sections on and off from there.',
        },
        {
          question: 'Does this tool store or upload anything I enter?',
          answer: 'No. Everything — every section\'s content and the live preview — is generated entirely in your browser. Nothing is sent to a server, logged, or saved.',
        },
      ]}
    >
      <ReadmeGenerator />
    </ToolShell>
  );
}
