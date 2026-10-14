/**
 * Pure number-base conversion — no DOM, no React. Uses BigInt throughout,
 * never `Number`, so values beyond Number.MAX_SAFE_INTEGER (2^53 − 1) —
 * entirely realistic here, e.g. a 64-bit hex value — convert exactly
 * rather than silently losing precision partway through.
 *
 * BigInt's own `.toString(radix)` already supports radix 2–36 natively,
 * so formatting reuses that directly. Parsing an arbitrary base's digit
 * string has no built-in equivalent, though — the `BigInt()` constructor
 * only understands base-10 and the standard `0b`/`0o`/`0x`-prefixed
 * literals, not an arbitrary radix — so parsing is done here manually via
 * the standard multiply-and-accumulate approach.
 */

const DIGIT_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

function digitValue(ch: string): number | null {
  const index = DIGIT_CHARS.indexOf(ch.toLowerCase());
  return index === -1 ? null : index;
}

export interface ConvertResult {
  result: string;
  error?: string;
}

/** Parses an optionally-signed digit string in `fromBase` (2–36). Returns
 * null if the string is empty or contains any character invalid for that
 * base (e.g. "2" when fromBase is 2), rather than truncating or
 * misparsing partway through. */
export function parseInBase(value: string, fromBase: number): bigint | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  let negative = false;
  let digits = trimmed;
  if (digits.startsWith('-')) {
    negative = true;
    digits = digits.slice(1);
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }
  if (digits === '') return null;

  const bigBase = BigInt(fromBase);
  let result = 0n;
  for (const ch of digits) {
    const d = digitValue(ch);
    if (d === null || d >= fromBase) return null;
    result = result * bigBase + BigInt(d);
  }
  return negative ? -result : result;
}

/** Formats a (possibly negative) BigInt in `toBase` (2–36), via BigInt's
 * own native `.toString(radix)` on the magnitude. */
export function formatInBase(value: bigint, toBase: number): string {
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const digits = magnitude.toString(toBase);
  return negative ? `-${digits}` : digits;
}

function isValidBase(base: number): boolean {
  return Number.isInteger(base) && base >= 2 && base <= 36;
}

export function convertBase(value: string, fromBase: number, toBase: number): ConvertResult {
  if (!isValidBase(fromBase) || !isValidBase(toBase)) {
    return { result: '', error: 'Base must be a whole number between 2 and 36.' };
  }
  const parsed = parseInBase(value, fromBase);
  if (parsed === null) {
    return { result: '', error: `"${value}" isn't a valid base-${fromBase} number.` };
  }
  return { result: formatInBase(parsed, toBase) };
}

/** The representable signed range for a two's-complement value at `bitWidth` bits. */
export function signedRange(bitWidth: number): { min: bigint; max: bigint } {
  const half = 1n << BigInt(bitWidth - 1);
  return { min: -half, max: half - 1n };
}

/**
 * The two's-complement binary representation of `value` at exactly
 * `bitWidth` bits, as a zero-padded string of 0s and 1s. JS BigInt's own
 * bitwise `&` already operates as if on an infinite-precision two's-
 * complement representation (e.g. `-1n & 0xFFn === 0xFFn`), so masking to
 * `bitWidth` bits reproduces standard two's-complement wraparound exactly
 * — a value outside the bit width's signed range wraps the same way real
 * fixed-width arithmetic overflow does, rather than throwing; callers
 * that want to flag "doesn't fit" should check `signedRange` themselves.
 */
export function toTwosComplement(value: bigint, bitWidth: number): string {
  const mask = (1n << BigInt(bitWidth)) - 1n;
  const wrapped = value & mask;
  return wrapped.toString(2).padStart(bitWidth, '0');
}

/** Inverse of toTwosComplement: interprets a `bitWidth`-bit binary string
 * of 0s/1s as a signed two's-complement value. */
export function fromTwosComplement(bits: string, bitWidth: number): bigint {
  const unsigned = BigInt(`0b${bits}`);
  const signBit = 1n << BigInt(bitWidth - 1);
  return (unsigned & signBit) !== 0n ? unsigned - (1n << BigInt(bitWidth)) : unsigned;
}
