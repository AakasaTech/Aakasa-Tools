import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { BmiCalculator } from './BmiCalculator';

const TITLE = 'BMI Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate Body Mass Index (BMI) instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/bmi-calculator';

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

export default function BmiCalculatorPage() {
  return (
    <ToolShell
      title="BMI Calculator"
      description="Calculate Body Mass Index (BMI) instantly."
      category="calculators"
      tier="free"
      relatedTools={['unit-converter', 'percentage-calculator']}
      faq={[
        {
          question: 'What is BMI and how is it calculated?',
          answer:
            'Body Mass Index is weight divided by height squared — in metric units, BMI = weight (kg) ÷ height (m)². It\'s a simple screening number, not a body-composition measurement, and this tool converts imperial input (lb, ft/in) to metric internally before applying that same formula.',
        },
        {
          question: 'What are the standard BMI categories?',
          answer:
            'Using the WHO adult reference ranges: Underweight is below 18.5, Normal weight is 18.5–24.9, Overweight is 25.0–29.9, and Obese is 30.0 and above. These are population-level reference ranges, not a personal verdict.',
        },
        {
          question: 'What are the limitations of BMI?',
          answer:
            "Worth stating plainly, not as a footnote: BMI doesn't directly measure body fat, and it doesn't account for muscle mass — it's known to misclassify very muscular individuals as overweight or obese, for example. It also isn't equally accurate across all ages, sexes, and populations. BMI is one data point among several a healthcare provider would consider — it's a general screening tool, not a diagnosis, and not a substitute for professional medical assessment.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — this calculation happens entirely in your browser. Nothing you enter is uploaded or stored.',
        },
      ]}
    >
      <BmiCalculator />
    </ToolShell>
  );
}
