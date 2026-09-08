export type LoremVariant = 'classic' | 'corporate';

export const VARIANT_LABELS: Record<LoremVariant, string> = {
  classic: 'Classic Latin',
  corporate: 'Corporate Buzzword (bonus)',
};

/**
 * The traditional Lorem Ipsum passage — scrambled/derived Latin drawn from
 * Cicero's 1st-century-BC "De Finibus Bonorum et Malorum", assembled into
 * this exact placeholder-text form by an unknown printer in the 1500s.
 * Public domain; this is the same standard passage every Lorem Ipsum tool
 * traces back to, not proprietary content.
 */
export const CLASSIC_OPENING_SENTENCE =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const CLASSIC_LOREM_TEXT = `${CLASSIC_OPENING_SENTENCE} Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.`;

export const CLASSIC_SENTENCES: string[] = CLASSIC_LOREM_TEXT.match(/[^.]+\./g)!.map((s) => s.trim());

export const CLASSIC_WORDS: string[] = CLASSIC_LOREM_TEXT.split(/\s+/).map((w) => w.replace(/[.,?]/g, '').toLowerCase()).filter(Boolean);

// --- Bonus variant: "Corporate Buzzword Ipsum" ------------------------------
// Original word lists and sentence templates written for this tool — not
// copied from any existing "themed ipsum" generator's specific vocabulary
// or phrasing. A lightweight Mad-Libs-style generator: templates with
// slots filled from part-of-speech word pools, which is a genuinely
// different generation mechanism from the classic variant's sentence-pool
// sampling (there's no traditional fixed "corporate passage" to sample
// complete sentences from), but exposed through the same interface.

const CORPORATE_NOUNS = [
  'synergy', 'bandwidth', 'ecosystem', 'roadmap', 'stakeholder buy-in', 'deliverable', 'framework', 'pipeline',
  'touchpoint', 'mindset', 'runway', 'north star', 'growth hacking', 'low-hanging fruit', 'value proposition',
  'core competency', 'action item', 'best practice', 'thought leadership', 'game plan',
];

const CORPORATE_ADJECTIVES = [
  'scalable', 'holistic', 'agile', 'actionable', 'disruptive', 'data-driven', 'best-in-class', 'cross-functional',
  'forward-thinking', 'mission-critical', 'turnkey', 'bleeding-edge', 'customer-centric', 'lean', 'robust',
];

const CORPORATE_VERBS = [
  'leverage', 'synergize', 'optimize', 'streamline', 'pivot on', 'iterate on', 'circle back on', 'unpack',
  'operationalize', 'double-click into', 'socialize', 'action', 'ideate on', 'move the needle on',
];

export const CORPORATE_OPENING_SENTENCE = "Let's circle back and leverage our synergy to unlock scalable growth.";

const CORPORATE_SENTENCE_TEMPLATES: string[] = [
  "Let's {verb} our {adjective} {noun} to drive {adjective2} {noun2}.",
  'We need to {verb} the {noun} before we {verb2} the {noun2}.',
  'Our {adjective} {noun} is the {adjective2} {noun2} of tomorrow.',
  'Can we {verb} a {adjective} {noun} by end of day?',
  'At the end of the day, it all comes down to {adjective} {noun}.',
  "I don't have the {noun} to {verb} this right now, but let's {verb2} it next sprint.",
  'This {noun} is a great opportunity to {verb} our {adjective} {noun2}.',
  'Going forward, we should {verb} more {adjective} {noun}.',
];

const CORPORATE_WORDS: string[] = [...CORPORATE_NOUNS, ...CORPORATE_ADJECTIVES, ...CORPORATE_VERBS].flatMap((phrase) =>
  phrase.split(' '),
);

export interface VariantCorpus {
  openingSentence: string;
  words: string[];
  /** For the classic variant, complete pre-written sentences to sample
   * from. For the corporate variant, undefined — sentences are generated
   * from templates instead (see `generateTemplateSentence`). */
  sentences?: string[];
  templates?: string[];
  nouns?: string[];
  adjectives?: string[];
  verbs?: string[];
}

export const VARIANT_CORPORA: Record<LoremVariant, VariantCorpus> = {
  classic: {
    openingSentence: CLASSIC_OPENING_SENTENCE,
    words: CLASSIC_WORDS,
    sentences: CLASSIC_SENTENCES,
  },
  corporate: {
    openingSentence: CORPORATE_OPENING_SENTENCE,
    words: CORPORATE_WORDS,
    templates: CORPORATE_SENTENCE_TEMPLATES,
    nouns: CORPORATE_NOUNS,
    adjectives: CORPORATE_ADJECTIVES,
    verbs: CORPORATE_VERBS,
  },
};
