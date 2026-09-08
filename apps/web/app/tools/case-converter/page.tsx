import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CaseConverter } from './CaseConverter';

const TITLE = 'Case Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert text between UPPERCASE, lowercase, Title Case, camelCase, and more.';
const CANONICAL_URL = 'https://aakasa.dev/tools/case-converter';

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

export default function CaseConverterPage() {
  return (
    <ToolShell
      title="Case Converter"
      description="Convert text between UPPERCASE, lowercase, Title Case, camelCase, and more."
      category="text-writing"
      tier="free"
      relatedTools={['word-counter', 'json-to-typescript']}
      faq={[
        {
          question: 'What are these case styles typically used for?',
          answer:
            'Title Case is common for headings and titles. Sentence case is regular prose capitalization. camelCase is the standard for JavaScript/TypeScript variable and function names. PascalCase is used for class and component names. snake_case is common in Python and for database column names. SCREAMING_SNAKE_CASE is the usual convention for constants. kebab-case shows up in URLs, CSS class names, and command-line flags. Train-Case and dot.case are less common but occasionally used for HTTP headers and config keys, respectively.',
        },
        {
          question: 'How does this handle text that\'s already in a different case style?',
          answer:
            "It detects word boundaries from spaces, hyphens, underscores, and dots, AND from capitalization changes within camelCase or PascalCase text — so pasting \"myVariableName\" is understood as the words \"my\", \"Variable\", \"Name\" just as correctly as pasting \"my variable name\" would be. That means converting FROM any of these styles TO any other works, not just from plain text.",
        },
        {
          question: 'Does it handle acronyms correctly, like "XMLParser" or "getUserID"?',
          answer:
            'Yes — a run of capital letters followed by a lowercase letter is treated as an acronym boundary, so "XMLParser" tokenizes as "XML" + "Parser" (not "X" + "M" + "L" + "Parser"), and "getUserID" tokenizes as "get" + "User" + "ID". This is a heuristic, not a dictionary of known acronyms, so it works by the capitalization pattern rather than recognizing specific abbreviations.',
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer: 'No — every conversion happens locally in your browser.',
        },
      ]}
    >
      <CaseConverter />
    </ToolShell>
  );
}
