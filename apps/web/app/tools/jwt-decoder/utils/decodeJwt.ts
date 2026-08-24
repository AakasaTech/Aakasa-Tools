import { Base64DecodeError, decodeText } from '@/app/tools/base64-tool/utils/base64';

export interface DecodeJwtResult {
  header: unknown;
  payload: unknown;
  signature: string;
  error?: string;
}

export type ExpirationStatus = 'expired' | 'valid' | 'no-expiry';

export interface ExpirationInfo {
  status: ExpirationStatus;
  label: string;
}

/**
 * JWT segments are Base64URL, not standard Base64: "-"/"_" instead of
 * "+"/"/", and padding is omitted entirely. Handing a raw segment to
 * `decodeText` (which wraps `atob`) as-is either throws on the URL-safe
 * characters `atob` doesn't recognize, or on the missing "=" padding
 * `atob` expects — so every segment is normalized back to standard Base64
 * before it reaches the shared decode logic.
 */
function base64UrlToBase64(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(paddingLength);
}

function decodeSegmentToJson(segment: string, partName: string): { value?: unknown; error?: string } {
  let json: string;
  try {
    json = decodeText(base64UrlToBase64(segment));
  } catch (err) {
    if (err instanceof Base64DecodeError) {
      return { error: `${partName} segment isn't valid Base64URL.` };
    }
    throw err;
  }
  try {
    return { value: JSON.parse(json) as unknown };
  } catch {
    return { error: `${partName} segment didn't decode to valid JSON.` };
  }
}

/**
 * Splits a JWT into its three dot-separated segments, Base64URL-decodes the
 * header and payload (UTF-8 safe, via the same decode path as the Base64
 * tool), and parses each as JSON. The signature segment is returned as-is —
 * it's cryptographic bytes, not JSON, and this tool never attempts to
 * verify it (that would require the signing secret).
 */
export function decodeJwt(token: string): DecodeJwtResult {
  const trimmed = token.trim();
  if (!trimmed) {
    return { header: null, payload: null, signature: '', error: 'Paste a JWT to decode it.' };
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: '',
      error: `This doesn't look like a JWT — expected 3 parts separated by dots, found ${parts.length}.`,
    };
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts as [string, string, string];

  const decodedHeader = decodeSegmentToJson(headerSegment, 'Header');
  if (decodedHeader.error) {
    return { header: null, payload: null, signature: signatureSegment, error: decodedHeader.error };
  }

  const decodedPayload = decodeSegmentToJson(payloadSegment, 'Payload');
  if (decodedPayload.error) {
    return { header: decodedHeader.value, payload: null, signature: signatureSegment, error: decodedPayload.error };
  }

  return { header: decodedHeader.value, payload: decodedPayload.value, signature: signatureSegment };
}

const MAX_PLAUSIBLE_EPOCH_SECONDS = 253_402_300_799; // 9999-12-31T23:59:59Z

/** Converts a JWT NumericDate claim (Unix seconds) to a human-readable UTC string, or null if the value isn't a plausible timestamp. */
export function formatClaimTimestamp(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_PLAUSIBLE_EPOCH_SECONDS) {
    return null;
  }
  const date = new Date(value * 1000);
  const formatted = date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${formatted} UTC`;
}

function formatRelativeDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 365) {
    return `${days}d`;
  }
  const years = Math.floor(days / 365);
  return `${years}y`;
}

/** Reads the plaintext `exp` claim and compares it to the current time — a date comparison, not a signature check. */
export function getExpirationStatus(exp: number | undefined): ExpirationInfo {
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return { status: 'no-expiry', label: 'No expiration claim' };
  }
  const diffMs = exp * 1000 - Date.now();
  if (diffMs <= 0) {
    return { status: 'expired', label: `Expired ${formatRelativeDuration(-diffMs)} ago` };
  }
  return { status: 'valid', label: `Expires in ${formatRelativeDuration(diffMs)}` };
}
