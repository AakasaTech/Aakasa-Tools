/**
 * Converts between the visual builder's simplified per-field selections and
 * raw standard-cron field syntax. Deliberately covers only the common
 * subset (every / specific values / range / step) — a raw expression using
 * a combination too complex for these controls (e.g. "5-30/5") is expected
 * to fail `parseFieldExpression` and simply not reflect back into the
 * visual builder, rather than being forced into a wrong or partial guess.
 */

export type FieldKey = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

export type FieldMode = 'every' | 'specific' | 'range' | 'step';

export interface FieldRangeConfig {
  min: number;
  max: number;
}

export const FIELD_RANGES: Record<FieldKey, FieldRangeConfig> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
};

/** Index 0 = cron value 1 (Jan). */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Index 0 = cron value 0 (Sun) — standard cron, not ISO. */
export const DAY_OF_WEEK_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MONTH_ALIASES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DAY_OF_WEEK_ALIASES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

export interface FieldSelection {
  mode: FieldMode;
  /** Used by 'specific' mode. */
  values: number[];
  /** Used by 'range' and 'step' modes. */
  from: number;
  /** Used by 'range' mode. */
  to: number;
  /** Used by 'step' mode. */
  step: number;
}

export function defaultFieldSelection(fieldKey: FieldKey): FieldSelection {
  const range = FIELD_RANGES[fieldKey];
  return { mode: 'every', values: [range.min], from: range.min, to: range.max, step: 1 };
}

/** Builds the raw cron field syntax for one field from its visual-builder selection. */
export function buildFieldExpression(selection: FieldSelection, fieldKey: FieldKey): string {
  const range = FIELD_RANGES[fieldKey];
  switch (selection.mode) {
    case 'every':
      return '*';
    case 'specific': {
      const unique = Array.from(new Set(selection.values)).sort((a, b) => a - b);
      return unique.length > 0 ? unique.join(',') : '*';
    }
    case 'range':
      return `${selection.from}-${selection.to}`;
    case 'step':
      return selection.from === range.min ? `*/${selection.step}` : `${selection.from}/${selection.step}`;
    default:
      return '*';
  }
}

function resolveAliases(fieldStr: string, fieldKey: FieldKey): string {
  const aliasMap = fieldKey === 'dayOfWeek' ? DAY_OF_WEEK_ALIASES : fieldKey === 'month' ? MONTH_ALIASES : null;
  if (!aliasMap) {
    return fieldStr;
  }
  return fieldStr.replace(/[A-Za-z]{3}/g, (token) => {
    const value = aliasMap[token.toUpperCase()];
    return value !== undefined ? String(value) : token;
  });
}

/**
 * Best-effort reverse of `buildFieldExpression`: maps a raw cron field
 * string back to a visual-builder selection. Returns null for anything the
 * simple builder can't represent (a step-within-a-range, an unrecognized
 * character, an out-of-range value) — the caller should show the raw
 * expression as-is rather than treat null as an error.
 */
export function parseFieldExpression(fieldStr: string, fieldKey: FieldKey): FieldSelection | null {
  const range = FIELD_RANGES[fieldKey];
  const trimmed = fieldStr.trim();
  const resolved = resolveAliases(trimmed, fieldKey);

  if (!/^[0-9,\-/*]+$/.test(resolved)) {
    return null;
  }

  if (resolved === '*') {
    return { mode: 'every', values: [range.min], from: range.min, to: range.max, step: 1 };
  }

  const stepFromWildcard = /^\*\/(\d+)$/.exec(resolved);
  if (stepFromWildcard) {
    const step = Number(stepFromWildcard[1]);
    if (step < 1) return null;
    return { mode: 'step', values: [range.min], from: range.min, to: range.max, step };
  }

  const stepFromValue = /^(\d+)\/(\d+)$/.exec(resolved);
  if (stepFromValue) {
    const from = Number(stepFromValue[1]);
    const step = Number(stepFromValue[2]);
    if (from < range.min || from > range.max || step < 1) return null;
    return { mode: 'step', values: [from], from, to: range.max, step };
  }

  const plainRange = /^(\d+)-(\d+)$/.exec(resolved);
  if (plainRange) {
    const from = Number(plainRange[1]);
    const to = Number(plainRange[2]);
    if (from < range.min || to > range.max || from > to) return null;
    return { mode: 'range', values: [from], from, to, step: 1 };
  }

  const commaList = /^\d+(?:,\d+)*$/.exec(resolved);
  if (commaList) {
    const values = resolved.split(',').map(Number);
    if (values.some((v) => v < range.min || v > range.max)) return null;
    return { mode: 'specific', values, from: range.min, to: range.max, step: 1 };
  }

  // Anything else (e.g. "5-30/5", a comma list mixed with a range) is valid
  // cron but too complex for these four simple modes to represent.
  return null;
}
