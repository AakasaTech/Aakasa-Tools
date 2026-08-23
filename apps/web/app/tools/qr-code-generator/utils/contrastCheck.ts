import { getContrastRatio } from '@aakasa/color-utils';

export interface ContrastResult {
  sufficient: boolean;
  ratio: number;
}

/**
 * QR modules are a graphical on/off pattern, not text, so WCAG's 4.5:1 text
 * threshold isn't the right reference — the closer analogue is WCAG 1.4.11
 * "non-text contrast", which sets 3:1 as the minimum for meaningful
 * graphical elements. Below that, real scanners routinely fail to
 * distinguish modules from the background even though the colors look
 * different enough on screen.
 */
const MIN_QR_CONTRAST_RATIO = 3;

/** Reuses the same WCAG luminance math as Color Palette Generator's contrast checker. */
export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  if (ratio === null) {
    return { sufficient: false, ratio: 0 };
  }
  return { sufficient: ratio >= MIN_QR_CONTRAST_RATIO, ratio };
}
