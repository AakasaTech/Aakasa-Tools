/**
 * Pure RGB↔CMYK conversion — no DOM, no React. The standard, simple
 * subtractive-color formula (not a color-managed conversion against a
 * real printer/ICC profile) — the same honest limitation the tool's own
 * FAQ states: screens (RGB, additive) and printers (CMYK, subtractive)
 * reproduce color fundamentally differently, so any RGB→CMYK conversion
 * is a reasonable reference approximation, not a print-color guarantee.
 *
 * Kept local to this tool rather than added to `@aakasa/color-utils`:
 * CMYK has exactly one consumer right now (this tool), well below the
 * ~3-4 consumer point where hex/RGB/HSL and CSV parsing were each
 * extracted into their own shared packages. If a second CMYK-consuming
 * tool shows up, that's the moment to reconsider.
 */

import type { RgbColor } from '@aakasa/color-utils';

export interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function rgbToCmyk(r: number, g: number, b: number): CmykColor {
  const rNorm = clampByte(r) / 255;
  const gNorm = clampByte(g) / 255;
  const bNorm = clampByte(b) / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  // Pure black: every channel is already 0, and the c/m/y formulas below
  // would divide by (1 - k) = 0 — define this case explicitly rather than
  // producing NaN.
  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return {
    c: clampPercent(c * 100),
    m: clampPercent(m * 100),
    y: clampPercent(y * 100),
    k: clampPercent(k * 100),
  };
}

export function cmykToRgb(c: number, m: number, y: number, k: number): RgbColor {
  const cNorm = clampPercent(c) / 100;
  const mNorm = clampPercent(m) / 100;
  const yNorm = clampPercent(y) / 100;
  const kNorm = clampPercent(k) / 100;

  return {
    r: clampByte(255 * (1 - cNorm) * (1 - kNorm)),
    g: clampByte(255 * (1 - mNorm) * (1 - kNorm)),
    b: clampByte(255 * (1 - yNorm) * (1 - kNorm)),
  };
}
