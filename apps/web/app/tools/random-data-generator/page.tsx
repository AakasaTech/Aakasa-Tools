import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { RandomDataGenerator } from './RandomDataGenerator';

const TITLE = 'Random Data Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Generate realistic fake data for testing — names, emails, addresses, and more.';
const CANONICAL_URL = 'https://aakasa.dev/tools/random-data-generator';

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

export default function RandomDataGeneratorPage() {
  return (
    <ToolShell
      title="Random Data Generator"
      description="Generate realistic fake data for testing — names, emails, addresses, and more."
      category="data-files"
      tier="free"
      relatedTools={['csv-json-converter', 'json-formatter', 'uuid-hash-generator']}
      faq={[
        {
          question: 'What is this actually used for?',
          answer:
            'Populating a test database with realistic-looking rows, mocking API responses while building a frontend before the real backend exists, or filling a UI with placeholder content that looks like real data instead of "test test test" — anywhere you need data that looks plausible without using anyone real.',
        },
        {
          question: 'Is the generated data real?',
          answer:
            "No — every name, email, address, and other value this tool produces is entirely fake and randomly generated. It does not correspond to any real person, place, or business. It's possible for a randomly generated name or address to coincidentally resemble a real one, purely by chance, the same way any sufficiently large set of random combinations occasionally will — but nothing here is looked up, sourced, or based on real records.",
        },
        {
          question: 'What fields can I generate?',
          answer:
            'Names (full/first/last), email, phone number, street address, city, country, company name, job title, dates (past, future, or a specific range), booleans, integers and decimals with custom ranges, UUIDs, lorem-ipsum sentences and paragraphs, placeholder avatar/image URLs, and hex colors — build a schema from any combination of these, in any order.',
        },
        {
          question: 'Is anything I generate here sent anywhere?',
          answer: 'No — every value is generated locally in your browser. Nothing is uploaded or stored.',
        },
      ]}
    >
      <RandomDataGenerator />
    </ToolShell>
  );
}
