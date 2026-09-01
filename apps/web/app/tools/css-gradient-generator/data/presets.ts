import type { GradientConfig } from '../utils/gradientCss';

const DEFAULT_RADIAL = { shape: 'circle' as const, size: 'farthest-corner' as const, position: { x: 50, y: 50 } };
const CENTER_POSITION = { x: 50, y: 50 };

export interface GradientPreset {
  name: string;
  config: GradientConfig;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: 'Sunset',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#FF512F', position: 0 },
        { color: '#F09819', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Ocean',
    config: {
      type: 'linear',
      angle: 120,
      stops: [
        { color: '#2193B0', position: 0 },
        { color: '#6DD5ED', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Purple Dream',
    config: {
      type: 'linear',
      angle: 145,
      stops: [
        { color: '#7F00FF', position: 0 },
        { color: '#E100FF', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Mint',
    config: {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#00B09B', position: 0 },
        { color: '#96C93D', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Candy',
    config: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#FF9A9E', position: 0 },
        { color: '#FAD0C4', position: 50 },
        { color: '#FAD0C4', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Midnight',
    config: {
      type: 'linear',
      angle: 160,
      stops: [
        { color: '#0F2027', position: 0 },
        { color: '#203A43', position: 50 },
        { color: '#2C5364', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Peach',
    config: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#ED4264', position: 0 },
        { color: '#FFEDBC', position: 100 },
      ],
      ...DEFAULT_RADIAL,
    },
  },
  {
    name: 'Aurora Spot',
    config: {
      type: 'radial',
      angle: 0,
      shape: 'circle',
      size: 'farthest-corner',
      position: { x: 30, y: 30 },
      stops: [
        { color: '#43CEA2', position: 0 },
        { color: '#185A9D', position: 100 },
      ],
    },
  },
  {
    name: 'Color Wheel',
    config: {
      type: 'conic',
      angle: 0,
      position: CENTER_POSITION,
      shape: 'circle',
      size: 'farthest-corner',
      stops: [
        { color: '#FF0000', position: 0 },
        { color: '#FFFF00', position: 17 },
        { color: '#00FF00', position: 33 },
        { color: '#00FFFF', position: 50 },
        { color: '#0000FF', position: 67 },
        { color: '#FF00FF', position: 83 },
        { color: '#FF0000', position: 100 },
      ],
    },
  },
];
