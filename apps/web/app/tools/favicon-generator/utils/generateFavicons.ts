/**
 * Canvas-based resizing plus a hand-written .ico binary writer.
 *
 * No .ico library dependency: the well-maintained npm candidates
 * (png-to-ico, to-ico) pull in Node-oriented dependency chains (pngjs,
 * buffer-alloc, parse-png, resize-img, minimist) built around Node Buffers
 * and CLI usage rather than a browser bundle, and the one dependency-free
 * candidate (ico-endec) ships no TypeScript types and has a very small,
 * low-activity maintainer footprint. The ICO format itself is simple
 * enough — confirmed against the actual Microsoft ICONDIR/ICONDIRENTRY
 * spec while writing this — that hand-writing it is both safer (zero
 * dependency risk, no repeat of this session's earlier Node-in-browser
 * bundling problems) and barely more code than wiring up a shaky
 * dependency would have been.
 */

export interface SquareSource {
  width: number;
  height: number;
  draw(ctx: CanvasRenderingContext2D, size: number): void;
}

/** Wraps a bitmap so it can be drawn either as-is (stretched to the target
 * square, for an already-square source) or from a centered square crop. */
export function toSquareSource(bitmap: ImageBitmap, cropToSquare: boolean): SquareSource {
  if (!cropToSquare || bitmap.width === bitmap.height) {
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw(ctx, size) {
        ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, size, size);
      },
    };
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  return {
    width: side,
    height: side,
    draw(ctx, size) {
      ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    },
  };
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas.toBlob produced no data'));
    }, 'image/png');
  });
}

/**
 * Renders `source` into a `size`x`size` PNG. When `background` is given,
 * it's filled first so the result is fully opaque (used for the .ico's
 * embedded images, since .ico transparency handling is historically
 * inconsistent); omit it to keep the source's own alpha channel, which is
 * what the standalone PNG outputs do.
 */
export async function resizeToPngBlob(source: SquareSource, size: number, background: string | null = null): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  source.draw(ctx, size);

  return canvasToPngBlob(canvas);
}

export interface IcoImage {
  size: number;
  blob: Blob;
}

const ICONDIR_SIZE = 6;
const ICONDIRENTRY_SIZE = 16;

/**
 * Builds a genuine multi-resolution .ico file: an ICONDIR header followed
 * by one ICONDIRENTRY per image, followed by the image data itself — NOT
 * a PNG renamed to .ico. Each entry's image data is the raw PNG file
 * bytes directly (the "PNG-embedded ICO" form every icon format spec
 * since Windows Vista, and every modern browser/OS, accepts — simpler
 * than the legacy uncompressed BMP+AND-mask form ICO originally required,
 * and just as valid).
 */
export async function buildIcoFile(images: IcoImage[]): Promise<Blob> {
  const entries = await Promise.all(
    images.map(async ({ size, blob }) => ({
      size,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    })),
  );

  const dirSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * entries.length;
  const totalSize = dirSize + entries.reduce((sum, entry) => sum + entry.bytes.length, 0);

  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved, must be 0
  view.setUint16(2, 1, true); // type: 1 = icon
  view.setUint16(4, entries.length, true);

  let dataOffset = dirSize;
  entries.forEach((entry, index) => {
    const entryOffset = ICONDIR_SIZE + index * ICONDIRENTRY_SIZE;
    const dimensionByte = entry.size >= 256 ? 0 : entry.size; // 0 means 256px, per spec
    view.setUint8(entryOffset + 0, dimensionByte); // width
    view.setUint8(entryOffset + 1, dimensionByte); // height
    view.setUint8(entryOffset + 2, 0); // color count — 0 for non-palette images
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, entry.bytes.length, true); // size of this image's data
    view.setUint32(entryOffset + 12, dataOffset, true); // offset of this image's data

    output.set(entry.bytes, dataOffset);
    dataOffset += entry.bytes.length;
  });

  return new Blob([output], { type: 'image/x-icon' });
}
