export interface CalendarDifference {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

const MS_PER_DAY = 86_400_000;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Adds `monthsToAdd` calendar months to `date`, clamping the day-of-month
 * to the target month's last day when it doesn't exist there (Jan 31 + 1
 * month → Feb 28/29, not an overflow into March) — the same convention
 * humans use when they say "one month after January 31st". */
function addMonthsClamped(date: Date, monthsToAdd: number): Date {
  const targetMonthIndex = date.getMonth() + monthsToAdd;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(date.getDate(), daysInMonth(targetYear, normalizedMonth));
  return new Date(targetYear, normalizedMonth, clampedDay);
}

/**
 * Calendar-aware difference between two dates — NOT `totalDays / 365.25`.
 * Finds the largest whole number of calendar months that fit between the
 * two dates (via `addMonthsClamped`, walking forward one month at a time),
 * then the remaining days as a plain millisecond difference. This
 * sidesteps a subtle bug in the more common "subtract components, borrow
 * a month's day-count when negative" approach: for a range like
 * Jan 31 → Mar 1, the immediately-preceding month (February) has fewer
 * days than the borrow needs to cover, so a single borrow leaves a
 * still-negative remainder. Walking forward avoids that failure mode
 * entirely, at the cost of a small loop (at most ~1200 iterations for a
 * 100-year range) rather than a closed-form subtraction.
 */
export function calculateCalendarDifference(startDate: Date, endDate: Date): CalendarDifference {
  let start = startDate;
  let end = endDate;
  if (start.getTime() > end.getTime()) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  let totalMonths = 0;
  while (addMonthsClamped(start, totalMonths + 1).getTime() <= end.getTime()) {
    totalMonths += 1;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const dateAfterMonths = addMonthsClamped(start, totalMonths);
  const days = Math.round((end.getTime() - dateAfterMonths.getTime()) / MS_PER_DAY);

  const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  const totalWeeks = Math.floor(totalDays / 7);

  return { years, months, days, totalDays, totalWeeks, totalMonths };
}

/**
 * Counts weekdays (Monday–Friday) in the inclusive range [start, end].
 * Deliberately excludes only Saturdays/Sundays — no public-holiday
 * calendar is applied, since holiday dates vary by country/region and
 * are explicitly out of scope for this figure.
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let start = startDate;
  let end = endDate;
  if (start.getTime() > end.getTime()) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const totalDaysInclusive = Math.round((endOnly.getTime() - startOnly.getTime()) / MS_PER_DAY) + 1;

  const fullWeeks = Math.floor(totalDaysInclusive / 7);
  let businessDays = fullWeeks * 5;

  const remainderDays = totalDaysInclusive % 7;
  const startWeekday = startOnly.getDay(); // 0 = Sunday .. 6 = Saturday
  for (let i = 0; i < remainderDays; i += 1) {
    const weekday = (startWeekday + i) % 7;
    if (weekday !== 0 && weekday !== 6) businessDays += 1;
  }

  return businessDays;
}

/** Days from `asOfDate` until the next anniversary of `birthDate`'s
 * month/day. A Feb 29 birthday's anniversary is clamped to Feb 28 in a
 * non-leap year, consistent with `calculateCalendarDifference`'s
 * leap-day convention. */
export function daysUntilNextAnniversary(birthDate: Date, asOfDate: Date): number {
  const asOf = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate());

  function anniversaryIn(year: number): Date {
    const day = Math.min(birthDate.getDate(), daysInMonth(year, birthDate.getMonth()));
    return new Date(year, birthDate.getMonth(), day);
  }

  let anniversary = anniversaryIn(asOf.getFullYear());
  if (anniversary.getTime() < asOf.getTime()) {
    anniversary = anniversaryIn(asOf.getFullYear() + 1);
  }

  return Math.round((anniversary.getTime() - asOf.getTime()) / MS_PER_DAY);
}

/** Parses a `YYYY-MM-DD` value (from `<input type="date">`) into a local-
 * midnight Date, deliberately avoiding `new Date(dateString)` — that form
 * parses date-only ISO strings as UTC midnight, which can land on the
 * *previous* local calendar day in negative-UTC-offset timezones,
 * silently shifting the date the user actually picked. */
export function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}
