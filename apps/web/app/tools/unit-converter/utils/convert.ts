import { CATEGORY_DEFINITIONS, fromCelsius, toCelsius, type UnitCategory } from './unitDefinitions';

/**
 * Converts `value` from `fromUnit` to `toUnit` within `category`. Dispatches
 * on the category definition's `kind`: ratio categories multiply through a
 * shared base unit; temperature (offset-based, not a ratio) pivots through
 * Celsius via explicit per-unit functions instead — see unitDefinitions.ts
 * for why these can't share one code path.
 */
export function convert(value: number, fromUnit: string, toUnit: string, category: UnitCategory): number {
  const definition = CATEGORY_DEFINITIONS[category];

  if (definition.kind === 'temperature') {
    return fromCelsius(toCelsius(value, fromUnit), toUnit);
  }

  const fromFactor = definition.factors[fromUnit];
  const toFactor = definition.factors[toUnit];
  if (fromFactor === undefined) {
    throw new Error(`Unknown unit "${fromUnit}" for category "${category}"`);
  }
  if (toFactor === undefined) {
    throw new Error(`Unknown unit "${toUnit}" for category "${category}"`);
  }

  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}

/** Rounds to `decimalPlaces` without the floating-point noise of `.toFixed` on its own (e.g. avoids "1.0000000000000002"). */
export function roundToPrecision(value: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatConverted(value: number, decimalPlaces: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  return roundToPrecision(value, decimalPlaces).toFixed(decimalPlaces);
}
