/**
 * Typed registry of every category/unit/conversion factor. No DOM, no
 * React — pure data plus the temperature-specific conversion functions.
 *
 * Every category except temperature is pure-ratio: each unit stores how
 * many of that category's BASE unit equal 1 of it, so converting is just
 * "multiply into base units, then divide out of them" (see convert.ts).
 * Temperature is NOT a ratio — 0°C, 0°F, and 0K are three different
 * temperatures, so there is no single multiplier that relates them; each
 * unit has an offset as well as a scale. Forcing temperature through the
 * same multiply-through-base-unit path as the other categories would
 * silently produce wrong (but plausible-looking) numbers, so it's kept as
 * an explicit special case with its own toCelsius/fromCelsius functions
 * instead — see convert.ts's `kind` dispatch.
 */

export type UnitCategory = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'speed' | 'data' | 'time';

export interface UnitOption {
  id: string;
  label: string;
}

export interface RatioCategoryDefinition {
  kind: 'ratio';
  id: UnitCategory;
  label: string;
  units: UnitOption[];
  /** Base units per 1 of each unit id, e.g. length's base is meters, so km -> 1000. */
  factors: Record<string, number>;
  defaultDecimalPlaces: number;
  note?: string;
}

export interface TemperatureCategoryDefinition {
  kind: 'temperature';
  id: 'temperature';
  label: string;
  units: UnitOption[];
  defaultDecimalPlaces: number;
  note?: string;
}

export type CategoryDefinition = RatioCategoryDefinition | TemperatureCategoryDefinition;

export const CATEGORY_ORDER: UnitCategory[] = [
  'length',
  'weight',
  'temperature',
  'volume',
  'area',
  'speed',
  'data',
  'time',
];

