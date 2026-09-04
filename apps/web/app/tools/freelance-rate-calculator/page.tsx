import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FreelanceRateCalculator } from './FreelanceRateCalculator';

const TITLE = 'Freelance Rate Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate your ideal hourly or project rate based on your goals and expenses.';
const CANONICAL_URL = 'https://aakasa.dev/tools/freelance-rate-calculator';

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

export default function FreelanceRateCalculatorPage() {
  return (
    <ToolShell
      title="Freelance Rate Calculator"
      description="Calculate your ideal hourly or project rate based on your goals and expenses."
      category="calculators"
      tier="free"
      relatedTools={['invoice-generator', 'percentage-calculator', 'unit-converter']}
      faq={[
        {
          question: 'How does this calculator arrive at a rate?',
          answer:
            "It works backward from a target income. Starting from the annual income you want to actually take home, it adds your annual business expenses and grosses the total up for your estimated tax rate to find the revenue you need to bring in. Then it divides that required revenue by your actual billable hours per year — not your total working hours, but the portion of them you can actually bill to clients — to arrive at a required hourly rate.",
        },
        {
          question: 'Is this telling me what I should charge based on market rates?',
          answer:
            "No — and that's an important distinction. This tool has no idea what clients in your market, industry, or experience level actually pay; it only does the arithmetic of \"here's what YOU need to charge to hit YOUR numbers,\" based entirely on the income, expenses, and time figures you enter. That's a more honest starting point than a tool pretending to know competitive rates it has no way of actually knowing. Treat the result as a floor worth understanding, not a market benchmark.",
        },
        {
          question: 'Why does "billable percentage" matter, and why not just use my total work hours?',
          answer:
            "Because not every hour you work is an hour you bill. Administrative work, marketing, proposals, unpaid pitching, and client communication all take real time without directly generating revenue — and it's easy to underestimate how much. If you calculate your rate against total working hours instead of actual billable hours, you'll systematically undercharge, since the hours you don't bill still have to be paid for by the ones you do.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <FreelanceRateCalculator />
    </ToolShell>
  );
}
