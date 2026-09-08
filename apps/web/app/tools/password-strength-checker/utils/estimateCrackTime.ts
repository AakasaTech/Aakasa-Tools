/**
 * A simplified, clearly-approximate time-to-crack estimate — not a
 * precise security calculation. Real attacks vary enormously by method
 * (a rate-limited online login form vs. offline hash-cracking with GPU
 * clusters), attacker hardware/budget, and — critically — whether the
 * password appears in a leaked-password dictionary, which would make
 * even a "high entropy" password crack instantly via a wordlist lookup
 * rather than brute force at all. Treat this as illustrative, not precise.
 */

/**
 * Default assumption: 10 billion guesses/second. A commonly-cited rough
 * figure for offline brute-forcing a fast, unsalted hash on consumer GPU
 * hardware — a deliberately middle-of-the-road illustrative number, not a
 * worst case (dedicated cracking hardware goes faster) or a best case (a
 * slow, properly-salted hash like bcrypt would be drastically slower).
 */
export const DEFAULT_GUESSES_PER_SECOND = 10_000_000_000;

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH = DAY * 30.44;
const YEAR = DAY * 365.25;

function pluralize(value: number, unit: string): string {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString('en-US')} ${unit}${rounded === 1 ? '' : 's'}`;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 1) return 'less than a second';
  if (totalSeconds < MINUTE) return pluralize(totalSeconds, 'second');
  if (totalSeconds < HOUR) return pluralize(totalSeconds / MINUTE, 'minute');
  if (totalSeconds < DAY) return pluralize(totalSeconds / HOUR, 'hour');
  if (totalSeconds < MONTH) return pluralize(totalSeconds / DAY, 'day');
  if (totalSeconds < YEAR) return pluralize(totalSeconds / MONTH, 'month');

  const years = totalSeconds / YEAR;
  // Beyond this point the exact figure stops being meaningful — say so
  // plainly instead of printing an unreadable string of digits.
  if (years > 1e15) {
    return 'longer than the age of the universe (effectively uncrackable)';
  }
  return `${years.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })} years`;
}

/**
 * Estimates brute-force crack time from an entropy figure (in bits) and an
 * assumed guess rate. Uses the conventional "average case" framing — the
 * correct guess is found, on average, halfway through the full keyspace.
 */
export function estimateCrackTime(entropyBits: number, guessesPerSecond: number = DEFAULT_GUESSES_PER_SECOND): string {
  if (entropyBits <= 0 || guessesPerSecond <= 0) {
    return 'instantly';
  }

  const totalCombinations = 2 ** entropyBits;
  const averageGuessesNeeded = totalCombinations / 2;
  const seconds = averageGuessesNeeded / guessesPerSecond;

  return formatDuration(seconds);
}
