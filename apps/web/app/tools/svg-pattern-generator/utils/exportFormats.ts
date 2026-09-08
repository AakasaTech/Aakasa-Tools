/**
 * Export helpers — turning a generated pattern tile into the three
 * formats this tool offers: a ready-to-paste CSS snippet, a standalone
 * SVG file, and a rasterized PNG. PNG rasterization reuses SVG to PNG
 * Converter's existing `convertSvgToRaster` (Canvas-based) rather than a
 * second Canvas rasterization implementation.
 */

import { convertSvgToRaster } from '../../svg-to-png/utils/svgConvert';

export function svgToDataUri(svgMarkup: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgMarkup)))}`;
}

/** A ready-to-paste CSS snippet using the pattern as a data-URI
 * background-image, tiled with `background-repeat`. `background-size` is
 * set explicitly to the tile's own pixel size so the pattern repeats at
 * its intended scale regardless of the element it's applied to. */
export function buildCssBackgroundSnippet(flatTileSvg: string, tileWidth: number, tileHeight: number): string {
  const dataUri = svgToDataUri(flatTileSvg);
  return [
    `background-image: url("${dataUri}");`,
    'background-repeat: repeat;',
    `background-size: ${tileWidth}px ${tileHeight}px;`,
  ].join('\n');
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load the rasterized tile.'));
    };
    img.src = url;
  });
}

/**
 * Rasterizes the pattern as a `tilesX`×`tilesY` grid of tiles, each
 * `pixelsPerTile` wide (height scaled to preserve the tile's own aspect
 * ratio). The single tile is rasterized fresh from the vector source
 * exactly once, then that one bitmap is stamped repeatedly onto a larger
 * canvas — so every tile boundary in the output is pixel-identical to
 * every other, which is what actually guarantees no visible seam in the
 * raster (rather than re-rendering the SVG at each position, which could
 * in principle round sub-pixel edges slightly differently each time).
 */
export async function rasterizeTiledPng(
  flatTileSvg: string,
  tileWidth: number,
  tileHeight: number,
  pixelsPerTile: number,
  tilesX: number,
  tilesY: number
): Promise<Blob> {
  const scaledTileWidth = Math.round(pixelsPerTile);
  const scaledTileHeight = Math.round(pixelsPerTile * (tileHeight / tileWidth));

  const tileBlob = await convertSvgToRaster(flatTileSvg, {
    width: scaledTileWidth,
    height: scaledTileHeight,
    format: 'image/png',
  });
  const tileImg = await loadImageFromBlob(tileBlob);

  const canvas = document.createElement('canvas');
  canvas.width = scaledTileWidth * tilesX;
  canvas.height = scaledTileHeight * tilesY;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  for (let ty = 0; ty < tilesY; ty += 1) {
    for (let tx = 0; tx < tilesX; tx += 1) {
      ctx.drawImage(tileImg, tx * scaledTileWidth, ty * scaledTileHeight);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/png');
  });
}
