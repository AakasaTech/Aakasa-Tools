import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CurlToCode } from './CurlToCode';

const TITLE = 'cURL to Code Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert cURL commands to JavaScript, Python, and PHP — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/curl-to-code';

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

export default function CurlToCodePage() {
  return (
    <ToolShell
      title="cURL to Code Converter"
      description="Convert cURL commands to JavaScript, Python, and PHP — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'regex-tester', 'base64-tool']}
      faq={[
        {
          question: 'What does this tool actually do?',
          answer:
            'It takes a curl command — the kind you get from a browser\'s DevTools via "Copy as cURL" on a network request, or one written by hand in API documentation — and translates it into equivalent code in another language or HTTP library: the same URL, method, headers, and body, expressed as a fetch() call, an axios request, a Python requests call, or PHP\'s cURL functions.',
        },
        {
          question: 'Which curl flags does it actually support?',
          answer:
            'The URL (bare or via --url), -X/--request for the HTTP method, -H/--header (repeatable), -d/--data/--data-raw/--data-binary for the request body, -u/--user for basic auth, -b/--cookie, and --compressed. curl itself has several hundred flags covering everything from TLS pinning to FTP — this tool doesn\'t attempt to support all of curl, only this common subset. Anything else in your command is called out as an unsupported flag rather than silently ignored, so you always know if something was dropped.',
        },
        {
          question: 'What happens if my command has a flag this tool doesn\'t support?',
          answer:
            'It\'s listed explicitly in a warning above the generated code, naming exactly which flag(s) weren\'t understood, instead of quietly producing code that\'s missing something you didn\'t know was skipped.',
        },
        {
          question: 'Is it safe to paste a curl command with a real auth token in it?',
          answer:
            'Yes, and this matters more here than in most tools: a curl command copied from DevTools very often contains a live session cookie, bearer token, or API key. Parsing and code generation both happen entirely in your browser — nothing you paste is uploaded, logged, or sent anywhere. That said, treat any token you\'ve pasted anywhere as something to rotate if you\'re not sure where it\'s been.',
        },
      ]}
    >
      <CurlToCode />
    </ToolShell>
  );
}
