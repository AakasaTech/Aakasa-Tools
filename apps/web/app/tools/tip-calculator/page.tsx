import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { TipCalculator } from './TipCalculator';

const TITLE = 'Tip Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate tips and split the bill instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/tip-calculator';

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

export default function TipCalculatorPage() {
  return (
    <ToolShell
      title="Tip Calculator"
      description="Calculate tips and split the bill instantly."
      category="calculators"
      tier="free"
      relatedTools={['percentage-calculator', 'invoice-generator', 'unit-converter']}
      faq={[
        {
          question: 'Are the 10%/15%/18%/20%/25% presets a universal standard?',
          answer:
            "No — those presets reflect common U.S. dining-tip norms, not a universal rule. Tipping customs vary significantly by country and region, and even by the type of service (restaurant, delivery, taxi, salon, hotel) — in many places a smaller tip, a service charge already included in the bill, or no tip at all is the norm. Use the custom percentage or flat-amount option for anything outside those presets.",
        },
        {
          question: 'How does splitting the bill work together with the tip?',
          answer:
            "The tip is calculated first (either as a percentage of the bill, or as the flat amount you enter), then the bill plus tip is split evenly across the number of people. Because a total often doesn't divide into whole cents, the calculator distributes any leftover cent(s) so a few people pay one cent more than the rest — the per-person amounts always add up exactly to the real total, never a cent short.",
        },
        {
          question: 'What does "round up per-person total" do?',
          answer:
            'It rounds each person\'s share up to the nearest whole currency unit — a common real-world shortcut for splitting a bill without dealing in odd cents. The calculator shows both the exact per-person amount and the rounded-up figure, along with the small surplus the rounding adds.',
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <TipCalculator />
    </ToolShell>
  );
}
