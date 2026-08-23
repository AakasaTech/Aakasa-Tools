import { zip, type AsyncZippable } from 'fflate';

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** Appends "-1", "-2", ... to any name that repeats, so a batch that compressed two same-named files from different folders doesn't collide inside the zip. */
function dedupeNames(entries: ZipEntry[]): string[] {
  const seen = new Map<string, number>();
  return entries.map(({ name }) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) {
      return name;
    }
    const dotIndex = name.lastIndexOf('.');
    return dotIndex === -1
      ? `${name}-${count}`
      : `${name.slice(0, dotIndex)}-${count}${name.slice(dotIndex)}`;
  });
}

/**
 * Bundles already-compressed image blobs into a single downloadable zip,
 * entirely client-side. Uses store-only (`level: 0`) rather than deflate —
 * the contents are already-compressed JPEG/WebP/PNG bytes, so spending CPU
 * trying to deflate them further buys essentially nothing.
 */
export async function zipCompressedImages(entries: ZipEntry[]): Promise<Blob> {
  const names = dedupeNames(entries);
  const inputs: AsyncZippable = {};

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const name = names[i];
    if (!entry || !name) {
      continue;
    }
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    inputs[name] = [bytes, { level: 0 }];
  }

  const zipped = await new Promise<Uint8Array>((resolve, reject) => {
    zip(inputs, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });

  // `zip`'s Uint8Array is typed against ArrayBufferLike (which includes
  // SharedArrayBuffer), while BlobPart requires a plain ArrayBuffer —
  // copy the bytes into a fresh, plainly-typed buffer to satisfy that.
  const zippedBuffer = zipped.slice().buffer;
  return new Blob([zippedBuffer], { type: 'application/zip' });
}
