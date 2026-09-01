import type { ShadowLayer } from '../utils/buildBoxShadow';

export type PresetLayer = Omit<ShadowLayer, 'id'>;

export interface ShadowPreset {
  name: string;
  layers: PresetLayer[];
}

/** The classic flat-design "long shadow" trick: many thin, closely-stacked
 * offset layers extending in one direction, each slightly further out and
 * slightly more transparent than the last. Generated rather than hand-typed
 * since it's the same shape repeated with a small per-step increment. */
function buildLongShadowLayers(steps: number): PresetLayer[] {
  return Array.from({ length: steps }, (_, i) => {
    const step = i + 1;
    return {
      offsetX: step * 2,
      offsetY: step * 2,
      blur: 0,
      spread: 0,
      color: '#000000',
      alpha: Math.max(0.02, 0.16 - step * 0.02),
      inset: false,
    };
  });
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    name: 'Subtle',
    layers: [{ offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: '#000000', alpha: 0.08, inset: false }],
  },
  {
    name: 'Soft',
    layers: [
      { offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', alpha: 0.1, inset: false },
      { offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: '#000000', alpha: 0.08, inset: false },
    ],
  },
  {
    name: 'Sharp',
    layers: [{ offsetX: 4, offsetY: 4, blur: 0, spread: 0, color: '#000000', alpha: 0.9, inset: false }],
  },
  {
    name: 'Elevated card',
    layers: [
      { offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: '#000000', alpha: 0.04, inset: false },
      { offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: '#000000', alpha: 0.08, inset: false },
      { offsetX: 0, offsetY: 12, blur: 24, spread: -4, color: '#000000', alpha: 0.1, inset: false },
    ],
  },
  {
    name: 'Glow',
    layers: [{ offsetX: 0, offsetY: 0, blur: 24, spread: 4, color: '#5B6EF5', alpha: 0.55, inset: false }],
  },
  {
    name: 'Long shadow',
    layers: buildLongShadowLayers(7),
  },
];
