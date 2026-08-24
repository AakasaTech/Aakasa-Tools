export type TimestampUnit = 'seconds' | 'milliseconds';
export type DateFormat = 'iso' | 'rfc2822' | 'locale';

/**
 * A seconds timestamp for any realistic date (roughly 2001-2286) is 10
 * digits; a milliseconds timestamp for the same range is 13. 1e12 sits
 * cleanly between "10-12 digit seconds value" and "13-digit milliseconds
 * value" — anything at or above it is treated as milliseconds, anything
 * below as seconds. Values very close to the epoch (under ~1000, where
 * "seconds" and "milliseconds" interpretations both land within a second
 * or two of 1970-01-01) are inherently ambiguous regardless of heuristic;
 * that's what the manual override in the UI is for.
 */
const MILLISECONDS_THRESHOLD = 1e12;

export function detectTimestampUnit(value: number): TimestampUnit {
  return Math.abs(value) >= MILLISECONDS_THRESHOLD ? 'milliseconds' : 'seconds';
}

export function timestampToDate(value: number, unit: TimestampUnit): Date {
  return new Date(unit === 'seconds' ? value * 1000 : value);
}

export function dateToTimestamp(date: Date): { seconds: number; milliseconds: number } {
  const ms = date.getTime();
  return { seconds: Math.floor(ms / 1000), milliseconds: ms };
}

/** "GMT+05:30" / "GMT-04:00" -> "+05:30" / "-04:00" (or "+00:00" if unresolvable). */
export function getOffsetString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' }).formatToParts(date);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const offset = raw.replace('GMT', '');
  return offset || '+00:00';
}

function normalizeHour(hour: string): string {
  // hour12:false can yield "24" for midnight on some engines/locales.
  return hour === '24' ? '00' : hour;
}

function getIsoParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { year: get('year'), month: get('month'), day: get('day'), hour: normalizeHour(get('hour')), minute: get('minute'), second: get('second') };
}

function getRfc2822Parts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
    year: get('year'),
    hour: normalizeHour(get('hour')),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Formats `date` as it reads in `timezone` (an IANA name, or "UTC"), in
 * one of three standard forms. Wraps Intl.DateTimeFormat throughout —
 * including for the UTC-offset suffix, computed per-instant so it's
 * correct across a DST transition, not a fixed number baked in for the
 * zone.
 */
export function formatInTimezone(date: Date, timezone: string, format: DateFormat): string {
  if (format === 'iso') {
    if (timezone === 'UTC') {
      return date.toISOString();
    }
    const p = getIsoParts(date, timezone);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${getOffsetString(date, timezone)}`;
  }

  if (format === 'rfc2822') {
    const p = getRfc2822Parts(date, timezone);
    const offset = getOffsetString(date, timezone).replace(':', '');
    return `${p.weekday}, ${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute}:${p.second} ${offset}`;
  }

  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'long' }).format(date);
}

export interface DateComponents {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function offsetMinutesAt(instantMs: number, timezone: string): number {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(getOffsetString(new Date(instantMs), timezone));
  if (!match) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/**
 * Finds the absolute instant whose wall-clock reading in `timezone` matches
 * `components` — the missing piece the native Date API doesn't provide
 * directly (Date.UTC only builds from UTC components; a bare
 * "YYYY-MM-DDTHH:mm" string is parsed as browser-local, not an arbitrary
 * IANA zone). Works by treating the components as a first-guess UTC
 * instant, reading that zone's offset at the guess, applying it, then
 * re-checking the offset at the *result* — a second, DST-transition-aware
 * pass, since the correct offset can differ from the guess when the entered
 * wall-clock time falls near a spring-forward/fall-back boundary.
 */
export function zonedTimeToUtc(components: DateComponents, timezone: string): Date {
  const guessMs = Date.UTC(components.year, components.month - 1, components.day, components.hour, components.minute, components.second);
  const firstOffset = offsetMinutesAt(guessMs, timezone);
  let candidateMs = guessMs - firstOffset * 60_000;

  const refinedOffset = offsetMinutesAt(candidateMs, timezone);
  if (refinedOffset !== firstOffset) {
    candidateMs = guessMs - refinedOffset * 60_000;
  }

  return new Date(candidateMs);
}

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

/** "3 days ago" / "in 2 hours" — cascades through second→year divisions rather than hand-rolled thresholds, then hands the final number/unit to Intl.RelativeTimeFormat for pluralization and phrasing. */
export function getRelativeTimeDescription(date: Date, now: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let duration = (date.getTime() - now.getTime()) / 1000;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return rtf.format(Math.round(duration), 'years');
}
