import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { UnitConverter } from './UnitConverter';

const TITLE = 'Unit Converter - Free Online Conversion Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Convert length, weight, temperature, volume, area, speed, data, and time — instantly, in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/unit-converter';

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

export default function UnitConverterPage() {
  return (
    <ToolShell
      title="Unit Converter"
      description="Convert between length, weight, temperature, volume, and more — instantly, in your browser."
      category="calculators"
      tier="free"
      relatedTools={['percentage-calculator', 'bmi-calculator', 'age-calculator']}
      faq={[
        {
          question: 'Which unit categories does this cover?',
          answer:
            'Length, weight/mass, temperature, volume, area, speed, data storage, and time. Each category has its own unit list — for example volume includes both US and UK (imperial) gallons and pints, which are different sizes and a common source of mix-ups, so they\'re labeled explicitly.',
        },
        {
          question: 'How is precision/rounding handled?',
          answer:
            'Results are rounded to a configurable number of decimal places, with a starting default chosen per category (for example temperature defaults to 2 decimal places, while length defaults to 4 since converting between very different scales — millimeters and kilometers, say — needs more decimal places to stay meaningful). Use the decimal places stepper to show more or fewer digits for your specific use case, from a quick recipe conversion to an engineering calculation.',
        },
        {
          question: 'Why is temperature different from the other categories?',
          answer:
            'Every other category converts by a simple ratio — 1 mile is always 1.609 kilometers, no matter the starting value. Temperature scales don\'t share a common zero point (0°C, 0°F, and 0K are three different temperatures), so converting requires an offset as well as a scale, not just a multiplication. This tool handles temperature with its own dedicated conversion logic rather than forcing it into the same ratio-based path as everything else.',
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer:
            'No. All conversion math runs entirely in your browser using plain arithmetic — nothing is uploaded, logged, or stored, the same as every tool in this toolbox.',
        },
      ]}
    >
      <UnitConverter />
    </ToolShell>
  );
}
