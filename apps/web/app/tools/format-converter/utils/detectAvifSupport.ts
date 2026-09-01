/**
 * Confirms AVIF encoding support by actually attempting a Canvas toBlob
 * AVIF encode and inspecting the resulting bytes' real file signature —
 * not by trusting `HTMLCanvasElement.toBlob`'s reported `blob.type`, since
 * some browsers silently fall back to PNG for an unsupported target MIME
 * type rather than rejecting the call or returning null, and the returned
 * Blob's `type` can end up claiming the requested format even though the
 * bytes are actually PNG. An encode-and-inspect check catches that; a
 * static feature-detection flag wouldn't.
 */

function looksLikeAvif(bytes: Uint8Array): boolean {
  // ISOBMFF box layout: 4-byte size, 4-byte box type ("ftyp"), then a
  // 4-byte major brand. AVIF's major brand is "avif" (still images) or
  // "avis" (image sequences).
  if (bytes.length < 12) return false;
  const boxType = String.fromCharCode(bytes[4] ?? 0, bytes[5] ?? 0, bytes[6] ?? 0, bytes[7] ?? 0);
  if (boxType !== 'ftyp') return false;
  const brand = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
  return brand === 'avif' || brand === 'avis';
}

async function probeAvifSupport(): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 2, 2);

  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((result) => resolve(result), 'image/avif');
    } catch {
      resolve(null);
    }
  });

  if (!blob || blob.size === 0) return false;

  const bytes = new Uint8Array(await blob.arrayBuffer());
  return looksLikeAvif(bytes);
}

let cachedProbe: Promise<boolean> | null = null;

/** Cached — the probe only needs to run once per session. */
export function detectAvifSupport(): Promise<boolean> {
  if (!cachedProbe) {
    cachedProbe = probeAvifSupport();
  }
  return cachedProbe;
}
