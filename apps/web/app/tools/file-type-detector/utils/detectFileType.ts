import { fileTypeFromBlob } from 'file-type';

export interface FileTypeResult {
  detectedMime: string | null;
  detectedExtension: string | null;
  claimedExtension: string;
  /** null when detection returned no result — genuinely unknown, not a
   * mismatch. */
  matches: boolean | null;
  /** First bytes of the file, as hex, for the raw-magic-bytes display. */
  rawBytesHex: string;
}

const RAW_BYTES_SAMPLE_SIZE = 32;

/** Extensions that are effectively the same format under a different
 * common spelling — comparing them literally would flag a harmless
 * naming variant (e.g. "photo.jpeg" detected as "jpg") as a false
 * mismatch. */
const EXTENSION_ALIASES: Record<string, string> = {
  jpeg: 'jpg',
  tiff: 'tif',
  htm: 'html',
};

function canonicalizeExtension(extension: string): string {
  const lower = extension.toLowerCase();
  return EXTENSION_ALIASES[lower] ?? lower;
}

function getClaimedExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) return '';
  return fileName.slice(lastDot + 1).toLowerCase();
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(' ');
}

export async function detectType(file: File): Promise<FileTypeResult> {
  const claimedExtension = getClaimedExtension(file.name);

  const headerBuffer = await file.slice(0, RAW_BYTES_SAMPLE_SIZE).arrayBuffer();
  const rawBytesHex = bytesToHex(new Uint8Array(headerBuffer));

  const result = await fileTypeFromBlob(file);

  if (!result) {
    return {
      detectedMime: null,
      detectedExtension: null,
      claimedExtension,
      matches: null,
      rawBytesHex,
    };
  }

  const matches = claimedExtension.length > 0 ? canonicalizeExtension(claimedExtension) === canonicalizeExtension(result.ext) : null;

  return {
    detectedMime: result.mime,
    detectedExtension: result.ext,
    claimedExtension,
    matches,
    rawBytesHex,
  };
}
