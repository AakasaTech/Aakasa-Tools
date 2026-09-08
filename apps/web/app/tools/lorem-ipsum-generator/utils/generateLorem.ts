import { VARIANT_CORPORA, type LoremVariant } from './loremCorpus';

export type LoremUnit = 'paragraphs' | 'sentences' | 'words';

const MIN_SENTENCES_PER_PARAGRAPH = 3;
const MAX_SENTENCES_PER_PARAGRAPH = 7;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleOne<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function capitalizeFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

/** Fills one of the corporate variant's Mad-Libs-style templates with
 * randomly sampled words from its part-of-speech pools. Each `{slot}`
 * (verb/verb2/noun/noun2/adjective/adjective2) is filled independently,
 * so the same template can produce many different sentences. */
function generateTemplateSentence(variant: LoremVariant): string {
  const corpus = VARIANT_CORPORA[variant];
  if (!corpus.templates || !corpus.nouns || !corpus.adjectives || !corpus.verbs) {
    throw new Error(`Variant "${variant}" has no sentence templates configured.`);
  }
  const template = sampleOne(corpus.templates);
  const filled = template
    .replace(/\{noun2\}/g, () => sampleOne(corpus.nouns!))
    .replace(/\{noun\}/g, () => sampleOne(corpus.nouns!))
    .replace(/\{adjective2\}/g, () => sampleOne(corpus.adjectives!))
    .replace(/\{adjective\}/g, () => sampleOne(corpus.adjectives!))
    .replace(/\{verb2\}/g, () => sampleOne(corpus.verbs!))
    .replace(/\{verb\}/g, () => sampleOne(corpus.verbs!));
  return capitalizeFirst(filled);
}

function generateSentence(variant: LoremVariant): string {
  const corpus = VARIANT_CORPORA[variant];
  if (corpus.sentences) {
    return sampleOne(corpus.sentences);
  }
  return generateTemplateSentence(variant);
}

function generateParagraph(variant: LoremVariant): string {
  const sentenceCount = randomInt(MIN_SENTENCES_PER_PARAGRAPH, MAX_SENTENCES_PER_PARAGRAPH);
  const sentences = Array.from({ length: sentenceCount }, () => generateSentence(variant));
  return sentences.join(' ');
}

function generateWords(count: number, variant: LoremVariant): string[] {
  const corpus = VARIANT_CORPORA[variant];
  return Array.from({ length: count }, () => sampleOne(corpus.words));
}

/**
 * Generates `count` units of placeholder text (paragraphs, sentences, or
 * words) from the given variant's corpus. When `startWithClassicOpening`
 * is on, the output's very beginning is forced to the variant's fixed
 * opening phrase — the traditional "Lorem ipsum dolor sit amet..." for
 * the classic variant, or its corporate-buzzword equivalent — with
 * everything after that randomly sampled as usual.
 */
export function generateLoremText(
  unit: LoremUnit,
  count: number,
  startWithClassicOpening: boolean,
  wrapInHtml: boolean,
  variant: LoremVariant = 'classic',
): string {
  const safeCount = Math.max(1, Math.floor(count));
  const corpus = VARIANT_CORPORA[variant];

  if (unit === 'words') {
    let words: string[];
    if (startWithClassicOpening) {
      const openingWords = corpus.openingSentence.replace(/[.,]/g, '').split(/\s+/);
      const openingSlice = openingWords.slice(0, Math.min(openingWords.length, safeCount));
      const remaining = safeCount - openingSlice.length;
      words = [...openingSlice, ...(remaining > 0 ? generateWords(remaining, variant) : [])];
    } else {
      words = generateWords(safeCount, variant);
    }
    const text = `${capitalizeFirst(words.join(' '))}.`;
    return wrapInHtml ? `<p>${text}</p>` : text;
  }

  if (unit === 'sentences') {
    const sentences: string[] = [];
    if (startWithClassicOpening) {
      sentences.push(corpus.openingSentence);
    }
    while (sentences.length < safeCount) {
      sentences.push(generateSentence(variant));
    }
    const text = sentences.slice(0, safeCount).join(' ');
    return wrapInHtml ? `<p>${text}</p>` : text;
  }

  // unit === 'paragraphs'
  const paragraphs: string[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    if (i === 0 && startWithClassicOpening) {
      const rest = generateParagraph(variant);
      paragraphs.push(`${corpus.openingSentence} ${rest}`);
    } else {
      paragraphs.push(generateParagraph(variant));
    }
  }

  return wrapInHtml ? paragraphs.map((p) => `<p>${p}</p>`).join('\n') : paragraphs.join('\n\n');
}
