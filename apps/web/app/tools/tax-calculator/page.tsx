import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { TaxCalculator } from './TaxCalculator';

const TITLE = 'Sales Tax & VAT Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate sales tax, VAT, or GST on any price, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/tax-calculator';

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

export default function TaxCalculatorPage() {
  return (
    <ToolShell
      title="Sales Tax & VAT Calculator"
      description="Calculate sales tax, VAT, or GST on any price, instantly."
      category="calculators"
      tier="free"
      relatedTools={['percentage-calculator', 'invoice-generator', 'tip-calculator']}
      faq={[
        {
          question: 'What does this tool actually do?',
          answer:
            "It's pure arithmetic on a tax rate YOU supply — either adding tax on top of a pre-tax price, or backing out the tax and pre-tax price from a total that already includes tax. It doesn't look up, know, or guess any tax rate on your behalf.",
        },
        {
          question: "Why doesn't this tool know my local sales tax, VAT, or GST rate?",
          answer:
            "Sales tax, VAT, and GST rates vary enormously — by country, by region or state within a country, often by product or service category, and they change over time. There's no single correct rate this tool could reasonably guess, so it doesn't try. You'll need to know or look up the rate that actually applies to your situation and enter it yourself; the quick-fill buttons (5%, 10%, 20%, etc.) are just round-number typing shortcuts, not suggestions of what your rate should be.",
        },
        {
          question: '"Add tax to a price" vs. "Extract tax from a total" — what\'s the difference?',
          answer:
            'These are genuinely different calculations. "Add tax to a price" starts from a pre-tax amount and adds tax on top — e.g. a $100 item at 7.5% tax comes to $107.50. "Extract tax from a total" goes the other way: given an amount that ALREADY includes tax (like a receipt total), it works out what the price was before tax and how much of that total was tax — e.g. a $107.50 total at 7.5% tax extracts back to a $100.00 pre-tax price. That second calculation divides by (1 + rate), not a plain subtraction — subtracting the rate directly from the total is a common mistake that gives a slightly wrong (too-low) pre-tax price.',
        },
        {
          question: 'Is this tax advice, and is anything I enter here sent anywhere?',
          answer:
            "No to both. This is a calculator, not tax advice — for your actual tax obligations, consult a tax professional or your relevant tax authority. And no data is sent anywhere; every calculation happens locally in your browser.",
        },
      ]}
    >
      <TaxCalculator />
    </ToolShell>
  );
}
