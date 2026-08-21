import type { Config } from 'tailwindcss';
import sharedPreset from '@aakasa/config/tailwind/preset';

const config: Config = {
  presets: [sharedPreset],
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/tool-shell/src/**/*.{ts,tsx}',
  ],
};

export default config;
