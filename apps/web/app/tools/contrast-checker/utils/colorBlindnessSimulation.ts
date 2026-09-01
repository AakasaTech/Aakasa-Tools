/**
 * Approximate color blindness simulation via fixed sRGB transformation
 * matrices (the widely-used HCIRN-derived coefficients found in many open
 * source simulators). This is a simplified approximation applied directly
 * in sRGB space, not a full linear-RGB/LMS-cone-response simulation — good
 * enough to build awareness of how a color pair might look under a given
 * deficiency, not a clinically precise prediction. Say so wherever this is
 * surfaced in the UI.
 *
 * All hex/RGB conversion comes from @aakasa/color-utils — this file only
 * contains the matrices and the multiply-and-clamp step.
 */

import { hexToRgb, rgbToHex, type RgbColor } from '@aakasa/color-utils';

export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia';

export const COLOR_BLINDNESS_LABELS: Record<ColorBlindnessType, string> = {
  protanopia: 'Protanopia (red-blind)',
  deuteranopia: 'Deuteranopia (green-blind)',
  tritanopia: 'Tritanopia (blue-blind)',
};

type MatrixRow = readonly [number, number, number];
/** A fixed 3-row tuple, not an arbitrary-length array — lets destructuring
 * the three rows stay safe under noUncheckedIndexedAccess. */
type Matrix = readonly [MatrixRow, MatrixRow, MatrixRow];

const SIMULATION_MATRICES: Record<ColorBlindnessType, Matrix> = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ],
};

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function applyMatrix(rgb: RgbColor, matrix: Matrix): RgbColor {
  const [rRow, gRow, bRow] = matrix;
  return {
    r: clampByte(rRow[0] * rgb.r + rRow[1] * rgb.g + rRow[2] * rgb.b),
    g: clampByte(gRow[0] * rgb.r + gRow[1] * rgb.g + gRow[2] * rgb.b),
    b: clampByte(bRow[0] * rgb.r + bRow[1] * rgb.g + bRow[2] * rgb.b),
  };
}

/** Returns the approximate appearance of `hex` under the given color
 * vision deficiency. Returns the original color unchanged if it doesn't
 * parse as a hex color. */
export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(applyMatrix(rgb, SIMULATION_MATRICES[type]));
}
