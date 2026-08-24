import { CronExpressionParser } from 'cron-parser';
import { DAY_OF_WEEK_NAMES, MONTH_NAMES } from './cronFieldHelpers';

interface NumericField {
  values: number[];
  wildcard: boolean;
}

function toNumberArray(values: readonly (number | string)[]): number[] | null {
  const nums: number[] = [];
  for (const value of values) {
    if (typeof value !== 'number') {
      return null;
    }
    nums.push(value);
  }
  return nums.sort((a, b) => a - b);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function formatNumberList(values: number[]): string {
  if (values.length > 8) {
    return `${values.slice(0, 8).join(', ')}, and ${values.length - 8} more`;
  }
  return joinWithAnd(values.map(String));
}

/**
 * Recognizes a "start at the field minimum, step by N" pattern (what a
 * wildcard step like star-slash-N, or an equivalent explicit list,
 * produces) so it can be phrased as "every N minutes" instead of a raw
 * list. Any other spacing/starting point falls back to a literal list
 * rather than a possibly-misleading guess.
 */
function detectEveryNStep(values: number[], fieldMin: number): number | null {
  if (values.length < 2 || values[0] !== fieldMin) {
    return null;
  }
  const step = values[1]! - values[0]!;
  if (step <= 1) {
    return null;
  }
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! - values[i - 1]! !== step) {
      return null;
    }
  }
  return step;
}

function describeTime(minute: NumericField, hour: NumericField): string {
  if (minute.wildcard && hour.wildcard) {
    return 'Every minute';
  }

  if (minute.values.length === 1 && hour.values.length === 1 && !minute.wildcard && !hour.wildcard) {
    return `At ${pad2(hour.values[0]!)}:${pad2(minute.values[0]!)}`;
  }

  if (!minute.wildcard && hour.wildcard) {
    const step = detectEveryNStep(minute.values, 0);
    if (step) {
      return `Every ${step} minutes`;
    }
    const minuteDesc = minute.values.length === 1 ? `minute ${minute.values[0]}` : `minutes ${formatNumberList(minute.values)}`;
    return `At ${minuteDesc} past every hour`;
  }

  const minuteDesc = minute.wildcard ? 'every minute' : minute.values.length === 1 ? `minute ${minute.values[0]}` : `minutes ${formatNumberList(minute.values)}`;
  const hourStep = !hour.wildcard ? detectEveryNStep(hour.values, 0) : null;
  if (hourStep) {
    return `At ${minuteDesc} every ${hourStep} hours`;
  }
  const hourDesc = hour.wildcard ? 'every hour' : hour.values.length === 1 ? `hour ${hour.values[0]}` : `hours ${formatNumberList(hour.values)}`;
  return `At ${minuteDesc} past ${hourDesc}`;
}

function describeDayOfWeek(values: number[]): string {
  const names: string[] = [];
  for (const v of values) {
    const name = DAY_OF_WEEK_NAMES[v];
    if (name !== undefined) names.push(name);
  }
  if (names.length === 0) {
    return '';
  }
  return `every ${joinWithAnd(names)}`;
}

function describeMonths(values: number[]): string {
  const names: string[] = [];
  for (const v of values) {
    const name = MONTH_NAMES[v - 1];
    if (name !== undefined) names.push(name);
  }
  return joinWithAnd(names);
}

/**
 * Produces a human-readable description of a standard 5-field cron
 * expression. Falls back to a literal, still-accurate field summary for
 * combinations too specific to phrase naturally, rather than guessing at
 * wording that could misrepresent the schedule.
 */
export function describeCronExpression(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) {
    return '';
  }

  let fields;
  try {
    fields = CronExpressionParser.parse(trimmed).fields;
  } catch (err) {
    return err instanceof Error ? `Invalid expression: ${err.message}` : 'Invalid cron expression.';
  }

  const minuteValues = toNumberArray(fields.minute.values);
  const hourValues = toNumberArray(fields.hour.values);
  const domValues = toNumberArray(fields.dayOfMonth.values);
  const monthValues = toNumberArray(fields.month.values);
  const dowValues = toNumberArray(fields.dayOfWeek.values);

  if (!minuteValues || !hourValues || !domValues || !monthValues || !dowValues) {
    return `Runs on the schedule "${trimmed}" — this uses special day syntax (like L or W) the plain-English description doesn't cover.`;
  }

  const minute: NumericField = { values: minuteValues, wildcard: fields.minute.isWildcard };
  const hour: NumericField = { values: hourValues, wildcard: fields.hour.isWildcard };
  const dayOfMonthRestricted = !fields.dayOfMonth.isWildcard;
  const dayOfWeekRestricted = !fields.dayOfWeek.isWildcard;

  const parts: string[] = [describeTime(minute, hour)];

  if (dayOfMonthRestricted && dayOfWeekRestricted) {
    parts.push(`on day ${formatNumberList(domValues)} of the month, or ${describeDayOfWeek(dowValues)}`);
  } else if (dayOfMonthRestricted) {
    parts.push(`on day ${formatNumberList(domValues)} of the month`);
  } else if (dayOfWeekRestricted) {
    parts.push(describeDayOfWeek(dowValues));
  }

  if (!fields.month.isWildcard) {
    parts.push(`in ${describeMonths(monthValues)}`);
  }

  return `${parts.filter(Boolean).join(', ')}.`;
}
