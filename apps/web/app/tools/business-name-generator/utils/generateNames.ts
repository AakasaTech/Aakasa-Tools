import { fakerEN } from '@faker-js/faker';
import { PATTERN_GENERATORS, type PatternType } from './namePatterns';

export type NamingStyle = 'mixed' | 'modern' | 'classic' | 'playful' | 'descriptive';

export const NAMING_STYLES: { value: NamingStyle; label: string }[] = [
  { value: 'mixed', label: 'Any style (mixed)' },
  { value: 'modern', label: 'Modern / Tech' },
  { value: 'classic', label: 'Classic / Professional' },
  { value: 'playful', label: 'Playful / Creative' },
  { value: 'descriptive', label: 'Descriptive' },
];

/**
 * Each style narrows the batch to 2–3 stylistically-coherent pattern
 * types rather than exactly one — a style that only ever produced
 * "Keyword + suffix" fifteen times over would be monotonous and defeat
 * the point of browsing a batch, even though the style itself is meant to
 * feel distinct from the others.
 */
const STYLE_PATTERNS: Record<NamingStyle, PatternType[]> = {
  mixed: ['suffix', 'prefix', 'portmanteau', 'alliterative', 'invented'],
  modern: ['invented', 'portmanteau'],
  classic: ['suffix', 'prefix'],
  playful: ['alliterative', 'portmanteau'],
  descriptive: ['suffix', 'prefix'],
};

export interface GeneratedName {
  id: string;
  name: string;
  patternType: PatternType;
  keyword: string;
}

let nextId = 0;

function generateOne(keyword: string, patternType: PatternType): GeneratedName {
  const name = PATTERN_GENERATORS[patternType](keyword, fakerEN);
  return { id: `name-${(nextId += 1)}`, name, patternType, keyword };
}

/**
 * Produces a batch of `count` name suggestions, drawing keywords and
 * pattern types roughly evenly so the batch reads as varied rather than
 * dominated by whichever keyword or pattern happened to get picked first.
 * Deduplicates by the final name text — a small pool of pattern types and
 * keywords can otherwise coincidentally repeat the same string.
 */
export function generateNameSuggestions(keywords: string[], style: NamingStyle, count: number): GeneratedName[] {
  const cleanKeywords = keywords.map((k) => k.trim()).filter(Boolean);
  if (cleanKeywords.length === 0) return [];

  const patternTypes = STYLE_PATTERNS[style];
  const results: GeneratedName[] = [];
  const seenNames = new Set<string>();
  const maxAttempts = count * 10;

  let attempt = 0;
  while (results.length < count && attempt < maxAttempts) {
    const keyword = cleanKeywords[attempt % cleanKeywords.length]!;
    const patternType = patternTypes[Math.floor(attempt / cleanKeywords.length) % patternTypes.length]!;
    const candidate = generateOne(keyword, patternType);
    if (!seenNames.has(candidate.name.toLowerCase())) {
      seenNames.add(candidate.name.toLowerCase());
      results.push(candidate);
    }
    attempt += 1;
  }

  return fakerEN.helpers.shuffle(results);
}

/** Generates more names using the same pattern type and keyword as an
 * existing suggestion — "more like this" rather than a fresh random batch. */
export function generateMoreLikeThis(source: GeneratedName, count: number): GeneratedName[] {
  const results: GeneratedName[] = [];
  const seenNames = new Set<string>([source.name.toLowerCase()]);
  let attempt = 0;
  const maxAttempts = count * 10;

  while (results.length < count && attempt < maxAttempts) {
    const candidate = generateOne(source.keyword, source.patternType);
    if (!seenNames.has(candidate.name.toLowerCase())) {
      seenNames.add(candidate.name.toLowerCase());
      results.push(candidate);
    }
    attempt += 1;
  }
  return results;
}
