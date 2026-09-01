import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { AgeCalculator } from './AgeCalculator';

const TITLE = 'Age & Date Difference Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate age or the exact time between two dates, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/age-calculator';

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

export default function AgeCalculatorPage() {
  return (
    <ToolShell
      title="Age & Date Difference Calculator"
      description="Calculate age or the exact time between two dates, instantly."
      category="calculators"
      tier="free"
      relatedTools={['timestamp-converter', 'unit-converter', 'percentage-calculator']}
      faq={[
        {
          question: 'How does this handle leap years and different month lengths?',
          answer:
            "Properly — this isn't a rough estimate based on dividing total days by 365.25. The calculation walks calendar months forward from the start date (correctly handling that months have different lengths, and that February has 29 days in leap years), so the year/month/day breakdown is exact. A birth date of February 29th in a leap year is also handled sensibly in a non-leap year — it's treated as February 28th, the same convention most calendars and legal systems use.",
        },
        {
          question: 'Does this account for time zones or time of day?',
          answer:
            "No — it works entirely with the calendar dates as you enter them (year, month, day), not any time-of-day or time zone detail. This keeps the result exactly matching what you'd count on a calendar, regardless of where you or the dates in question are.",
        },
        {
          question: 'Does the business-day count exclude public holidays?',
          answer:
            "No — it excludes only Saturdays and Sundays. Public holiday calendars vary by country and region, so factoring them in would make the result correct for some places and wrong for others; this figure is deliberately just a weekday count.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <AgeCalculator />
    </ToolShell>
  );
}
