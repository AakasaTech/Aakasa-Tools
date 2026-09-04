import type { Faker } from '@faker-js/faker';

export type FieldType =
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phoneNumber'
  | 'streetAddress'
  | 'city'
  | 'country'
  | 'companyName'
  | 'jobTitle'
  | 'date'
  | 'boolean'
  | 'integer'
  | 'decimal'
  | 'uuid'
  | 'sentence'
  | 'paragraph'
  | 'avatarUrl'
  | 'color';

export type DateMode = 'past' | 'future' | 'range';

export interface FieldOptions {
  dateMode?: DateMode;
  /** ISO date strings (YYYY-MM-DD), used when dateMode is "range". */
  dateFrom?: string;
  dateTo?: string;
  /** Integer/decimal bounds. */
  min?: number;
  max?: number;
  /** Decimal only — number of digits after the decimal point. */
  precision?: number;
}

export interface FieldTypeDefinition {
  label: string;
  defaultOptions: FieldOptions;
  /** True for field types with configurable options the UI should expose
   * (date range, numeric bounds) — the rest use sensible faker defaults. */
  hasOptions: boolean;
  generate: (faker: Faker, options: FieldOptions) => unknown;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Single source of truth mapping each supported field type to its faker.js
 * call — adding a new field type later is just a new registry entry, not a
 * change to the generation loop in generateDataset.ts.
 */
export const FIELD_TYPE_REGISTRY: Record<FieldType, FieldTypeDefinition> = {
  fullName: { label: 'Full Name', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.person.fullName() },
  firstName: { label: 'First Name', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.person.firstName() },
  lastName: { label: 'Last Name', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.person.lastName() },
  email: { label: 'Email', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.internet.email() },
  phoneNumber: { label: 'Phone Number', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.phone.number() },
  streetAddress: { label: 'Street Address', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.location.streetAddress() },
  city: { label: 'City', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.location.city() },
  country: { label: 'Country', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.location.country() },
  companyName: { label: 'Company Name', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.company.name() },
  jobTitle: { label: 'Job Title', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.person.jobTitle() },
  date: {
    label: 'Date',
    defaultOptions: { dateMode: 'past' },
    hasOptions: true,
    generate: (faker, options) => {
      const mode = options.dateMode ?? 'past';
      if (mode === 'future') return toIsoDate(faker.date.future());
      if (mode === 'range' && options.dateFrom && options.dateTo) {
        return toIsoDate(faker.date.between({ from: options.dateFrom, to: options.dateTo }));
      }
      return toIsoDate(faker.date.past());
    },
  },
  boolean: { label: 'Boolean', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.datatype.boolean() },
  integer: {
    label: 'Integer',
    defaultOptions: { min: 0, max: 1000 },
    hasOptions: true,
    generate: (faker, options) => faker.number.int({ min: options.min ?? 0, max: options.max ?? 1000 }),
  },
  decimal: {
    label: 'Decimal',
    defaultOptions: { min: 0, max: 1000, precision: 2 },
    hasOptions: true,
    generate: (faker, options) =>
      faker.number.float({ min: options.min ?? 0, max: options.max ?? 1000, fractionDigits: options.precision ?? 2 }),
  },
  uuid: { label: 'UUID', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.string.uuid() },
  sentence: { label: 'Sentence', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.lorem.sentence() },
  paragraph: { label: 'Paragraph', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.lorem.paragraph() },
  avatarUrl: { label: 'Avatar / Image URL', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.image.avatar() },
  color: { label: 'Color (hex)', defaultOptions: {}, hasOptions: false, generate: (faker) => faker.color.rgb() },
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_REGISTRY) as FieldType[];

export interface FieldSchema {
  id: string;
  name: string;
  type: FieldType;
  options: FieldOptions;
}
