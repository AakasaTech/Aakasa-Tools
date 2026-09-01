'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Combobox, CopyButton, Slider, type ComboboxOption } from '@aakasa/ui';
import { FONT_CATALOG, fallbackFor } from './utils/fontCatalog';
import { pickRandomPairing } from './utils/pairingSuggestions';
import { buildFontEmbedSnippet } from './utils/generateEmbedCode';
import { loadGoogleFont } from './utils/loadGoogleFont';

const CATEGORY_BY_NAME = new Map(FONT_CATALOG.map((font) => [font.name, font.category]));

function fontFamilyValue(name: string, loaded: boolean): string | undefined {
  if (!loaded) return undefined;
  const category = CATEGORY_BY_NAME.get(name);
  return `'${name}', ${category ? fallbackFor(category) : 'sans-serif'}`;
}

const DEFAULT_HEADING = 'Playfair Display';
const DEFAULT_BODY = 'Inter';
const BACKGROUND_LOAD_INTERVAL_MS = 250;

interface Pairing {
  heading: string;
  body: string;
}

export function FontPairing() {
  const [headingFont, setHeadingFont] = useState(DEFAULT_HEADING);
  const [bodyFont, setBodyFont] = useState(DEFAULT_BODY);
  const [headingSize, setHeadingSize] = useState(42);
  const [bodySize, setBodySize] = useState(16);
  const [favorites, setFavorites] = useState<Pairing[]>([]);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const ensureFontLoaded = useCallback((family: string) => {
    void loadGoogleFont(family).then(() => {
      setLoadedFonts((prev) => (prev.has(family) ? prev : new Set(prev).add(family)));
    });
  }, []);

  // Priority-load the two fonts actually on screen first.
  useEffect(() => {
    ensureFontLoaded(DEFAULT_HEADING);
    ensureFontLoaded(DEFAULT_BODY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Then sweep the rest of the ~50-font catalog in the background, spaced
  // out on a fixed timer — never all at once on load, and never blocking
  // interaction while it runs. A dropdown option also jumps the queue the
  // moment it's hovered, via ensureFontLoaded in renderFontOption.
  //
  // Deliberately a plain setTimeout interval, not requestIdleCallback:
  // tested requestIdleCallback first, and on an otherwise-idle page (which
  // this one usually is right after load) the browser hands back idle
  // periods back-to-back with essentially no gap, so the "background"
  // queue burned through all 50 fonts within about two seconds — no
  // meaningfully different from eager loading. A fixed interval guarantees
  // real pacing regardless of how idle the page happens to be.
  useEffect(() => {
    let cancelled = false;
    const queue = FONT_CATALOG.map((font) => font.name).filter((name) => name !== DEFAULT_HEADING && name !== DEFAULT_BODY);

    function loadNext() {
      if (cancelled) return;
      const next = queue.shift();
      if (!next) return;
      ensureFontLoaded(next);
      setTimeout(loadNext, BACKGROUND_LOAD_INTERVAL_MS);
    }

    setTimeout(loadNext, BACKGROUND_LOAD_INTERVAL_MS);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fontOptions: ComboboxOption[] = useMemo(() => FONT_CATALOG.map((font) => ({ value: font.name, label: font.name })), []);

  function renderFontOption(option: ComboboxOption) {
    const loaded = loadedFonts.has(option.value);
    return (
      <span onMouseEnter={() => ensureFontLoaded(option.value)} style={{ fontFamily: fontFamilyValue(option.value, loaded) }}>
        {option.label}
      </span>
    );
  }

  function handleHeadingChange(value: string) {
    setHeadingFont(value);
    ensureFontLoaded(value);
  }

  function handleBodyChange(value: string) {
    setBodyFont(value);
    ensureFontLoaded(value);
  }

  function randomize() {
    const { heading, body } = pickRandomPairing(FONT_CATALOG);
    setHeadingFont(heading.name);
    setBodyFont(body.name);
    ensureFontLoaded(heading.name);
    ensureFontLoaded(body.name);
  }

  function toggleFavorite() {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.heading === headingFont && fav.body === bodyFont);
      if (exists) return prev.filter((fav) => !(fav.heading === headingFont && fav.body === bodyFont));
      return [...prev, { heading: headingFont, body: bodyFont }];
    });
  }

  function applyFavorite(pairing: Pairing) {
    setHeadingFont(pairing.heading);
    setBodyFont(pairing.body);
    ensureFontLoaded(pairing.heading);
    ensureFontLoaded(pairing.body);
  }

  const isFavorited = favorites.some((fav) => fav.heading === headingFont && fav.body === bodyFont);
  const embed = useMemo(() => buildFontEmbedSnippet(headingFont, bodyFont), [headingFont, bodyFont]);

  const headingFamily = fontFamilyValue(headingFont, loadedFonts.has(headingFont));
  const bodyFamily = fontFamilyValue(bodyFont, loadedFonts.has(bodyFont));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-ink/70 dark:text-paper/70">Heading font</label>
          <Combobox options={fontOptions} value={headingFont} onChange={handleHeadingChange} ariaLabel="Heading font" renderOption={renderFontOption} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-ink/70 dark:text-paper/70">Body font</label>
          <Combobox options={fontOptions} value={bodyFont} onChange={handleBodyChange} ariaLabel="Body font" renderOption={renderFontOption} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={randomize}>
          Randomize pairing
        </Button>
        <Button variant={isFavorited ? 'primary' : 'secondary'} size="sm" onClick={toggleFavorite}>
          {isFavorited ? '★ Favorited' : '☆ Favorite this pairing'}
        </Button>
      </div>

      {favorites.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Favorites this session</h3>
          <div className="flex flex-wrap gap-2">
            {favorites.map((fav) => (
              <button
                key={`${fav.heading}__${fav.body}`}
                type="button"
                onClick={() => applyFavorite(fav)}
                className="rounded-md border border-ink/10 px-2.5 py-1 text-xs text-ink/70 hover:border-accent hover:text-ink dark:border-paper/10 dark:text-paper/70 dark:hover:text-paper"
              >
                {fav.heading} + {fav.body}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Slider id="heading-size" label="Heading size" min={20} max={96} value={headingSize} onChange={setHeadingSize} />
        <Slider id="body-size" label="Body size" min={12} max={24} value={bodySize} onChange={setBodySize} />
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper dark:border-paper/10">
        <div className="px-6 py-10 sm:px-10 sm:py-14" style={{ backgroundColor: '#FFFFFF' }}>
          <p style={{ fontFamily: bodyFamily, fontSize: 12, letterSpacing: '0.08em' }} className="uppercase text-ink/40">
            Product update
          </p>
          <h1 style={{ fontFamily: headingFamily, fontSize: headingSize, lineHeight: 1.1, color: '#0B0D12' }} className="mt-2 font-bold">
            Design systems that scale with your team
          </h1>
          <p style={{ fontFamily: headingFamily, fontSize: headingSize * 0.42, color: '#4B5160' }} className="mt-3">
            A closer look at how consistent typography holds a product together.
          </p>
          <p style={{ fontFamily: bodyFamily, fontSize: bodySize, lineHeight: 1.65, color: '#33363F' }} className="mt-6 max-w-2xl">
            Every good interface starts with a handful of decisions that quietly repeat everywhere: what the headline looks like, how a
            paragraph breathes, where the eye rests before it moves on. Typography carries more of that weight than most teams expect —
            long before color or layout, it&apos;s the first thing a reader actually feels.
          </p>
          <p style={{ fontFamily: bodyFamily, fontSize: bodySize, lineHeight: 1.65, color: '#33363F' }} className="mt-4 max-w-2xl">
            Pairing a distinctive display face for headings with a clean, highly legible font for body copy is one of the fastest ways to
            give a page real character without touching a single layout decision.
          </p>
          <button
            type="button"
            style={{ fontFamily: bodyFamily, fontSize: Math.max(13, bodySize - 1) }}
            className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-white"
          >
            Read the full write-up
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Google Fonts embed</h3>
          <CopyButton value={embed.linkTag} size="sm" label="Copy link tag" />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {embed.linkTag}
        </pre>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">CSS</h3>
          <CopyButton value={embed.cssDeclarations} size="sm" label="Copy CSS" />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {embed.cssDeclarations}
        </pre>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Your selections and favorites stay in this browser tab only — nothing is stored or sent anywhere. Font files themselves are loaded
        from Google Fonts&apos; public CDN, the same way any website using Google Fonts would.
      </span>
    </div>
  );
}
