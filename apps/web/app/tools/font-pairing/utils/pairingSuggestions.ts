import { FONT_CATALOG, type FontCatalogEntry, type FontCategory } from './fontCatalog';

export interface CategoryPairing {
  headingCategory: FontCategory;
  bodyCategory: FontCategory;
}

/**
 * Category combinations considered reasonable pairings. Deliberately
 * excludes same-category combos (two sans-serifs, two display fonts, two
 * monospace fonts) — the classic failure mode for a naive random pick,
 * where the heading and body end up too similar to read as an intentional
 * pairing, or (for two display fonts especially) visually compete with
 * each other. Body text is always assigned a highly-legible category
 * (serif or sans-serif) — a display or monospace font as body copy reads
 * poorly at paragraph length regardless of what it's paired with.
 */
export const GOOD_PAIRINGS: CategoryPairing[] = [
  { headingCategory: 'serif', bodyCategory: 'sans-serif' },
  { headingCategory: 'sans-serif', bodyCategory: 'serif' },
  { headingCategory: 'display', bodyCategory: 'sans-serif' },
  { headingCategory: 'display', bodyCategory: 'serif' },
  { headingCategory: 'monospace', bodyCategory: 'sans-serif' },
];

function pickRandom<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error('pickRandom called with an empty array');
  return item;
}

export interface RandomPairing {
  heading: FontCatalogEntry;
  body: FontCatalogEntry;
}

/** Picks a random heading/body pairing biased toward the category
 * combinations above, rather than picking two fonts fully uniformly at
 * random from the whole catalog. */
export function pickRandomPairing(catalog: FontCatalogEntry[] = FONT_CATALOG): RandomPairing {
  const combo = pickRandom(GOOD_PAIRINGS);
  const headingCandidates = catalog.filter((font) => font.category === combo.headingCategory);
  const bodyCandidates = catalog.filter((font) => font.category === combo.bodyCategory);
  return {
    heading: pickRandom(headingCandidates),
    body: pickRandom(bodyCandidates),
  };
}
