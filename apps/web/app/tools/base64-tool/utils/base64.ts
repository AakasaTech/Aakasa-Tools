/**
 * Pure Base64 encode/decode logic. No React, no DOM beyond standard Web APIs
 * (btoa/atob, TextEncoder/TextDecoder, File) — safe to call from the main
 * thread or a Web Worker, and reusable by a future tool (a JWT decoder, for
 * instance, is Base64Url under the hood and could reuse the byte-handling
 * here).
 *
 * Plain btoa()/atob() only handle Latin1 and silently mangle anything
 * outside it (emoji, accented characters, CJK, ...). Every function below
 * goes through UTF-8 bytes explicitly so non-ASCII text round-trips
 * correctly instead of just looking correct on ASCII test input.
 */

export class Base64DecodeError extends Error {
  constructor(message = 'Invalid Base64 string') {
    super(message);
    this.name = 'Base64DecodeError';
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked to avoid both slow per-byte string concatenation and the
  // argument-count limits of spreading a huge array into fromCharCode at once.
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Base64DecodeError();
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** UTF-8-safe: encodes `input` to bytes first, then to Base64. */
export function encodeText(input: string): string {
  return bytesToBase64(new TextEncoder().encode(input));
}

/** UTF-8-safe: decodes Base64 to bytes, then interprets them as UTF-8. Throws `Base64DecodeError` on invalid input. */
export function decodeText(input: string): string {
  const bytes = base64ToBytes(input);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Base64DecodeError('Decoded bytes are not valid UTF-8 text');
  }
}

/** Raw Base64 of a file's contents — no data URI prefix. */
export async function encodeFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

/** Full `data:<mime>;base64,<...>` string for a file. */
export async function fileToDataUri(file: File): Promise<string> {
  const base64 = await encodeFile(file);
  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${base64}`;
}
