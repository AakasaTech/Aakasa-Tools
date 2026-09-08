import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { LoanCalculator } from './LoanCalculator';

const TITLE = 'Loan & EMI Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate loan payments, EMI, and total interest instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/loan-calculator';

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

export default function LoanCalculatorPage() {
  return (
    <ToolShell
      title="Loan & EMI Calculator"
      description="Calculate loan payments, EMI, and total interest instantly."
      category="calculators"
      tier="free"
      relatedTools={['compound-interest-calculator', 'percentage-calculator', 'unit-converter']}
      faq={[
        {
          question: 'What is EMI, and how is it calculated?',
          answer:
            'EMI stands for Equated Monthly Installment — the fixed amount paid every month toward a loan until it\'s fully paid off. It\'s calculated with the standard amortization formula, M = P × [r(1+r)^n] / [(1+r)^n − 1], where P is the loan principal, r is the monthly interest rate, and n is the total number of monthly payments. Each month\'s payment is split between interest (on the remaining balance) and principal — early payments are mostly interest, and that split gradually shifts toward principal as the balance shrinks.',
        },
        {
          question: "Why isn't the monthly rate just the annual rate?",
          answer:
            'A loan\'s interest rate is quoted as a nominal ANNUAL rate, but payments happen monthly, so the rate applied each month is the annual rate divided by 12 — a 6% annual rate means a 0.5% monthly rate. This is a genuinely common source of calculation errors: dividing by 12 is the standard convention lenders and EMI calculators use, and it\'s different from a compounded monthly-equivalent rate, which would be calculated a different way and used for a different purpose (comparing effective annual yields, not amortizing a loan).',
        },
        {
          question: 'Does this account for fees, insurance, or rate changes?',
          answer:
            "No — this calculates a pure fixed-rate amortization based only on the principal, rate, and term you enter. Real loans often include origination fees, closing costs, mortgage or loan insurance, taxes escrowed into the payment, or a variable rate that changes over time — none of which this simple calculator models.",
        },
        {
          question: 'Is this a loan offer or pre-approval?',
          answer:
            "No. This computes payments purely from the numbers you enter — it isn't a loan offer, quote, or pre-approval from any lender, and it doesn't reflect any specific lender's actual rates, fees, or approval criteria. For a real loan, terms come from the lender itself.",
        },
      ]}
    >
      <LoanCalculator />
    </ToolShell>
  );
}
