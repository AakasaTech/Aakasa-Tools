import { fakerEN, type Faker } from '@faker-js/faker';

export type PatternType = 'suffix' | 'prefix' | 'portmanteau' | 'alliterative' | 'invented';

export const PATTERN_LABELS: Record<PatternType, string> = {
  suffix: 'Keyword + suffix',
  prefix: 'Prefix + keyword',
  portmanteau: 'Portmanteau blend',
  alliterative: 'Alliterative pairing',
  invented: 'Invented / abstract',
};

function capitalize(word: string): string {
  return word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1);
}

function titleCaseKeyword(keyword: string): string {
  return keyword
    .trim()
    .split(/\s+/)
    .map(capitalize)
    .join(' ');
}

// --- Word pools ---------------------------------------------------------
// Curated rather than faker-generated: these need to actually read as
// business-name vocabulary (suffixes, prefixes, blend words), which isn't
// something faker's generic word lists are built for.

const SUFFIXES: Record<'classic' | 'descriptive' | 'modern', string[]> = {
  classic: ['Co.', 'Group', 'Studio', 'Partners', 'Collective', 'House', 'Holdings'],
  descriptive: ['Solutions', 'Hub', 'Services', 'Works', 'Direct', 'Central', 'Pro'],
  modern: ['Labs', 'Works', 'HQ', 'Tech', 'Loop', 'Systems'],
};
const ALL_SUFFIXES = [...SUFFIXES.classic, ...SUFFIXES.descriptive, ...SUFFIXES.modern];

const PREFIXES = ['The', 'Modern', 'Urban', 'Pure', 'True', 'Prime', 'Next', 'Bright', 'Bold'];

const BLEND_WORDS = [
  'Wave', 'Spark', 'Nova', 'Flux', 'Bloom', 'Craft', 'Forge', 'Peak', 'Glow', 'Drift',
  'Loop', 'Pulse', 'Grove', 'Haven', 'Ridge', 'Ember', 'Tide', 'Vista', 'Orbit', 'Nest',
];

const ALLITERATION_WORDS = [
  'Amber', 'Apex', 'Ace', 'Bold', 'Bright', 'Brave', 'Crisp', 'Cozy', 'Dash', 'Daring',
  'Elite', 'Eager', 'Fresh', 'Fable', 'Grand', 'Glow', 'Happy', 'Haven', 'Ideal', 'Iron',
  'Jolly', 'Joy', 'Keen', 'Kind', 'Lively', 'Lush', 'Mighty', 'Merry', 'Noble', 'Nimble',
  'Prime', 'Pure', 'Quick', 'Quirky', 'Rustic', 'Ready', 'Swift', 'Sunny', 'True', 'Trusty',
  'Urban', 'Unique', 'Vivid', 'Vital', 'Wise', 'Wild', 'Zesty', 'Zen',
];

const INVENTED_SUFFIXES = ['ly', 'ify', 'io', 'zen', 'ara', 'ix', 'eo', 'on', 'ova', 'yx', 'ai', 'ero'];

// --- Pattern generators ---------------------------------------------------

export function generateSuffixName(keyword: string, faker: Faker = fakerEN): string {
  const suffix = faker.helpers.arrayElement(ALL_SUFFIXES);
  return `${titleCaseKeyword(keyword)} ${suffix}`;
}

export function generatePrefixName(keyword: string, faker: Faker = fakerEN): string {
  const prefix = faker.helpers.arrayElement(PREFIXES);
  return `${prefix} ${titleCaseKeyword(keyword)}`;
}

/** Blends the keyword with a second, thematically-neutral evocative word —
 * first half of the keyword, second half of the blend word. Simple by
 * design: a real portmanteau algorithm would need syllable/phoneme
 * awareness this tool doesn't attempt. */
export function generatePortmanteauName(keyword: string, faker: Faker = fakerEN): string {
  const blendWord = faker.helpers.arrayElement(BLEND_WORDS);
  const a = keyword.trim().toLowerCase();
  const b = blendWord.toLowerCase();
  const cutA = Math.max(1, Math.ceil(a.length / 2));
  const cutB = Math.max(1, Math.floor(b.length / 2));
  return capitalize(a.slice(0, cutA) + b.slice(b.length - cutB));
}

/** Pairs the keyword with a word starting with the same letter. Falls back
 * to a suffix-pattern name if no alliteration word starts with the
 * keyword's first letter (possible for rare starting letters). */
export function generateAlliterativeName(keyword: string, faker: Faker = fakerEN): string {
  const firstLetter = keyword.trim()[0]?.toLowerCase();
  const matches = firstLetter ? ALLITERATION_WORDS.filter((word) => word[0]!.toLowerCase() === firstLetter) : [];
  if (matches.length === 0) {
    return generateSuffixName(keyword, faker);
  }
  const pairWord = faker.helpers.arrayElement(matches);
  return `${pairWord} ${titleCaseKeyword(keyword)}`;
}

/** Short, invented-sounding name loosely built from the keyword's own
 * letters — a startup-y feel rather than a real-word compound. */
export function generateInventedName(keyword: string, faker: Faker = fakerEN): string {
  const clean = keyword.trim().toLowerCase().replace(/[^a-z]/g, '');
  const rootLength = Math.min(clean.length, faker.number.int({ min: 3, max: 5 }));
  const root = clean.slice(0, Math.max(2, rootLength));
  const invented = faker.helpers.arrayElement(INVENTED_SUFFIXES);
  return capitalize(root + invented);
}

export const PATTERN_GENERATORS: Record<PatternType, (keyword: string, faker?: Faker) => string> = {
  suffix: generateSuffixName,
  prefix: generatePrefixName,
  portmanteau: generatePortmanteauName,
  alliterative: generateAlliterativeName,
  invented: generateInventedName,
};
