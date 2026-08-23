import { rgbToHex, type RgbColor } from '@aakasa/color-utils';

/** Pixels with alpha below this (out of 255) are excluded — avoids transparent PNG edges skewing the palette toward black/white. */
const ALPHA_THRESHOLD = 128;

interface Bucket {
  pixels: RgbColor[];
}

type Channel = 'r' | 'g' | 'b';

interface WidestChannel {
  channel: Channel;
  min: number;
  max: number;
  range: number;
}

function channelMinMax(pixels: RgbColor[], channel: Channel): [number, number] {
  let min = 255;
  let max = 0;
  for (const pixel of pixels) {
    const value = pixel[channel];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
}

function widestChannel(pixels: RgbColor[]): WidestChannel {
  let best: WidestChannel = { channel: 'r', min: 0, max: 0, range: -1 };
  for (const channel of ['r', 'g', 'b'] as const) {
    const [min, max] = channelMinMax(pixels, channel);
    if (max - min > best.range) {
      best = { channel, min, max, range: max - min };
    }
  }
  return best;
}

/**
 * Splits a bucket along its widest channel, dividing at the midpoint of that
 * channel's value range (not the population median). A population-median
 * split can spill pixels from a large, tightly-clustered color (e.g. a flat
 * logo background) across the boundary into an unrelated color just to keep
 * the two halves equal-sized — the midpoint of the VALUE range doesn't have
 * that failure mode, which matters for flat-color source images (logos,
 * brand art) that this tool is often used on.
 */
function splitBucket(bucket: Bucket, widest: WidestChannel): [Bucket, Bucket] {
  const mid = (widest.min + widest.max) / 2;
  const first: RgbColor[] = [];
  const second: RgbColor[] = [];
  for (const pixel of bucket.pixels) {
    if (pixel[widest.channel] <= mid) {
      first.push(pixel);
    } else {
      second.push(pixel);
    }
  }
  return [{ pixels: first }, { pixels: second }];
}

function averageColor(pixels: RgbColor[]): RgbColor {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (const pixel of pixels) {
    rSum += pixel.r;
    gSum += pixel.g;
    bSum += pixel.b;
  }
  const n = pixels.length;
  return { r: rSum / n, g: gSum / n, b: bSum / n };
}

export interface ExtractedColor {
  hex: string;
  /** Fraction of sampled pixels this color represents, 0-1 — used for dominance sorting. */
  prevalence: number;
}

/**
 * Median-cut color quantization. Pure — takes ImageData in, returns hex
 * strings out, so it's testable without a real canvas/DOM. Caller is
 * responsible for downscaling the source image before building the
 * ImageData (extraction accuracy doesn't need full resolution).
 */
export function extractPaletteDetailed(imageData: ImageData, count: number): ExtractedColor[] {
  const { data } = imageData;
  const pixels: RgbColor[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]!;
    if (alpha < ALPHA_THRESHOLD) {
      continue;
    }
    pixels.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
  }

  if (pixels.length === 0) {
    return [];
  }

  const buckets: Bucket[] = [{ pixels }];

  while (buckets.length < count) {
    // Score by range weighted by population (log-scaled) rather than raw
    // range alone — otherwise a big, still-mixed bucket can keep losing the
    // "which bucket to split next" contest to a small one that was already
    // mostly resolved, starving the big one of any split at all.
    let targetIndex = -1;
    let targetWidest: WidestChannel | null = null;
    let bestScore = -1;
    buckets.forEach((bucket, index) => {
      if (bucket.pixels.length < 2) {
        return;
      }
      const widest = widestChannel(bucket.pixels);
      if (widest.range <= 0) {
        return;
      }
      const score = widest.range * Math.log2(bucket.pixels.length + 1);
      if (score > bestScore) {
        bestScore = score;
        targetIndex = index;
        targetWidest = widest;
      }
    });

    if (targetIndex === -1 || !targetWidest) {
      break;
    }

    const [first, second] = splitBucket(buckets[targetIndex]!, targetWidest);
    buckets.splice(targetIndex, 1, first, second);
  }

  const totalPixels = pixels.length;
  return buckets
    .filter((bucket) => bucket.pixels.length > 0)
    .map((bucket) => ({
      hex: rgbToHex(averageColor(bucket.pixels)),
      prevalence: bucket.pixels.length / totalPixels,
    }))
    .sort((a, b) => b.prevalence - a.prevalence);
}

/** Convenience wrapper matching the simple hex-strings-only shape most callers want. */
export function extractPalette(imageData: ImageData, count: number): string[] {
  return extractPaletteDetailed(imageData, count).map((color) => color.hex);
}
