/**
 * Shared Tailwind preset for every app/tool in the toolbox.
 * Apps should extend this preset rather than redefining colors/fonts locally.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0B0D12',
        paper: '#F7F7F5',
        accent: '#5B6EF5',
        success: '#1BA672',
        danger: '#E8543A',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
