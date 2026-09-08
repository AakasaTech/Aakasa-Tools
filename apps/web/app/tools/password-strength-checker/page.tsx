import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { PasswordStrengthChecker } from './PasswordStrengthChecker';

const TITLE = 'Password Strength Checker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Check how strong your password is, entirely offline, in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/password-strength-checker';

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

export default function PasswordStrengthCheckerPage() {
  return (
    <ToolShell
      title="Password Strength Checker"
      description="Check how strong your password is, entirely offline, in your browser."
      category="developer"
      tier="free"
      relatedTools={['password-generator', 'uuid-hash-generator', 'file-hash-checker']}
      faq={[
        {
          question: 'How is password strength measured?',
          answer:
            "Primarily by entropy — a measure, in bits, of how large the space of possible passwords is given the length and variety of characters used. This uses the exact same entropy calculation as this toolbox's own Password Generator, so the two tools agree on what \"strong\" means rather than using two different definitions of strength.",
        },
        {
          question: 'Is anything I type into this tool ever sent, stored, or logged anywhere?',
          answer:
            "No — never, under any circumstance. This tool runs entirely in your browser. There is no network request, no server-side check, no logging, and no analytics event of any kind tied to what you type here, not even in hashed or aggregate form. That matters more for this tool than almost any other in this toolbox, since you may well be checking a password you actually use — it's safe to do that here.",
        },
        {
          question: "Doesn't a high entropy score mean a password is safe?",
          answer:
            'Not necessarily. Raw entropy math treats a password purely as a random string, but real people (and real attackers) don\'t — a password like "password123" technically has letters and numbers, but it\'s trivially guessable because it\'s an extremely common pattern, not because it lacks character variety. This tool also runs pattern-based checks for exactly that gap: sequential characters, keyboard-adjacent runs, repeated characters, and common words with leetspeak-style substitutions (like "p@ssw0rd") — the kind of weakness that shows up in leaked-password lists long before brute-force math would ever find it.',
        },
        {
          question: 'Any general advice on passwords?',
          answer:
            'Briefly: use a different password for every site (so one leak doesn\'t compromise the rest), use a password manager rather than trying to remember many strong passwords, and avoid basing passwords on personal information (names, birthdays) that\'s easy to find or guess. This tool checks one password at a time — it doesn\'t manage or store them for you.',
        },
      ]}
    >
      <PasswordStrengthChecker />
    </ToolShell>
  );
}
