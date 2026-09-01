/**
 * Suggests a color, close to the original, that passes a target contrast
 * ratio against a fixed color. All contrast/conversion math comes from
 * @aakasa/color-utils — this file only searches over HSL lightness, it
 * doesn't compute contrast or luminance itself.
 */

import { getContrastRatio, hexToHsl, hslToHex } from '@aakasa/color-utils';

function contrastAtLightness(fixedColor: string, h: number, s: number, l: number): number {
  return getContrastRatio(fixedColor, hslToHex({ h, s, l })) ?? 0;
}

/** Binary search for the lightness value closest to `from`, on the way to
 * `boundary`, where contrast against `fixedColor` first reaches `target`.
 * Assumes contrast moves monotonically between `from` and `boundary` —
 * true in practice, since `boundary` is always one of the two lightness
 * extremes (0 or 100) and contrast against a fixed reference color
 * increases steadily as the other color moves toward black or white.
 * Returns null if even `boundary` itself doesn't reach `target`. */
function findLightnessThreshold(fixedColor: string, h: number, s: number, from: number, boundary: number, target: number): number | null {
  if (contrastAtLightness(fixedColor, h, s, boundary) < target) return null;

  let failing = from;
  let passing = boundary;
  for (let i = 0; i < 30; i += 1) {
    const mid = (failing + passing) / 2;
    if (contrastAtLightness(fixedColor, h, s, mid) >= target) {
      passing = mid;
    } else {
      failing = mid;
    }
  }
  return passing;
}

/**
 * Returns a hex color close to `colorToAdjust` (same hue and saturation,
 * shifted lightness) that meets `targetRatio` against `fixedColor`. Tries
 * shifting toward both black and white and picks whichever needs the
 * smaller lightness change. If neither pure black nor pure white at this
 * hue/saturation can reach the target (only possible for a very demanding
 * targetRatio), falls back to whichever of pure black/white gives the
 * higher contrast.
 */
export function suggestAccessibleColor(fixedColor: string, colorToAdjust: string, targetRatio: number): string {
  const hsl = hexToHsl(colorToAdjust);
  if (!hsl) return colorToAdjust;
  const { h, s, l } = hsl;

  if ((getContrastRatio(fixedColor, colorToAdjust) ?? 0) >= targetRatio) {
    return colorToAdjust;
  }

  const towardBlack = findLightnessThreshold(fixedColor, h, s, l, 0, targetRatio);
  const towardWhite = findLightnessThreshold(fixedColor, h, s, l, 100, targetRatio);

  const candidates = [towardBlack, towardWhite].filter((value): value is number => value !== null);
  if (candidates.length === 0) {
    const blackRatio = getContrastRatio(fixedColor, '#000000') ?? 0;
    const whiteRatio = getContrastRatio(fixedColor, '#FFFFFF') ?? 0;
    return blackRatio >= whiteRatio ? '#000000' : '#FFFFFF';
  }

  const best = candidates.reduce((a, b) => (Math.abs(a - l) <= Math.abs(b - l) ? a : b));
  return hslToHex({ h, s, l: best });
}
