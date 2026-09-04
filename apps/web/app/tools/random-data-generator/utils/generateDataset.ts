// Named locale-specific instances (fakerEN, fakerEN_US, fakerEN_GB) rather
// than the default `faker` mega-export — each pulls in only its own
// locale's data module, so bundlers can tree-shake out the ~50 locales
// this tool doesn't offer, instead of bundling faker.js's entire locale set.
import { fakerEN, fakerEN_GB, fakerEN_US, type Faker } from '@faker-js/faker';
import { FIELD_TYPE_REGISTRY, type FieldSchema } from './fieldTypes';

export type Locale = 'en' | 'en_US' | 'en_GB';

const LOCALE_FAKERS: Record<Locale, Faker> = {
  en: fakerEN,
  en_US: fakerEN_US,
  en_GB: fakerEN_GB,
};

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'Generic (English)' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
];

/**
 * Generates `count` records from `schema`. Each locale's faker instance is
 * a module-level singleton (reused across calls), so its RNG state
 * persists between generations — if a `seed` is given it's applied for
 * reproducibility; otherwise the instance is re-seeded from `Math.random()`
 * so a later unseeded call doesn't silently keep replaying a previous run's
 * fixed seed.
 */
export function generateRecords(schema: FieldSchema[], count: number, locale: Locale = 'en', seed?: number): Record<string, unknown>[] {
  const faker = LOCALE_FAKERS[locale];
  faker.seed(seed !== undefined ? seed : Math.floor(Math.random() * 1_000_000_000));

  const records: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i += 1) {
    const record: Record<string, unknown> = {};
    for (const field of schema) {
      const definition = FIELD_TYPE_REGISTRY[field.type];
      record[field.name] = definition.generate(faker, field.options);
    }
    records.push(record);
  }
  return records;
}
