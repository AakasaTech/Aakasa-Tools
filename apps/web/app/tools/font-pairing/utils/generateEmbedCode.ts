export interface FontEmbedResult {
  linkTag: string;
  cssDeclarations: string;
}

function toUrlFamily(name: string): string {
  return name.trim().replace(/\s+/g, '+');
}

/** Builds the Google Fonts `<link>` embed (regular + bold weights of both
 * fonts, deduplicated if heading and body happen to be the same font) and
 * the corresponding font-family CSS declarations, ready to paste into a
 * real page. */
export function buildFontEmbedSnippet(headingFont: string, bodyFont: string): FontEmbedResult {
  const uniqueFamilies = Array.from(new Set([headingFont, bodyFont]));
  const familyParams = uniqueFamilies.map((name) => `family=${toUrlFamily(name)}:wght@400;700`).join('&');

  const linkTag = [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="https://fonts.googleapis.com/css2?${familyParams}&display=swap" rel="stylesheet">`,
  ].join('\n');

  const cssDeclarations = [
    'h1, h2, h3, .heading {',
    `  font-family: '${headingFont}', sans-serif;`,
    '}',
    '',
    'body, p, .body-text {',
    `  font-family: '${bodyFont}', sans-serif;`,
    '}',
  ].join('\n');

  return { linkTag, cssDeclarations };
}
