import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { CurrencyConverter } from './CurrencyConverter';

const TITLE = 'Currency Converter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Convert between currencies instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/currency-converter';

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

export default function CurrencyConverterPage() {
  return (
    <ToolShell
      title="Currency Converter"
      description="Convert between currencies instantly."
      category="calculators"
      tier="free"
      relatedTools={['unit-converter', 'percentage-calculator', 'invoice-generator']}
      faq={[
        {
          question: 'Where do the exchange rates come from, and how current are they?',
          answer:
            "Rates are fetched from exchangerate-api.com's free open-access endpoint, which itself refreshes about once a day, and are cached on our server for up to 6 hours before being refreshed again. Each rate shown is stamped with exactly when it was last updated, so you always know how current it is — this isn't a live trading feed with per-second updates.",
        },
        {
          question: 'Can I use this for an actual currency exchange or financial transaction?',
          answer:
            "No — this tool is for quick estimates, budgeting, and travel planning, not for transactions that need an exact, current, bank-grade rate. Real currency exchange involves spreads, fees, and rates that can differ from the mid-market rate shown here. For an actual exchange or transfer, use your bank or a dedicated financial service.",
        },
        {
          question: 'How much can exchange rates actually move?',
          answer:
            'More than people often expect — major currency pairs can shift by a percent or more within a single day during volatile periods, and the rate shown here reflects a single point in time, not a continuously updating feed. If precision matters, check a live source immediately before you need it.',
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer:
            'No — the amount you enter and the currencies you pick never leave your browser. The only network request this tool makes is fetching the shared exchange-rate table itself (not tied to your input in any way), which happens automatically when the page loads.',
        },
      ]}
    >
      <CurrencyConverter />
    </ToolShell>
  );
}
