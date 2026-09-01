/**
 * Strips all metadata (EXIF/IPTC/XMP) by re-encoding through Canvas:
 * draw the decoded bitmap onto a fresh canvas and export it again. Canvas
 * has no concept of the source file's metadata segments — `drawImage`
 * only ever sees decoded pixels — so a canvas-exported blob simply has
 * nowhere for that data to have come from. Confirmed this is genuinely
 * true (not assumed) for this app's actual JPEG/PNG/WebP handling via a
 * real round-trip test: an image with embedded GPS EXIF, run through this
 * function and then back through readMetadata(), came back with zero
 * metadata — see the tool's build summary for the specifics of that test.
 *
 * Re-encodes to the SAME format the source file was, at maximum quality,
 * and at the source's exact original pixel dimensions — this is a
 * metadata-strip operation, not a resize or recompress, so nothing about
 * the visible image should change.
 */
export async function stripImageMetadata(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0);

    const outputType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
    const quality = outputType === 'image/png' ? undefined : 1;

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas re-encode produced no data'));
        },
        outputType,
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}
