import type { CornerValues, RadiusUnit } from '../utils/borderRadiusCss';

export interface RadiusPreset {
  name: string;
  unit: RadiusUnit;
  corners: Omit<CornerValues, 'unit'>;
}

function uniform(value: number): Omit<CornerValues, 'unit'> {
  const corner = { h: value, v: value };
  return { topLeft: corner, topRight: corner, bottomRight: corner, bottomLeft: corner };
}

export const RADIUS_PRESETS: RadiusPreset[] = [
  { name: 'Sharp', unit: 'px', corners: uniform(0) },
  { name: 'Subtle', unit: 'px', corners: uniform(6) },
  { name: 'Rounded', unit: 'px', corners: uniform(16) },
  // A radius past half the box's size is clamped down by the CSS spec
  // itself, so any sufficiently large px value reliably produces a full
  // stadium/pill shape regardless of the box's actual dimensions.
  { name: 'Pill', unit: 'px', corners: uniform(999) },
  { name: 'Circle', unit: '%', corners: uniform(50) },
  {
    name: 'Top only',
    unit: 'px',
    corners: {
      topLeft: { h: 20, v: 20 },
      topRight: { h: 20, v: 20 },
      bottomRight: { h: 0, v: 0 },
      bottomLeft: { h: 0, v: 0 },
    },
  },
];
