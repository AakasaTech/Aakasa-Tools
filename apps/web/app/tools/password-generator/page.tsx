import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { PasswordGenerator } from './PasswordGenerator';

const TITLE = 'Password Generator - Free Secure Password Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate strong, random passwords using the Web Crypto API — computed locally, nothing sent anywhere.';
const CANONICAL_URL = 'https://aakasa.dev/tools/password-generator';

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

export default function PasswordGeneratorPage() {
  return (
    <ToolShell
      title="Password Generator"
      description="Generate strong, random passwords — computed locally, never sent anywhere."
      category="developer"
      tier="free"
      relatedTools={['uuid-hash-generator', 'json-formatter', 'base64-tool']}
      faq={[
        {
          question: 'What actually makes a password strong?',
          answer:
            'Length matters more than complexity rules. A longer password drawn from a smaller character set is usually stronger than a short one stuffed with symbols — each extra character multiplies the number of guesses an attacker needs, while an extra required symbol only adds a little. Aim for at least 16 characters when the site allows it.',
        },
        {
          question: 'Are the passwords this tool generates stored anywhere?',
          answer:
            'No. Every password is generated using the Web Crypto API (crypto.getRandomValues) directly in your browser — never Math.random(), which is not cryptographically secure. Nothing is sent to a server, logged, or saved anywhere.',
        },
        {
          question: 'How often should I rotate passwords?',
          answer:
            'Only when there is a reason to — a breach, shared access ending, or a site that was compromised. Routine forced rotation on a healthy account tends to push people toward weaker, more predictable passwords, so a long random password left alone is usually better than a mediocre one changed every 90 days.',
        },
        {
          question: 'Is it safe to use this for a real account password?',
          answer:
            'Yes. Generation happens entirely client-side using a cryptographically secure random source, so the password never exists anywhere but your browser until you paste it in. Use a password manager to store it rather than relying on memory.',
        },
      ]}
    >
      <PasswordGenerator />
    </ToolShell>
  );
}
