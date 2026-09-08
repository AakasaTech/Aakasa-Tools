import { countSyllablesInText } from './countSyllables';

export interface SentenceInfo {
  text: string;
  wordCount: number;
  avgSyllablesPerWord: number;
}

/**
 * Simple sentence splitting for the sentence-highlighting feature only —
 * deliberately NOT the same abbreviation-aware logic as word-counter's
 * `countSentences` (which this tool reuses for the actual sentence COUNT
 * feeding the readability formulas). Highlighting is a visual, low-stakes
 * approximation: a false split on "Dr. Smith" just produces one extra
 * very-short fragment that won't be flagged as complex anyway, so the
 * simpler regex is a reasonable, less code trade-off here.
 */
function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter((s) => s.length > 0) : [];
}

export function analyzeSentences(text: string): SentenceInfo[] {
  return splitIntoSentences(text).map((sentenceText) => {
    const words = sentenceText.match(/[a-zA-Z']+/g) ?? [];
    const wordCount = words.length;
    const syllables = countSyllablesInText(sentenceText);
    return {
      text: sentenceText,
      wordCount,
      avgSyllablesPerWord: wordCount > 0 ? syllables / wordCount : 0,
    };
  });
}
