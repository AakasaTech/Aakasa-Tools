import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { YamlJsonConverter } from './YamlJsonConverter';

const TITLE = 'YAML to JSON Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert between YAML and JSON formats, both directions — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/yaml-json-converter';

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

export default function YamlJsonConverterPage() {
  return (
    <ToolShell
      title="YAML to JSON Converter"
      description="Convert between YAML and JSON formats, both directions — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'csv-json-converter', 'xml-formatter']}
      faq={[
        {
          question: 'What is YAML actually used for?',
          answer:
            'YAML is the default configuration format for a huge share of developer tooling: Docker Compose files, Kubernetes manifests, GitHub Actions and most other CI pipeline definitions, Ansible playbooks, and countless application config files. It\'s chosen over JSON in these contexts specifically because it supports comments and reads more like plain text — genuinely useful for hand-edited config, though that same flexibility is also where its sharper edges come from.',
        },
        {
          question: 'Why do I keep getting "invalid YAML" errors?',
          answer:
            'Almost always indentation. Unlike JSON, where whitespace is cosmetic and braces/brackets define structure explicitly, YAML uses indentation itself to define nesting — mixing tabs and spaces, or being off by even one space, changes what a block belongs to or breaks parsing outright. This is the single most common source of YAML errors, and this tool reports the exact line and column js-yaml\'s parser stopped at, rather than a generic "invalid" message, specifically to make that kind of mistake fast to find.',
        },
        {
          question: 'What happens to YAML anchors and aliases when converting to JSON?',
          answer:
            'YAML supports anchors (&name) and aliases (*name) to reuse a block of content in more than one place, including merge keys (<<: *name) to mix a reused block into a mapping. JSON has no equivalent concept, so converting to JSON resolves every anchor/alias to its actual final value at the point it\'s used — the output is correct and complete, but the "this value is reused elsewhere" relationship itself doesn\'t survive the conversion. This is a one-way simplification specific to that one YAML feature, not a bug.',
        },
        {
          question: 'Is anything I paste here stored or transmitted?',
          answer:
            'No. All parsing and conversion happens locally in your browser — nothing is uploaded, logged, or transmitted. This matters more than usual for this tool specifically, since config files often contain real hostnames, ports, and sometimes credentials.',
        },
      ]}
    >
      <YamlJsonConverter />
    </ToolShell>
  );
}
