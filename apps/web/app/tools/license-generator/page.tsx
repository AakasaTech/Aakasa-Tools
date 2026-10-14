import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { LicenseGenerator } from './LicenseGenerator';

const TITLE = 'Open Source License Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate a LICENSE file for MIT, Apache 2.0, GPL, and more, instantly, right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/license-generator';

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

export default function LicenseGeneratorPage() {
  return (
    <ToolShell
      title="Open Source License Generator"
      description="Generate a LICENSE file for MIT, Apache 2.0, GPL, and more, instantly."
      category="developer"
      tier="free"
      relatedTools={['gitignore-generator']}
      faq={[
        {
          question: 'Which license should I pick?',
          answer:
            "That depends on what you want to allow, and it's a decision with real legal implications, so this is general informational context, not a recommendation. Permissive licenses like MIT, ISC, and BSD put almost no restrictions on reuse. Apache 2.0 is similar but adds an explicit patent grant, which matters more for larger or corporate-backed projects. GPL is copyleft — anyone who distributes a derivative work must also share it under the GPL, source included. The Unlicense goes further and dedicates the work to the public domain, waiving copyright entirely. For anything beyond a personal or hobby project, consulting a lawyer or a resource like choosealicense.com is the right move — this tool doesn't provide legal advice.",
        },
        {
          question: 'Why do some licenses not ask for my name or the year?',
          answer:
            "MIT, ISC, and both BSD licenses use a \"Copyright (c) [year] [name]\" line that this tool fills in for you. Apache 2.0 and GPL v3's actual license text doesn't have that kind of substitution at all — their official text separately recommends attaching a short boilerplate notice to each source file's header, which is a different convention from the LICENSE file itself, so this tool doesn't force those two fields where they don't apply. The Unlicense is a public domain dedication with no copyright claim, so it doesn't need a name either.",
        },
        {
          question: 'Is the license text exactly official?',
          answer:
            'Yes — every license bundled here is the verbatim official text (cross-checked against the SPDX license list for accuracy), with only the officially-specified placeholder fields substituted. Nothing else is paraphrased, summarized, or reworded, since license text carries specific legal meaning.',
        },
        {
          question: 'Does this tool store or upload anything I enter?',
          answer: 'No. Everything — your license choice, name, and year — stays in your browser. Nothing is sent to a server, logged, or saved.',
        },
      ]}
    >
      <LicenseGenerator />
    </ToolShell>
  );
}
