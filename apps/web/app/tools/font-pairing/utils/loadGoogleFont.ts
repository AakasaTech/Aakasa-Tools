/**
 * Loads one Google Font family on demand via a dynamically-inserted
 * `<link>` (the standard Google Fonts CSS2 embed), rather than eagerly
 * loading every font in the curated catalog up front. Chosen over
 * @fontsource npm packages specifically because the catalog here is ~50
 * fonts — installing and maintaining 50 individual @fontsource packages
 * for a curated list this size is more dependency overhead than it's
 * worth, versus a handful of dynamically-requested CDN links that only
 * fire for fonts someone actually looks at. Google's CDN is what backs
 * @fontsource's own font files too, and font assets aren't user data, so
 * there's no privacy concern in fetching from it directly.
 *
 * Each family is only ever requested once — concurrent or repeat calls
 * for the same family share the same in-flight promise.
 */

const loadedFamilies = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

function toUrlFamily(name: string): string {
  return name.trim().replace(/\s+/g, '+');
}

export function isFontLoaded(family: string): boolean {
  return loadedFamilies.has(family);
}

export function loadGoogleFont(family: string): Promise<void> {
  if (loadedFamilies.has(family)) return Promise.resolve();

  const pending = pendingLoads.get(family);
  if (pending) return pending;

  const promise = new Promise<void>((resolve) => {
    const href = `https://fonts.googleapis.com/css2?family=${toUrlFamily(family)}:wght@400;700&display=swap`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => {
      // The stylesheet is loaded (the @font-face rules exist now), but the
      // actual font file only downloads once something needs to render
      // with it — force that now so callers can rely on the font being
      // ready to paint the moment this promise resolves, rather than
      // seeing a fallback font briefly on first use.
      Promise.all([document.fonts.load(`400 1em "${family}"`), document.fonts.load(`700 1em "${family}"`)])
        .catch(() => undefined)
        .finally(resolve);
    };
    link.onerror = () => resolve(); // Don't let one bad font request hang the queue.
    document.head.appendChild(link);
  });

  pendingLoads.set(family, promise);
  void promise.then(() => {
    loadedFamilies.add(family);
    pendingLoads.delete(family);
  });

  return promise;
}
