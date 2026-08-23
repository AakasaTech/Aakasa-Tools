import { hexToHsl, hslToHex, type HslColor } from '@aakasa/color-utils';

export type HarmonyMode =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'monochromatic'
  | 'tetradic';

export const HARMONY_MODES: { mode: HarmonyMode; label: string }[] = [
  { mode: 'complementary', label: 'Complementary' },
  { mode: 'analogous', label: 'Analogous' },
  { mode: 'triadic', label: 'Triadic' },
  { mode: 'split-complementary', label: 'Split-Complementary' },
  { mode: 'monochromatic', label: 'Monochromatic' },
  { mode: 'tetradic', label: 'Tetradic' },
];

function hueOffset(base: HslColor, degrees: number): HslColor {
  return { ...base, h: ((base.h + degrees) % 360 + 360) % 360 };
}

/**
 * Generates a 4-6 color palette from a base color using standard hue-rotation
 * harmony rules. Pure — takes a hex string and mode, returns hex strings.
 */
export function generateHarmony(baseColorHex: string, mode: HarmonyMode): string[] {
  const base = hexToHsl(baseColorHex);
  if (!base) {
    return [];
  }

  let hues: HslColor[];

  switch (mode) {
    case 'complementary':
      hues = [base, hueOffset(base, 180)];
      break;
    case 'analogous':
      hues = [hueOffset(base, -30), base, hueOffset(base, 30), hueOffset(base, 60)];
      break;
    case 'triadic':
      hues = [base, hueOffset(base, 120), hueOffset(base, 240)];
      break;
    case 'split-complementary':
      hues = [base, hueOffset(base, 150), hueOffset(base, 210)];
      break;
    case 'tetradic':
      hues = [base, hueOffset(base, 90), hueOffset(base, 180), hueOffset(base, 270)];
      break;
    case 'monochromatic':
      hues = [0, 1, 2, 3, 4].map((step) => ({
        ...base,
        l: Math.min(92, Math.max(12, base.l - 32 + step * 16)),
      }));
      break;
    default:
      hues = [base];
  }

  return hues.map(hslToHex);
}
