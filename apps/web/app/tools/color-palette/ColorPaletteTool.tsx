'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, CopyButton, FileDropzone } from '@aakasa/ui';
import { LockIcon } from '@aakasa/tool-shell';
import {
  getContrastRatio,
  hexToHsl,
  hexToRgb,
  hslToHex,
  meetsWcagAA,
  rgbToHsl,
} from '@aakasa/color-utils';
import { generateHarmony, HARMONY_MODES, type HarmonyMode } from './utils/harmonyGenerator';
import { extractPaletteDetailed, type ExtractedColor } from './utils/imageColorExtraction';

interface Swatch {
  hex: string;
  locked: boolean;
}

type Tab = 'generate' | 'extract';
type SortMode = 'prevalence' | 'hue';

const DEFAULT_BASE_COLOR = '#5B6EF5';
const EXTRACT_COUNT = 6;
const MAX_EXTRACT_DIMENSION = 200;

function normalizeHex(value: string): string | null {
  const rgb = hexToRgb(value);
  return rgb ? `#${[rgb.r, rgb.g, rgb.b].map((c) => c.toString(16).padStart(2, '0')).join('')}` : null;
}

function randomBaseColor(): string {
  return hslToHex({ h: Math.random() * 360, s: 65 + Math.random() * 20, l: 45 + Math.random() * 15 });
}

