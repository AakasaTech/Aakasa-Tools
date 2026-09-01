export interface PixelDimensions {
  width: number;
  height: number;
}

/** Always inches internally — display-unit conversion happens at the UI boundary via `convertFromInches`/`convertToInches`. */
export interface PhysicalSize {
  width: number;
  height: number;
}

export type PhysicalUnit = 'in' | 'cm' | 'mm';

export const INCH_TO_CM = 2.54;
export const INCH_TO_MM = 25.4;

export function convertFromInches(inches: number, unit: PhysicalUnit): number {
  if (unit === 'cm') return inches * INCH_TO_CM;
  if (unit === 'mm') return inches * INCH_TO_MM;
  return inches;
}

export function convertToInches(value: number, unit: PhysicalUnit): number {
  if (unit === 'cm') return value / INCH_TO_CM;
  if (unit === 'mm') return value / INCH_TO_MM;
  return value;
}

/** pixels = physical size (inches) × DPI, so physical size = pixels ÷ DPI. */
export function calculatePhysicalSize(pixels: PixelDimensions, dpi: number): PhysicalSize {
  if (dpi <= 0) return { width: 0, height: 0 };
  return { width: pixels.width / dpi, height: pixels.height / dpi };
}

export function calculatePixelDimensions(physicalSize: PhysicalSize, dpi: number): PixelDimensions {
  return { width: Math.round(physicalSize.width * dpi), height: Math.round(physicalSize.height * dpi) };
}

/** Computed independently per axis and averaged — the two agree exactly
 * when the pixel and physical-size aspect ratios match, and averaging
 * gives a single sensible figure when they don't (rather than silently
 * only trusting one axis). */
export function calculateDpi(pixels: PixelDimensions, physicalSize: PhysicalSize): number {
  if (physicalSize.width <= 0 || physicalSize.height <= 0) return 0;
  const dpiFromWidth = pixels.width / physicalSize.width;
  const dpiFromHeight = pixels.height / physicalSize.height;
  return (dpiFromWidth + dpiFromHeight) / 2;
}

export function calculateMegapixels(pixels: PixelDimensions): number {
  return (pixels.width * pixels.height) / 1_000_000;
}
