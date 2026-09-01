import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { PercentageCalculator } from './PercentageCalculator';

const TITLE = 'Percentage Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate percentages, percentage change, and more, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/percentage-calculator';

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

export default function PercentageCalculatorPage() {
  return (
    <ToolShell
      title="Percentage Calculator"
      description="Calculate percentages, percentage change, and more, instantly."
      category="calculators"
      tier="free"
      relatedTools={['unit-converter', 'dpi-calculator', 'invoice-generator']}
      faq={[
        {
          question: 'What do the different calculator modes do?',
          answer:
            '"X% of Y" finds a portion of a number (15% of 200 is 30). "X is what % of Y" does the reverse (50 is 25% of 200). "Percentage change" tracks a before/after change relative to a starting value. "Percentage difference" compares two values symmetrically, with neither treated as the starting point. "Add/subtract a %" applies a percentage to a value (a 20% tip, a 20% discount). "Reverse percentage" solves backward from a final value to the original — useful when you know a discounted price and want the price before the discount.',
        },
        {
          question: "What's the difference between a percentage increase and a percentage POINT increase?",
          answer:
            "This is a genuinely common mix-up. If a rate goes from 20% to 25%, that's a 5-percentage-point increase (25 − 20 = 5) — but it's a 25% relative increase (a 5-point gain is 25% of the original 20). \"Percentage points\" describes the raw difference between two percentages; a plain \"percentage increase\" describes that difference relative to the starting value. This calculator's \"percentage change\" mode computes the relative (25%) figure, not the point difference.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <PercentageCalculator />
    </ToolShell>
  );
}
