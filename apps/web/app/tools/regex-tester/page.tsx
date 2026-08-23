import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { RegexTester } from './RegexTester';

const TITLE = 'Regex Tester - Free Online Regular Expression Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Test and debug regular expressions with live match highlighting, replace mode, and common patterns — in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/regex-tester';

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

export default function RegexTesterPage() {
  return (
    <ToolShell
      title="Regex Tester"
      description="Test regular expressions with live match highlighting — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'base64-tool', 'word-counter']}
      faq={[
        {
          question: 'Which regex flavor does this use?',
          answer:
            'JavaScript (ECMAScript) regular expressions — the same engine your browser and Node.js use. It differs from PCRE or Python\'s re module in some edge cases: named group syntax is (?<name>...) in all three, but lookbehind support ((?<=...) and (?<!...)) varies by browser, and some escape sequences behave slightly differently. If you\'re testing a pattern meant for another language, treat this as close, not identical.',
        },
        {
          question: 'What do the flag options mean?',
          answer:
            'g (global) finds all matches instead of stopping at the first. i (case insensitive) ignores letter case. m (multiline) makes ^ and $ match the start/end of each line rather than the whole string. s (dotAll) lets . match newline characters too, which it normally doesn\'t. u (unicode) treats the pattern as Unicode code points instead of raw UTF-16 units, which matters for characters outside the Basic Multilingual Plane like many emoji.',
        },
        {
          question: 'Why would a regex hang the page?',
          answer:
            'Certain patterns — typically ones with nested repetition, like (a+)+ — can cause "catastrophic backtracking": the engine tries an exponential number of ways to match before giving up, and a moderately long input can make that take longer than the age of the universe. This tool runs every evaluation in a background worker with a hard time limit, so a runaway pattern gets stopped and flagged rather than freezing your browser tab.',
        },
        {
          question: 'Is anything I type here stored or transmitted?',
          answer:
            'No. Pattern matching and replacement happen entirely in your browser, in a background worker. Nothing is uploaded, logged, or sent anywhere.',
        },
      ]}
    >
      <RegexTester />
    </ToolShell>
  );
}