export const CATEGORY_DEFINITIONS: Record<UnitCategory, CategoryDefinition> = {
  length: {
    kind: 'ratio',
    id: 'length',
    label: 'Length',
    defaultDecimalPlaces: 4,
    units: [
      { id: 'mm', label: 'Millimeters (mm)' },
      { id: 'cm', label: 'Centimeters (cm)' },
      { id: 'm', label: 'Meters (m)' },
      { id: 'km', label: 'Kilometers (km)' },
      { id: 'in', label: 'Inches (in)' },
      { id: 'ft', label: 'Feet (ft)' },
      { id: 'yd', label: 'Yards (yd)' },
      { id: 'mi', label: 'Miles (mi)' },
    ],
    factors: {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144,
      mi: 1609.344,
    },
  },

  weight: {
    kind: 'ratio',
    id: 'weight',
    label: 'Weight / Mass',
    defaultDecimalPlaces: 4,
    units: [
      { id: 'mg', label: 'Milligrams (mg)' },
      { id: 'g', label: 'Grams (g)' },
      { id: 'kg', label: 'Kilograms (kg)' },
      { id: 't', label: 'Metric tons (t)' },
      { id: 'oz', label: 'Ounces (oz)' },
      { id: 'lb', label: 'Pounds (lb)' },
      { id: 'stone', label: 'Stone (st)' },
    ],
    factors: {
      mg: 0.000001,
      g: 0.001,
      kg: 1,
      t: 1000,
      oz: 0.028349523125,
      lb: 0.45359237,
      stone: 6.35029318,
    },
  },

  temperature: {
    kind: 'temperature',
    id: 'temperature',
    label: 'Temperature',
    defaultDecimalPlaces: 2,
    units: [
      { id: 'celsius', label: 'Celsius (°C)' },
      { id: 'fahrenheit', label: 'Fahrenheit (°F)' },
      { id: 'kelvin', label: 'Kelvin (K)' },
    ],
    note: 'Temperature is offset-based, not a simple ratio — 0°C, 0°F, and 0K are three different temperatures.',
  },

  volume: {
    kind: 'ratio',
    id: 'volume',
    label: 'Volume',
    defaultDecimalPlaces: 3,
    note: 'US and UK (imperial) gallons/pints differ — labeled explicitly below since mixing them up is a common error.',
    units: [
      { id: 'ml', label: 'Milliliters (ml)' },
      { id: 'l', label: 'Liters (l)' },
      { id: 'cup-us', label: 'Cups (US)' },
      { id: 'floz-us', label: 'Fluid ounces (US fl oz)' },
      { id: 'pint-us', label: 'Pints (US pt)' },
      { id: 'quart-us', label: 'Quarts (US qt)' },
      { id: 'gallon-us', label: 'Gallons (US gal)' },
      { id: 'gallon-uk', label: 'Gallons (UK/imperial gal)' },
    ],
    factors: {
      ml: 0.001,
      l: 1,
      'cup-us': 0.2365882365,
      'floz-us': 0.0295735295625,
      'pint-us': 0.473176473,
      'quart-us': 0.946352946,
      'gallon-us': 3.785411784,
      'gallon-uk': 4.54609,
    },
  },

  area: {
    kind: 'ratio',
    id: 'area',
    label: 'Area',
    defaultDecimalPlaces: 4,
    units: [
      { id: 'mm2', label: 'Square millimeters (mm²)' },
      { id: 'cm2', label: 'Square centimeters (cm²)' },
      { id: 'm2', label: 'Square meters (m²)' },
      { id: 'km2', label: 'Square kilometers (km²)' },
      { id: 'sqft', label: 'Square feet (sq ft)' },
      { id: 'sqyd', label: 'Square yards (sq yd)' },
      { id: 'acre', label: 'Acres' },
      { id: 'hectare', label: 'Hectares (ha)' },
    ],
    factors: {
      mm2: 0.000001,
      cm2: 0.0001,
      m2: 1,
      km2: 1000000,
      sqft: 0.09290304,
      sqyd: 0.83612736,
      acre: 4046.8564224,
      hectare: 10000,
    },
  },

  speed: {
    kind: 'ratio',
    id: 'speed',
    label: 'Speed',
    defaultDecimalPlaces: 2,
    units: [
      { id: 'mps', label: 'Meters/second (m/s)' },
      { id: 'kph', label: 'Kilometers/hour (km/h)' },
      { id: 'mph', label: 'Miles/hour (mph)' },
      { id: 'knot', label: 'Knots (kn)' },
    ],
    factors: {
      mps: 1,
      kph: 1000 / 3600,
      mph: 0.44704,
      knot: 1852 / 3600,
    },
  },

  data: {
    kind: 'ratio',
    id: 'data',
    label: 'Data storage',
    defaultDecimalPlaces: 3,
    note: 'Uses decimal (SI, 1000-based) prefixes — 1 KB = 1000 bytes, not 1024. That\'s the more broadly expected default for a general-purpose tool; some operating systems label 1024-based ("binary") values with these same unit names, which is a common source of small discrepancies.',
    units: [
      { id: 'bit', label: 'Bits' },
      { id: 'byte', label: 'Bytes' },
      { id: 'kb', label: 'Kilobytes (KB)' },
      { id: 'mb', label: 'Megabytes (MB)' },
      { id: 'gb', label: 'Gigabytes (GB)' },
      { id: 'tb', label: 'Terabytes (TB)' },
    ],
    factors: {
      bit: 0.125,
      byte: 1,
      kb: 1000,
      mb: 1000000,
      gb: 1000000000,
      tb: 1000000000000,
    },
  },

  time: {
    kind: 'ratio',
    id: 'time',
    label: 'Time',
    defaultDecimalPlaces: 4,
    note: '"Months" and "years" use calendar averages (30.4375 and 365.25 days) since real months/years vary in length.',
    units: [
      { id: 'seconds', label: 'Seconds' },
      { id: 'minutes', label: 'Minutes' },
      { id: 'hours', label: 'Hours' },
      { id: 'days', label: 'Days' },
      { id: 'weeks', label: 'Weeks' },
      { id: 'months', label: 'Months (avg)' },
      { id: 'years', label: 'Years' },
    ],
    factors: {
      seconds: 1,
      minutes: 60,
      hours: 3600,
      days: 86400,
      weeks: 604800,
      months: 2629800, // 30.4375 days
      years: 31557600, // 365.25 days
    },
  },
};

