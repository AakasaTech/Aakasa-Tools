import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { DicewareGenerator } from './DicewareGenerator';
import { WORDLIST_SIZE, BITS_PER_WORD } from './utils/generatePassphrase';

const TITLE = 'Diceware Passphrase Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate secure, memorable passphrases using the diceware method, right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/diceware-generator';

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

export default function DicewareGeneratorPage() {
  return (
    <ToolShell
      title="Diceware Passphrase Generator"
      description="Generate secure, memorable passphrases using the diceware method."
      category="developer"
      tier="free"
      relatedTools={['password-generator', 'password-strength-checker', 'uuid-hash-generator']}
      faq={[
        {
          question: 'What is diceware, and how does it work?',
          answer:
            'Diceware builds a passphrase by randomly selecting whole words from a large, fixed wordlist, instead of randomly selecting individual characters. Originally this meant physically rolling dice to pick each word\'s number from a printed list — this tool does the same thing digitally, using cryptographically secure random selection instead of physical dice. The result is a passphrase that\'s both high-entropy and genuinely memorable, since "correct horse battery staple" is far easier to recall (and type) than an equivalent-strength string like "K7#mP2$vL9@x".',
        },
        {
          question: 'Why does word count matter more than which words are chosen?',
          answer:
            `Every word is drawn independently and uniformly from the same wordlist, so each word contributes exactly log₂(wordlist size) bits of entropy — which words end up chosen doesn't change that figure at all. With this tool's ${WORDLIST_SIZE.toLocaleString()}-word list, that's ${BITS_PER_WORD.toFixed(2)} bits per word, and each additional word multiplies the total number of possible passphrases by ${WORDLIST_SIZE.toLocaleString()}. Six words gives roughly ${(6 * BITS_PER_WORD).toFixed(0)} bits total — comparable to a long random character password — and each extra word beyond that adds a full ${BITS_PER_WORD.toFixed(1)} bits more.`,
        },
        {
          question: 'Which wordlist does this tool use?',
          answer: `The EFF (Electronic Frontier Foundation) long wordlist — ${WORDLIST_SIZE.toLocaleString()} words, licensed CC BY 4.0. It's the current best-practice diceware wordlist, designed to avoid words that are hard to spell, easily confused, or offensive. The exact wordlist size matters because the entropy math (log₂ of the list size) depends directly on it — a different list of a different size would give a different bits-per-word figure.`,
        },
        {
          question: 'Is anything I generate here sent anywhere?',
          answer:
            'No. Word selection uses the Web Crypto API (crypto.getRandomValues) — the same cryptographically secure randomness source used across this toolbox\'s other generators — entirely in your browser. Nothing is transmitted to a server, logged, or stored.',
        },
      ]}
    >
      <DicewareGenerator />
    </ToolShell>
  );
}
