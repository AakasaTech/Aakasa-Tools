export interface WebManifestOptions {
  name: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
}

/** Minimal valid site.webmanifest referencing the Android/PWA icon sizes
 * this tool generates. name/short_name are left as obvious placeholders —
 * every real manifest needs the site's actual name, which this tool has
 * no way to know. */
export function buildWebManifest(options: WebManifestOptions): string {
  const manifest = {
    name: options.name,
    short_name: options.shortName,
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    display: 'standalone',
  };
  return JSON.stringify(manifest, null, 2);
}