function buildCssVariables(hexes: string[]): string {
  const lines = hexes.map((hex, index) => `  --color-${index + 1}: ${hex};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

async function extractColorsFromFile(file: File): Promise<ExtractedColor[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EXTRACT_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas is not supported in this browser.');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return extractPaletteDetailed(imageData, EXTRACT_COUNT);
  } finally {
    bitmap.close();
  }
}

export function ColorPaletteTool() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // --- Generate tab state ---
  const [baseColor, setBaseColor] = useState(DEFAULT_BASE_COLOR);
  const [baseColorText, setBaseColorText] = useState(DEFAULT_BASE_COLOR);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('complementary');
  const [swatches, setSwatches] = useState<Swatch[]>(() =>
    generateHarmony(DEFAULT_BASE_COLOR, 'complementary').map((hex) => ({ hex, locked: false }))
  );

  useEffect(() => {
    const generated = generateHarmony(baseColor, harmonyMode);
    setSwatches((prev) => generated.map((hex, index) => (prev[index]?.locked ? prev[index]! : { hex, locked: false })));
  }, [baseColor, harmonyMode]);

  useEffect(() => {
    setBaseColorText(baseColor);
  }, [baseColor]);

  function handleHexTextChange(raw: string) {
    setBaseColorText(raw);
    const normalized = normalizeHex(raw);
    if (normalized) {
      setBaseColor(normalized);
    }
  }

  function handleRandomize() {
    setBaseColor(randomBaseColor());
  }

  function toggleLock(index: number) {
    setSwatches((prev) => prev.map((swatch, i) => (i === index ? { ...swatch, locked: !swatch.locked } : swatch)));
  }

  // --- Extract tab state ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedColor[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('prevalence');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImageUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImageUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    if (!imageFile) {
      setExtracted([]);
      return;
    }
    let cancelled = false;
    setIsProcessing(true);
    setExtractError(null);

    extractColorsFromFile(imageFile)
      .then((colors) => {
        if (!cancelled) {
          setExtracted(colors);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setExtractError(err instanceof Error ? err.message : 'Could not read this image.');
          setExtracted([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsProcessing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageFile]);

  const sortedExtracted = useMemo(() => {
    if (sortMode === 'prevalence') {
      return extracted;
    }
    return [...extracted].sort((a, b) => (hexToHsl(a.hex)?.h ?? 0) - (hexToHsl(b.hex)?.h ?? 0));
  }, [extracted, sortMode]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
        <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>
          Generate
        </TabButton>
        <TabButton active={activeTab === 'extract'} onClick={() => setActiveTab('extract')}>
          Extract from image
        </TabButton>
      </div>

      {activeTab === 'generate' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="base-color-picker" className="text-sm text-ink/70 dark:text-paper/70">
                Base color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="base-color-picker"
                  type="color"
                  value={baseColor}
                  onChange={(event) => setBaseColor(event.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
                />
                <input
                  type="text"
                  value={baseColorText}
                  onChange={(event) => handleHexTextChange(event.target.value)}
                  spellCheck={false}
                  className="h-9 w-28 rounded-md border border-ink/10 bg-transparent px-2 font-mono text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="harmony-mode" className="text-sm text-ink/70 dark:text-paper/70">
                Harmony
              </label>
              <select
                id="harmony-mode"
                value={harmonyMode}
                onChange={(event) => setHarmonyMode(event.target.value as HarmonyMode)}
                className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              >
                {HARMONY_MODES.map(({ mode, label }) => (
                  <option key={mode} value={mode} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="secondary" onClick={handleRandomize}>
              Randomize
            </Button>

            <div className="ml-auto">
              <CopyButton
                value={buildCssVariables(swatches.map((s) => s.hex))}
                label="Copy all as CSS variables"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {swatches.map((swatch, index) => (
              <SwatchCard
                key={index}
                hex={swatch.hex}
                index={index}
                locked={swatch.locked}
                onToggleLock={() => toggleLock(index)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'extract' && (
        <div className="flex flex-col gap-4">
          <FileDropzone
            onFileSelected={setImageFile}
            accept="image/*"
            hint="PNG, JPG, WebP, and more — processed entirely in your browser, never uploaded."
          />

          {extractError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {extractError}
            </p>
          )}

          {isProcessing && <p className="text-sm text-ink/60 dark:text-paper/60">Analyzing image…</p>}

          {imageUrl && !isProcessing && sortedExtracted.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Uploaded image"
                className="max-h-64 w-full rounded-md border border-ink/10 object-contain dark:border-paper/10 sm:w-1/3"
              />

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant={sortMode === 'prevalence' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setSortMode('prevalence')}
                    >
                      By dominance
                    </Button>
                    <Button
                      variant={sortMode === 'hue' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setSortMode('hue')}
                    >
                      By hue
                    </Button>
                  </div>
                  <CopyButton
                    value={buildCssVariables(sortedExtracted.map((c) => c.hex))}
                    label="Copy all as CSS variables"
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sortedExtracted.map((color, index) => (
                    <SwatchCard key={`${color.hex}-${index}`} hex={color.hex} index={index} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-paper text-ink shadow-sm dark:bg-ink dark:text-paper'
          : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}

interface SwatchCardProps {
  hex: string;
  index: number;
  locked?: boolean;
  onToggleLock?: () => void;
}

function SwatchCard({ hex, index, locked, onToggleLock }: SwatchCardProps) {
  const [formatOpen, setFormatOpen] = useState(false);

  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb) : null;
  const rgbString = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : hex;
  const hslString = hsl ? `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` : hex;
  const cssVar = `--color-${index + 1}: ${hex};`;

  const whiteContrast = getContrastRatio(hex, '#ffffff');
  const blackContrast = getContrastRatio(hex, '#000000');

  async function handleSwatchClick() {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // Clipboard API can reject (permissions, insecure context) — the
      // explicit CopyButton below remains a working fallback.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => void handleSwatchClick()}
          className="h-24 w-full rounded-md border border-ink/10 transition-transform hover:scale-[1.02] dark:border-paper/10 sm:h-28"
          style={{ backgroundColor: hex }}
          aria-label={`Copy ${hex}`}
          title={`Click to copy ${hex}`}
        />
        {onToggleLock && (
          <button
            type="button"
            onClick={onToggleLock}
            aria-label={locked ? 'Unlock this color' : 'Lock this color'}
            aria-pressed={locked}
            className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
              locked ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'bg-white/70 text-ink/60 hover:bg-white/90'
            }`}
          >
            <LockIcon className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-sm text-ink dark:text-paper">{hex}</span>
        <CopyButton value={hex} size="sm" />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setFormatOpen((open) => !open)}
          className="text-xs text-ink/50 underline decoration-dotted hover:text-ink/80 dark:text-paper/50 dark:hover:text-paper/80"
        >
          {formatOpen ? 'Hide formats' : 'More formats'}
        </button>
        {formatOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 flex w-56 flex-col gap-1 rounded-md border border-ink/10 bg-paper p-2 shadow-md dark:border-paper/10 dark:bg-ink">
            {[
              { label: 'HEX', value: hex },
              { label: 'RGB', value: rgbString },
              { label: 'HSL', value: hslString },
              { label: 'CSS', value: cssVar },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-ink/70 dark:text-paper/70">{value}</span>
                <CopyButton value={value} label={label} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <ContrastPreview textColor="#ffffff" bgColor={hex} ratio={whiteContrast} />
        <ContrastPreview textColor="#000000" bgColor={hex} ratio={blackContrast} />
      </div>
    </div>
  );
}

function ContrastPreview({
  textColor,
  bgColor,
  ratio,
}: {
  textColor: string;
  bgColor: string;
  ratio: number | null;
}) {
  const passes = ratio !== null && meetsWcagAA(ratio);

  return (
    <div
      className="flex flex-1 items-center justify-between rounded border border-ink/10 px-1.5 py-1 dark:border-paper/10"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-xs font-semibold" style={{ color: textColor }}>
        Aa
      </span>
      <span
        className={`rounded px-1 text-[10px] font-medium ${passes ? 'bg-success text-white' : 'bg-danger text-white'}`}
        title={ratio !== null ? `Contrast ratio ${ratio.toFixed(2)}:1` : 'Unable to compute'}
      >
        {ratio !== null ? (passes ? 'AA' : 'Fail') : '—'}
      </span>
    </div>
  );
}
