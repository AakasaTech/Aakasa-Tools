export type FontCategory = 'serif' | 'sans-serif' | 'display' | 'monospace';

export interface FontCatalogEntry {
  name: string;
  category: FontCategory;
  /** The exact Google Fonts family name, used to build the CSS2 API URL
   * and the CSS font-family value — identical to `name` for every font
   * here, kept as its own field since that's not guaranteed in general. */
  googleFontsFamily: string;
}

const FALLBACK_STACK: Record<FontCategory, string> = {
  serif: 'serif',
  'sans-serif': 'sans-serif',
  display: 'sans-serif',
  monospace: 'monospace',
};

export function fallbackFor(category: FontCategory): string {
  return FALLBACK_STACK[category];
}

function entry(name: string, category: FontCategory): FontCatalogEntry {
  return { name, category, googleFontsFamily: name };
}

/**
 * ~50 broadly-useful, well-regarded Google Fonts spanning all four
 * categories — a curated set, not an attempt at the full 1000+ font
 * library, so every entry here is one worth actually recommending.
 */
export const FONT_CATALOG: FontCatalogEntry[] = [
  // Sans-serif
  entry('Inter', 'sans-serif'),
  entry('Roboto', 'sans-serif'),
  entry('Open Sans', 'sans-serif'),
  entry('Lato', 'sans-serif'),
  entry('Montserrat', 'sans-serif'),
  entry('Poppins', 'sans-serif'),
  entry('Work Sans', 'sans-serif'),
  entry('Source Sans 3', 'sans-serif'),
  entry('Manrope', 'sans-serif'),
  entry('DM Sans', 'sans-serif'),
  entry('Karla', 'sans-serif'),
  entry('Rubik', 'sans-serif'),
  entry('IBM Plex Sans', 'sans-serif'),
  entry('Sora', 'sans-serif'),
  entry('Outfit', 'sans-serif'),
  entry('Plus Jakarta Sans', 'sans-serif'),

  // Serif
  entry('Playfair Display', 'serif'),
  entry('Merriweather', 'serif'),
  entry('Lora', 'serif'),
  entry('PT Serif', 'serif'),
  entry('Source Serif 4', 'serif'),
  entry('Crimson Text', 'serif'),
  entry('Libre Baskerville', 'serif'),
  entry('EB Garamond', 'serif'),
  entry('Cormorant Garamond', 'serif'),
  entry('Bitter', 'serif'),
  entry('Noto Serif', 'serif'),
  entry('Spectral', 'serif'),
  entry('Domine', 'serif'),
  entry('Vollkorn', 'serif'),

  // Display
  entry('Bebas Neue', 'display'),
  entry('Abril Fatface', 'display'),
  entry('Oswald', 'display'),
  entry('Anton', 'display'),
  entry('Pacifico', 'display'),
  entry('Righteous', 'display'),
  entry('Fjalla One', 'display'),
  entry('Archivo Black', 'display'),
  entry('Comfortaa', 'display'),
  entry('Lobster', 'display'),
  entry('Raleway', 'display'),
  entry('Josefin Sans', 'display'),

  // Monospace
  entry('JetBrains Mono', 'monospace'),
  entry('Fira Code', 'monospace'),
  entry('Source Code Pro', 'monospace'),
  entry('IBM Plex Mono', 'monospace'),
  entry('Roboto Mono', 'monospace'),
  entry('Space Mono', 'monospace'),
  entry('Inconsolata', 'monospace'),
  entry('Courier Prime', 'monospace'),
];
