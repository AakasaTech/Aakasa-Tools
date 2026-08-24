export interface DecodeResult {
  result: string;
  error?: string;
}

export interface QueryPair {
  key: string;
  value: string;
}

/**
 * Scans for the first "%" not followed by two valid hex digits, so decode
 * errors can point at a position instead of just saying "malformed" — the
 * native URIError's message doesn't reliably include one across engines.
 */
function findMalformedPercentIndex(text: string): number | null {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '%') {
      const hex = text.slice(i + 1, i + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        return i;
      }
    }
  }
  return null;
}

function describeDecodeError(text: string): string {
  const index = findMalformedPercentIndex(text);
  if (index !== null) {
    return `Invalid percent-encoding near position ${index} — "%" must be followed by two hex digits.`;
  }
  // A malformed % sequence isn't the only way decodeURIComponent/decodeURI
  // can throw — an incomplete multi-byte UTF-8 sequence (e.g. "%E0%A4")
  // is valid hex but doesn't decode to a real character.
  return 'This text contains invalid percent-encoding and could not be decoded.';
}

export function encodeComponent(text: string): string {
  return encodeURIComponent(text);
}

export function decodeComponent(text: string): DecodeResult {
  if (!text) {
    return { result: '' };
  }
  try {
    return { result: decodeURIComponent(text) };
  } catch (err) {
    if (err instanceof URIError) {
      return { result: '', error: describeDecodeError(text) };
    }
    throw err;
  }
}

export function encodeFullUrl(text: string): string {
  return encodeURI(text);
}

export function decodeFullUrl(text: string): DecodeResult {
  if (!text) {
    return { result: '' };
  }
  try {
    return { result: decodeURI(text) };
  } catch (err) {
    if (err instanceof URIError) {
      return { result: '', error: describeDecodeError(text) };
    }
    throw err;
  }
}

/** Pulls the query-string portion out of a bare query, a "?query" fragment, or a full URL. */
function extractQueryString(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('?')) {
    return trimmed.slice(1);
  }
  const questionIndex = trimmed.indexOf('?');
  const afterQuestion = questionIndex !== -1 ? trimmed.slice(questionIndex + 1) : trimmed;
  const hashIndex = afterQuestion.indexOf('#');
  return hashIndex !== -1 ? afterQuestion.slice(0, hashIndex) : afterQuestion;
}

/**
 * Parses via URLSearchParams rather than hand-rolled splitting, so
 * repeated keys, "+"-as-space, and percent-decoding are all handled
 * correctly. `entries()` yields one pair per occurrence — it does not
 * collapse repeated keys the way a plain object assignment would.
 */
export function parseQueryString(input: string): QueryPair[] {
  const queryString = extractQueryString(input);
  if (!queryString) {
    return [];
  }
  const params = new URLSearchParams(queryString);
  return Array.from(params.entries()).map(([key, value]) => ({ key, value }));
}

export function buildQueryString(pairs: QueryPair[]): string {
  const params = new URLSearchParams();
  for (const { key, value } of pairs) {
    if (!key) {
      continue;
    }
    params.append(key, value);
  }
  return params.toString();
}
