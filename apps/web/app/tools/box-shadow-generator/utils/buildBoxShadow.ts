import { hexToRgb } from '@aakasa/color-utils';

export interface ShadowLayer {
  id: string;
  offsetX: number;
  offsetY: number;
  /** Non-negative per the CSS spec — a negative blur radius is invalid. */
  blur: number;
  spread: number;
  /** Hex color, e.g. "#000000" — @aakasa/color-utils has no alpha concept,
   * so alpha is tracked separately here and combined into an rgba() string
   * at format time. */
  color: string;
  /** 0-1 */
  alpha: number;
  inset: boolean;
}

function formatColor(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clampedAlpha = Math.round(Math.min(1, Math.max(0, alpha)) * 1000) / 1000;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
}

function buildLayerCss(layer: ShadowLayer): string {
  const value = `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${formatColor(layer.color, layer.alpha)}`;
  return layer.inset ? `inset ${value}` : value;
}

/** Formats one or more shadow layers as a single box-shadow CSS value
 * (comma-separated for multiple layers — later layers in the array render
 * on top, matching CSS's own stacking order for box-shadow). Returns
 * "none" for an empty layer list, since that's the only valid box-shadow
 * value with nothing to show. */
export function buildBoxShadowCss(layers: ShadowLayer[]): string {
  if (layers.length === 0) return 'none';
  return layers.map(buildLayerCss).join(', ');
}
