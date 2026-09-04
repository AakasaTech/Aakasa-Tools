import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CompoundInterestCalculator } from './CompoundInterestCalculator';

const TITLE = 'Compound Interest Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate how your savings or investments could grow over time.';
const CANONICAL_URL = 'https://aakasa.dev/tools/compound-interest-calculator';

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

export default function CompoundInterestCalculatorPage() {
  return (
    <ToolShell
      title="Compound Interest Calculator"
      description="Calculate how your savings or investments could grow over time."
      category="calculators"
      tier="free"
      relatedTools={['percentage-calculator', 'unit-converter', 'invoice-generator']}
      faq={[
        {
          question: 'What is compound interest, and how is it different from simple interest?',
          answer:
            "Simple interest is calculated only on the original principal, so it grows by the same amount every period. Compound interest is calculated on the principal PLUS any interest already earned, so interest itself starts earning interest. For example, $1,000 at 5% simple interest earns exactly $50 every year. At 5% compound interest (annually), year one also earns $50 — but year two earns 5% of $1,050, or $52.50, and the gap widens every year after that.",
        },
        {
          question: 'What does "compounding frequency" mean, and does it matter much?',
          answer:
            'It\'s how often earned interest gets added to the balance so it starts earning its own interest — annually, semi-annually, quarterly, monthly, or daily. At the same nominal annual rate, more frequent compounding produces a (slightly) higher final balance, since interest starts compounding sooner. The difference between monthly and daily compounding is usually small; the difference between annual and monthly is more noticeable, especially over longer time periods.',
        },
        {
          question: 'Is this projecting what my money will actually earn?',
          answer:
            "No — this is a mathematical projection based entirely on the numbers you enter, not a prediction, promise, or guarantee of any real investment's performance. Real returns vary, involve risk, and are never guaranteed at a fixed rate the way this calculator assumes. No specific interest rate is suggested here as realistic or achievable for any investment, and this tool doesn't recommend any investment strategy or product — it's a calculator, not financial advice. For real decisions, that's a conversation for a licensed financial advisor.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <CompoundInterestCalculator />
    </ToolShell>
  );
}
