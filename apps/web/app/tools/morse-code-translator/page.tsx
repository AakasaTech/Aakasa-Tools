import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { MorseCodeTranslator } from './MorseCodeTranslator';

const TITLE = 'Morse Code Translator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Translate text to Morse code and back, with audio playback, right in your browser. No upload, no signup, nothing stored.';
const CANONICAL_URL = 'https://aakasa.dev/tools/morse-code-translator';

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

export default function MorseCodeTranslatorPage() {
  return (
    <ToolShell
      title="Morse Code Translator"
      description="Translate text to Morse code and back, with audio playback."
      category="text-writing"
      tier="free"
      relatedTools={['text-reverser', 'case-converter', 'ascii-art-generator']}
      faq={[
        {
          question: 'What is Morse code?',
          answer:
            "A way of encoding text as sequences of short and long signals — dots and dashes — originally developed in the 1830s-40s by Samuel Morse and Alfred Vail for the electric telegraph. Each letter, digit, and common punctuation mark has its own fixed dot/dash pattern, standardized internationally so operators anywhere could understand each other over a wire (and later, over radio) using nothing but on/off clicks or tones.",
        },
        {
          question: 'What do the dot/dash timings actually mean?',
          answer:
            'Morse timing follows a strict ratio, not arbitrary spacing: a dash lasts exactly 3 times as long as a dot, the gap between dots/dashes within one letter is 1 dot-length, the gap between letters is 3 dot-lengths, and the gap between words is 7 dot-lengths. This is what makes the audio playback here sound like genuine Morse rhythm rather than a random string of beeps — and it\'s also why the spacing in the text output (single space between letters, "/" between words) is meaningful rather than cosmetic.',
        },
        {
          question: 'How is text-to-Morse spacing represented?',
          answer:
            'Letters within a word are separated by a single space between their dot/dash groups, and words are separated by " / ". Converting Morse back to text expects the same convention (falling back to a run of two or more spaces as a word boundary if no "/" is present) — anything that doesn\'t parse as a recognized letter is shown in the output wrapped in brackets rather than silently dropped.',
        },
        {
          question: 'Is anything I type here sent anywhere?',
          answer:
            'No. Translation is a simple lookup-table transform, and audio playback uses the Web Audio API to synthesize tones directly in your browser — no files, no server round-trip. Nothing you type or play is transmitted, logged, or stored.',
        },
      ]}
    >
      <MorseCodeTranslator />
    </ToolShell>
  );
}
