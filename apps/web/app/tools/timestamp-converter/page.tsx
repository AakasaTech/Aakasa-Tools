import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { TimestampConverter } from './TimestampConverter';

const TITLE = 'Unix Timestamp Converter - Free Online Epoch Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert Unix timestamps to human-readable dates and back — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/timestamp-converter';

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

export default function TimestampConverterPage() {
  return (
    <ToolShell
      title="Timestamp Converter"
      description="Convert Unix timestamps to human-readable dates and back — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['cron-builder', 'jwt-decoder', 'json-formatter']}
      faq={[
        {
          question: 'What is a Unix timestamp?',
          answer:
            'A Unix timestamp (or "epoch time") is the number of seconds that have passed since January 1, 1970, 00:00:00 UTC — a fixed reference point called "the epoch." It\'s a single number that unambiguously represents a specific instant in time, independent of any calendar format, locale, or timezone, which is exactly why it\'s so widely used in APIs, databases, and log files.',
        },
        {
          question: 'Why does my timestamp look wrong — showing 1970, or some year far in the future?',
          answer:
            'This is almost always a seconds-vs-milliseconds mix-up, and it\'s the single most common bug with Unix timestamps. JavaScript\'s Date.now() and most browser APIs use milliseconds, while many backend systems and Unix command-line tools use seconds. Treating a seconds value as milliseconds makes it look like 1970 (since the number is 1000x too small); treating a milliseconds value as seconds pushes the date thousands of years into the future. This tool auto-detects which one you likely have based on the timestamp\'s magnitude, with a manual override in case an edge-case value gets misread.',
        },
        {
          question: "What does UTC mean here, versus my local timezone?",
          answer:
            'UTC (Coordinated Universal Time) is the timezone-independent reference time that a Unix timestamp is fundamentally based on — it doesn\'t shift for daylight saving and isn\'t tied to any specific region. Your "local timezone" is whatever your browser and operating system are currently configured to, which does shift with daylight saving and differs by region. The same timestamp corresponds to a different clock time in each timezone, but the same single instant — this tool shows both side by side, plus any specific timezone you choose, so you can see exactly how they relate.',
        },
        {
          question: 'Is anything entered here stored or transmitted?',
          answer:
            'No. All conversion happens locally in your browser using native JavaScript date and internationalization APIs — nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <TimestampConverter />
    </ToolShell>
  );
}
