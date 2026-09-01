'use client';

import { getTilePosition, openStreetMapUrl } from './utils/mapTile';
import type { GpsLocation } from './utils/readExifData';

const TILE_DISPLAY_SIZE = 256;

/** The highest-priority thing this tool surfaces: if a photo's metadata
 * contains GPS coordinates, this is deliberately the most visually
 * prominent section on the page — a real map preview (one OpenStreetMap
 * tile, positioned via standard Slippy Map math, not a mapping library),
 * the raw coordinates in large monospace, and plain language about what
 * that actually means, rather than a lat/long pair sitting quietly in a
 * list of dozens of other tags where it's easy to skim past. */
export function GpsMapPreview({ gps }: { gps: GpsLocation }) {
  const tile = getTilePosition(gps.latitude, gps.longitude, 14);

  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-danger/40 bg-danger/5 p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">
          📍
        </span>
        <h3 className="text-sm font-semibold text-danger">GPS location found in this photo</h3>
      </div>
      <p className="text-sm text-ink dark:text-paper">
        This file&apos;s metadata reveals exactly where it was taken. Anyone who receives the original file — not a screenshot, the actual
        file — can see this location.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="relative shrink-0 overflow-hidden rounded-md border border-ink/10 bg-ink/5 dark:border-paper/10"
          style={{ width: TILE_DISPLAY_SIZE, height: TILE_DISPLAY_SIZE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.tileUrl} alt="Map showing the photo's location" width={TILE_DISPLAY_SIZE} height={TILE_DISPLAY_SIZE} />
          <div
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-danger shadow"
            style={{ left: tile.pixelX, top: tile.pixelY }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-base font-medium text-ink dark:text-paper">
            {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
          </span>
          {gps.altitude !== undefined && (
            <span className="text-xs text-ink/60 dark:text-paper/60">Altitude: {gps.altitude.toFixed(1)}m</span>
          )}
          <a
            href={openStreetMapUrl(gps.latitude, gps.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Open in OpenStreetMap →
          </a>
        </div>
      </div>
    </div>
  );
}