/** Celsius is the pivot: every temperature conversion goes value -> Celsius -> target. */
export function toCelsius(value: number, unit: string): number {
  switch (unit) {
    case 'celsius':
      return value;
    case 'fahrenheit':
      return ((value - 32) * 5) / 9;
    case 'kelvin':
      return value - 273.15;
    default:
      throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

export function fromCelsius(celsius: number, unit: string): number {
  switch (unit) {
    case 'celsius':
      return celsius;
    case 'fahrenheit':
      return (celsius * 9) / 5 + 32;
    case 'kelvin':
      return celsius + 273.15;
    default:
      throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

export interface QuickConversion {
  fromUnit: string;
  toUnit: string;
  fromValue: number;
  label: string;
}

/** A handful of well-known reference conversions per category, for the "Common conversions" chips. */
export const QUICK_CONVERSIONS: Record<UnitCategory, QuickConversion[]> = {
  length: [
    { fromUnit: 'mi', toUnit: 'km', fromValue: 1, label: '1 mile = 1.609 km' },
    { fromUnit: 'in', toUnit: 'cm', fromValue: 1, label: '1 inch = 2.54 cm' },
    { fromUnit: 'ft', toUnit: 'm', fromValue: 1, label: '1 foot = 0.3048 m' },
    { fromUnit: 'm', toUnit: 'ft', fromValue: 1, label: '1 meter = 3.281 ft' },
  ],
  weight: [
    { fromUnit: 'kg', toUnit: 'lb', fromValue: 1, label: '1 kg = 2.205 lb' },
    { fromUnit: 'lb', toUnit: 'kg', fromValue: 1, label: '1 lb = 0.4536 kg' },
    { fromUnit: 'oz', toUnit: 'g', fromValue: 1, label: '1 oz = 28.35 g' },
    { fromUnit: 'stone', toUnit: 'kg', fromValue: 1, label: '1 stone = 6.35 kg' },
  ],
  temperature: [
    { fromUnit: 'celsius', toUnit: 'fahrenheit', fromValue: 0, label: '0°C = 32°F' },
    { fromUnit: 'celsius', toUnit: 'fahrenheit', fromValue: 100, label: '100°C = 212°F' },
    { fromUnit: 'celsius', toUnit: 'kelvin', fromValue: 0, label: '0°C = 273.15K' },
  ],
  volume: [
    { fromUnit: 'gallon-us', toUnit: 'l', fromValue: 1, label: '1 US gal = 3.785 L' },
    { fromUnit: 'l', toUnit: 'gallon-us', fromValue: 1, label: '1 L = 0.264 US gal' },
    { fromUnit: 'cup-us', toUnit: 'ml', fromValue: 1, label: '1 US cup = 236.6 ml' },
    { fromUnit: 'gallon-uk', toUnit: 'gallon-us', fromValue: 1, label: '1 UK gal = 1.201 US gal' },
  ],
  area: [
    { fromUnit: 'acre', toUnit: 'hectare', fromValue: 1, label: '1 acre = 0.4047 ha' },
    { fromUnit: 'sqft', toUnit: 'm2', fromValue: 1, label: '1 sq ft = 0.0929 m²' },
    { fromUnit: 'hectare', toUnit: 'acre', fromValue: 1, label: '1 hectare = 2.471 acres' },
  ],
  speed: [
    { fromUnit: 'mph', toUnit: 'kph', fromValue: 1, label: '1 mph = 1.609 km/h' },
    { fromUnit: 'knot', toUnit: 'kph', fromValue: 1, label: '1 knot = 1.852 km/h' },
    { fromUnit: 'kph', toUnit: 'mph', fromValue: 100, label: '100 km/h = 62.14 mph' },
  ],
  data: [
    { fromUnit: 'gb', toUnit: 'mb', fromValue: 1, label: '1 GB = 1000 MB' },
    { fromUnit: 'mb', toUnit: 'kb', fromValue: 1, label: '1 MB = 1000 KB' },
    { fromUnit: 'byte', toUnit: 'bit', fromValue: 1, label: '1 byte = 8 bits' },
  ],
  time: [
    { fromUnit: 'days', toUnit: 'hours', fromValue: 1, label: '1 day = 24 hours' },
    { fromUnit: 'years', toUnit: 'days', fromValue: 1, label: '1 year ≈ 365.25 days' },
    { fromUnit: 'weeks', toUnit: 'days', fromValue: 1, label: '1 week = 7 days' },
  ],
};
