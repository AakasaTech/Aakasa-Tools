import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CronBuilder } from './CronBuilder';

const TITLE = 'Cron Expression Builder & Parser - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Build, parse, and understand cron expressions with a visual editor — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/cron-builder';

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

export default function CronBuilderPage() {
  return (
    <ToolShell
      title="Cron Expression Builder"
      description="Build, parse, and understand cron expressions with a visual editor — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['timestamp-converter', 'json-formatter', 'regex-tester']}
      faq={[
        {
          question: 'What do the five fields in a cron expression mean?',
          answer:
            'Standard cron uses five space-separated fields, in this order: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, where 0 is Sunday). Each field can be a specific value, a "*" meaning "every", a range like 1-5, a list like 1,3,5, or a step like */15 meaning "every 15 units". Some systems add a sixth leading field for seconds — this tool targets standard 5-field Unix cron, described further below.',
        },
        {
          question: 'Why does "0 9 1 * MON" run on more days than just Mondays that fall on the 1st?',
          answer:
            'This is the single most common source of confusion with cron. When BOTH day-of-month and day-of-week are restricted to something other than "*", standard cron treats them as OR, not AND. "0 9 1 * MON" means "at 9am on the 1st of the month, OR at 9am on any Monday" — not "only Mondays that happen to be the 1st". If you actually want the intersection (only when both conditions are true), you generally can\'t express that in standard cron alone. This tool\'s next-run-times preview reflects this OR behavior directly, so you can see it in action rather than just take our word for it.',
        },
        {
          question: 'Will this exact expression work the same in Quartz, AWS EventBridge, or my hosting provider?',
          answer:
            'Not necessarily — this tool targets standard 5-field Unix/Linux cron syntax, the most common baseline. Other systems have real differences: Quartz (used by many Java schedulers) requires six or seven fields including seconds and uses 1-7 for day-of-week with different conventions for day-of-month/day-of-week interaction; AWS EventBridge/CloudWatch also uses six fields with a similar seconds requirement and treats "?" specially. If you\'re targeting one of these, treat this tool\'s output as a correct starting point that may need small adjustments, not a drop-in guarantee.',
        },
        {
          question: 'Is anything I enter here stored or sent anywhere?',
          answer:
            'No. Parsing, validation, the human-readable description, and the next-run-times calculation all happen locally in your browser via a JavaScript library — nothing is uploaded, logged, or transmitted.',
        },
      ]}
    >
      <CronBuilder />
    </ToolShell>
  );
}
