import figlet from 'figlet';

// Statically imported font DATA (not fetched at runtime) — figlet's browser
// build defaults to fetching a font over the network the first time it's
// used, which this app deliberately avoids: every font this tool offers is
// bundled directly into the JS output via these imports and registered with
// `figlet.parseFont` below, so generating ASCII art never makes a network
// request. This is figlet's own documented pattern for bundler-based
// (webpack/Next.js) browser usage — see the "Getting Started - Browser with
// ES modules" section of figlet's README.
import standard from 'figlet/fonts/Standard';
import big from 'figlet/fonts/Big';
import block from 'figlet/fonts/Block';
import banner from 'figlet/fonts/Banner';
import doom from 'figlet/fonts/Doom';
import colossal from 'figlet/fonts/Colossal';
import larry3d from 'figlet/fonts/Larry 3D';
import small from 'figlet/fonts/Small';
import slant from 'figlet/fonts/Slant';
import smallSlant from 'figlet/fonts/Small Slant';
import shadow from 'figlet/fonts/Shadow';
import ghost from 'figlet/fonts/Ghost';
import digital from 'figlet/fonts/Digital';
import script from 'figlet/fonts/Script';
import starWars from 'figlet/fonts/Star Wars';
import graffiti from 'figlet/fonts/Graffiti';
import bubble from 'figlet/fonts/Bubble';
import rectangles from 'figlet/fonts/Rectangles';
import speed from 'figlet/fonts/Speed';
import rounded from 'figlet/fonts/Rounded';

/**
 * A curated subset of figlet's ~328 bundled fonts — spanning classic block
 * styles, slim/compact styles, and a few playful/decorative ones — rather
 * than exposing the entire library, which would be an overwhelming and
 * mostly-redundant picker. Each font here is statically imported above, so
 * this list and the registration below must stay in sync.
 */
export const ASCII_FONTS = [
  'Standard',
  'Big',
  'Block',
  'Banner',
  'Doom',
  'Colossal',
  'Larry 3D',
  'Small',
  'Slant',
  'Small Slant',
  'Shadow',
  'Ghost',
  'Digital',
  'Script',
  'Star Wars',
  'Graffiti',
  'Bubble',
  'Rectangles',
  'Speed',
  'Rounded',
] as const;

export type AsciiFont = (typeof ASCII_FONTS)[number];

const FONT_DATA: Record<AsciiFont, string> = {
  Standard: standard,
  Big: big,
  Block: block,
  Banner: banner,
  Doom: doom,
  Colossal: colossal,
  'Larry 3D': larry3d,
  Small: small,
  Slant: slant,
  'Small Slant': smallSlant,
  Shadow: shadow,
  Ghost: ghost,
  Digital: digital,
  Script: script,
  'Star Wars': starWars,
  Graffiti: graffiti,
  Bubble: bubble,
  Rectangles: rectangles,
  Speed: speed,
  Rounded: rounded,
};

let fontsRegistered = false;

/** Registers every curated font with figlet exactly once — safe to call
 * repeatedly (e.g. on every render) since it no-ops after the first call. */
function ensureFontsRegistered(): void {
  if (fontsRegistered) return;
  for (const font of ASCII_FONTS) {
    figlet.parseFont(font, FONT_DATA[font]);
  }
  fontsRegistered = true;
}

export interface GenerateAsciiOptions {
  width?: number;
}

/**
 * Renders `text` as ASCII banner art in the given font. Thin async wrapper
 * around figlet's synchronous `textSync` — synchronous under the hood
 * (all font data is preloaded, never fetched), but returning a Promise
 * keeps this call site future-proof if generation ever needs to move off
 * the main thread, and matches figlet's own modern (Promise-based) API
 * shape for non-callback usage.
 */
export async function generateAscii(text: string, font: AsciiFont, options: GenerateAsciiOptions = {}): Promise<string> {
  ensureFontsRegistered();
  return figlet.textSync(text, {
    font,
    width: options.width,
    whitespaceBreak: true,
  });
}
