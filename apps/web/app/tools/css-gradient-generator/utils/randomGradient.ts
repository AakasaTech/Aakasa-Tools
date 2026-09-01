import { hslToHex } from '@aakasa/color-utils';
import type { ColorStop } from './gradientCss';

/** Hue offsets (in degrees) between stops, biased toward color
 * relationships that tend to look intentional rather than random RGB
 * picks that often land muddy — analogous (small offsets), complementary
 * (180° apart), and split-complementary. */
const HUE_RELATIONSHIPS: number[][] = [
  [0, 25, 50], // analogous
  [0, 180], // complementary
  [0, 150, 210], // split-complementary
  [0, -30, 30], // tight analogous, 3 stops
  [0, 90, 180], // wide spread
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error('pickRandom called with an empty array');
  return item;
}

/** Generates 2-3 color stops with a shared saturation/lightness band (kept
 * mid-range — 55-85% saturation, 45-70% lightness — to avoid the muddy or
 * blown-out results a fully random RGB pick tends to produce) and hues
 * related by one of the relationships above, evenly spaced across 0-100%. */
export function generateRandomStops(): ColorStop[] {
  const baseHue = randomBetween(0, 360);
  const relationship = pickRandom(HUE_RELATIONSHIPS);
  const saturation = randomBetween(55, 85);
  const lightness = randomBetween(45, 70);

  return relationship.map((offset, index) => ({
    color: hslToHex({ h: ((baseHue + offset) % 360 + 360) % 360, s: saturation, l: lightness }),
    position: relationship.length === 1 ? 0 : round((index / (relationship.length - 1)) * 100),
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function generateRandomAngle(): number {
  // Snap to a common increment rather than a fully arbitrary float — reads
  // as a deliberate choice rather than noise.
  return Math.round(randomBetween(0, 360) / 15) * 15;
}

export function generateRandomPosition(): { x: number; y: number } {
  return { x: Math.round(randomBetween(20, 80)), y: Math.round(randomBetween(20, 80)) };
}
