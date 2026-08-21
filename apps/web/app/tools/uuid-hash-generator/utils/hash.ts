/**
 * Pure hashing logic. No React, no DOM beyond the Web Crypto API — safe to
 * call from the main thread or a Web Worker, and reusable by a future
 * standalone File Checksum Verifier tool.
 */

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

export const HASH_ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];

/** MD5 is the only algorithm here that isn't cryptographically secure. */
export function isSecureAlgorithm(algorithm: HashAlgorithm): boolean {
  return algorithm !== 'MD5';
}

export async function computeHash(input: string | ArrayBuffer, algorithm: HashAlgorithm): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);

  if (algorithm === 'MD5') {
    return bytesToHex(md5(bytes));
  }

  const digest = await crypto.subtle.digest(algorithm, bytes);
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// --- MD5 (RFC 1321) ---------------------------------------------------------
// Web Crypto's subtle.digest() does not support MD5, so this is the one
// algorithm in this tool not backed by the native crypto API. MD5 is
// cryptographically broken (practical collision attacks exist) — this
// exists only for legacy/non-security checksums (git blob hashes, dedup
// keys, verifying old third-party checksums), never for passwords or
// anything security-sensitive. The UI flags this wherever MD5 is offered.

const MD5_K = new Int32Array([
  -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983, 1770035416,
  -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
  643717713, -373897302, -701558691, 38016083, -660478335, -405537848, 568446438, -1019803690, -187363961,
  1163531501, -1444681467, -51403784, 1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
  -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222, -722521979, 76029189, -640364487,
  -421815835, 530742520, -995338651, -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
  -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259,
  -343485551,
]);

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

function leftRotate(x: number, amount: number): number {
  return (x << amount) | (x >>> (32 - amount));
}

function md5(message: Uint8Array): Uint8Array {
  const msgLen = message.length;
  const bitLen = msgLen * 8;

  let totalLen = msgLen + 1;
  while (totalLen % 64 !== 56) {
    totalLen += 1;
  }
  totalLen += 8;

  const padded = new Uint8Array(totalLen);
  padded.set(message);
  padded[msgLen] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLenLow = bitLen >>> 0;
  const bitLenHigh = Math.floor(bitLen / 0x100000000);
  view.setUint32(totalLen - 8, bitLenLow, true);
  view.setUint32(totalLen - 4, bitLenHigh, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const chunkCount = totalLen / 64;
  const M = new Int32Array(16);

  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    for (let j = 0; j < 16; j += 1) {
      M[j] = view.getInt32(chunk * 64 + j * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        f = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        f = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      f = (f + A + MD5_K[i]! + M[g]!) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + leftRotate(f, MD5_S[i]!)) | 0;
    }

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setInt32(0, a0, true);
  outView.setInt32(4, b0, true);
  outView.setInt32(8, c0, true);
  outView.setInt32(12, d0, true);
  return out;
}
