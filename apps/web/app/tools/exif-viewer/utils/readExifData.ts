import exifr from 'exifr';

export interface CameraInfo {
  make?: string;
  model?: string;
  lens?: string;
}

export interface CaptureSettings {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  focalLength?: string;
}

export interface GpsLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface ParsedExifData {
  camera: CameraInfo | null;
  captureSettings: CaptureSettings | null;
  dateTaken: string | null;
  gps: GpsLocation | null;
  software: string | null;
  /** Everything exifr found, keyed by its own normalized tag names —
   * shown as the collapsible "full raw dump". Present even when none of
   * the structured sections above have anything (e.g. a file with only
   * incidental JFIF fields, no real EXIF). */
  raw: Record<string, unknown>;
  /** True when at least one of the structured sections (camera, capture
   * settings, date, GPS, software) has real data — drives the "No EXIF
   * data found" empty state, independent of whether `raw` happens to
   * contain trivial technical fields. */
  hasMeaningfulData: boolean;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function formatAperture(value: unknown): string | undefined {
  const n = asNumber(value);
  return n !== undefined ? `f/${n}` : undefined;
}

function formatShutterSpeed(value: unknown): string | undefined {
  const n = asNumber(value);
  if (n === undefined || n <= 0) return undefined;
  if (n >= 1) return `${n}s`;
  return `1/${Math.round(1 / n)}s`;
}

function formatFocalLength(value: unknown): string | undefined {
  const n = asNumber(value);
  return n !== undefined ? `${n}mm` : undefined;
}

function formatDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return asString(value);
}

/** Reads and normalizes EXIF/IPTC/XMP metadata from an image file via
 * exifr — exifr's own `parse()` return type is `any` (it genuinely can't
 * know the shape ahead of time across all the tag dictionaries it
 * supports), so everything from this boundary onward is treated as
 * `unknown` and narrowed field-by-field with `asString`/`asNumber` rather
 * than trusted directly. Returns `null` only when exifr itself throws
 * (e.g. a corrupt file) — a file that parses fine but has no meaningful
 * tags still returns a result, just with `hasMeaningfulData: false`. */
export async function readMetadata(file: File): Promise<ParsedExifData | null> {
  let parsed: unknown;
  try {
    parsed = await exifr.parse(file, {
      // ifd0 can't be disabled per exifr's own types, so it's omitted here
      // rather than passed — every other segment is explicitly opted in.
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      mergeOutput: true,
      reviveValues: true,
      translateKeys: true,
      translateValues: true,
    });
  } catch {
    return null;
  }

  const data: Record<string, unknown> = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};

  const camera: CameraInfo = {
    make: asString(data.Make),
    model: asString(data.Model),
    lens: asString(data.LensModel),
  };
  const hasCamera = camera.make !== undefined || camera.model !== undefined || camera.lens !== undefined;

  const captureSettings: CaptureSettings = {
    aperture: formatAperture(data.FNumber),
    shutterSpeed: formatShutterSpeed(data.ExposureTime),
    iso: asNumber(data.ISO),
    focalLength: formatFocalLength(data.FocalLength),
  };
  const hasCaptureSettings = Object.values(captureSettings).some((value) => value !== undefined);

  const dateTaken = formatDate(data.DateTimeOriginal) ?? formatDate(data.CreateDate) ?? formatDate(data.ModifyDate) ?? null;

  const latitude = asNumber(data.latitude);
  const longitude = asNumber(data.longitude);
  const gps: GpsLocation | null =
    latitude !== undefined && longitude !== undefined ? { latitude, longitude, altitude: asNumber(data.GPSAltitude) } : null;

  const software = asString(data.Software) ?? null;

  return {
    camera: hasCamera ? camera : null,
    captureSettings: hasCaptureSettings ? captureSettings : null,
    dateTaken,
    gps,
    software,
    raw: data,
    hasMeaningfulData: hasCamera || hasCaptureSettings || dateTaken !== null || gps !== null || software !== null,
  };
}
