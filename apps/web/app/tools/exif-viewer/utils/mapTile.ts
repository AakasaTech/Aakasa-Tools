/**
 * Standard Slippy Map tile math (the same formula every OSM-based map
 * uses) to turn a lat/lon into a single map tile plus the exact pixel
 * offset within it — enough to show a real, correctly-positioned map
 * preview from one embedded OpenStreetMap tile image, without pulling in
 * a full mapping library (checked first: nothing like Leaflet/Mapbox
 * exists anywhere else in this monorepo, and one tile is all a small,
 * fixed-size preview needs).
 */

const TILE_SIZE = 256;

export interface TilePosition {
  zoom: number;
  tileX: number;
  tileY: number;
  /** Pixel offset of the exact coordinate within the tile image. */
  pixelX: number;
  pixelY: number;
  tileUrl: string;
}

export function getTilePosition(latitude: number, longitude: number, zoom = 14): TilePosition {
  const n = 2 ** zoom;
  const x = ((longitude + 180) / 360) * n;
  const latRad = (latitude * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const tileX = Math.floor(x);
  const tileY = Math.floor(y);

  return {
    zoom,
    tileX,
    tileY,
    pixelX: (x - tileX) * TILE_SIZE,
    pixelY: (y - tileY) * TILE_SIZE,
    tileUrl: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
  };
}

export function openStreetMapUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}
