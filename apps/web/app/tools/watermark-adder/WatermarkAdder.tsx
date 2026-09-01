'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Combobox, FileDropzone, Slider, type ComboboxOption } from '@aakasa/ui';
import { applyImageWatermark, applyTextWatermark } from './utils/applyWatermark';
import { PLACEMENT_PRESETS, type PlacementPreset } from './utils/calculateWatermarkPositions';
import { FONT_CATALOG, fallbackFor } from '../font-pairing/utils/fontCatalog';
import { loadGoogleFont } from '../font-pairing/utils/loadGoogleFont';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

type WatermarkType = 'text' | 'image';
type ExportFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';

const EXTENSION_BY_MIME: Record<'image/jpeg' | 'image/png' | 'image/webp', string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const EXPORT_LABELS: Record<ExportFormat, string> = {
  original: 'Keep original',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

const CATEGORY_BY_NAME = new Map(FONT_CATALOG.map((font) => [font.name, font.category]));
const DEFAULT_FONT = 'Inter';

function fontFamilyValue(name: string, loaded: boolean): string {
  const category = CATEGORY_BY_NAME.get(name);
  const fallback = category ? fallbackFor(category) : 'sans-serif';
  return loaded ? `'${name}', ${fallback}` : fallback;
}

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  /** Decoded once on add and reused for every preview redraw / batch
   * apply — avoids re-decoding the source image on every slider tick. */
  bitmap: ImageBitmap | null;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSettingsKey?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

function outputMime(file: File, exportFormat: ExportFormat): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (exportFormat !== 'original') return exportFormat;
  if (file.type === 'image/jpeg' || file.type === 'image/webp') return file.type;
  return 'image/png';
}

function outputFileName(file: File, mime: 'image/jpeg' | 'image/png' | 'image/webp'): string {
  const dotIndex = file.name.lastIndexOf('.');
  const base = dotIndex === -1 ? file.name : file.name.slice(0, dotIndex);
  return `${base}-watermarked.${EXTENSION_BY_MIME[mime]}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), mime, quality);
  });
}

export function WatermarkAdder() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');

  // Text watermark options.
  const [text, setText] = useState('© Your Name');
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [textOpacity, setTextOpacity] = useState(70);
  const [outline, setOutline] = useState(true);
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [rotation, setRotation] = useState(-30);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Image (logo) watermark options.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoBitmap, setLogoBitmap] = useState<ImageBitmap | null>(null);
  const [logoScale, setLogoScale] = useState(20);
  const [logoOpacity, setLogoOpacity] = useState(70);

  // Shared placement.
  const [placement, setPlacement] = useState<PlacementPreset>('bottom-right');
  const [margin, setMargin] = useState(24);
  const [spacing, setSpacing] = useState(48);

  // Export.
  const [exportFormat, setExportFormat] = useState<ExportFormat>('original');
  const [quality, setQuality] = useState(90);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const ensureFontLoaded = useCallback((family: string) => {
    void loadGoogleFont(family).then(() => {
      setLoadedFonts((prev) => (prev.has(family) ? prev : new Set(prev).add(family)));
    });
  }, []);

  useEffect(() => {
    ensureFontLoaded(DEFAULT_FONT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFontChange(value: string) {
    setFontFamily(value);
    ensureFontLoaded(value);
  }

  const fontOptions: ComboboxOption[] = useMemo(() => FONT_CATALOG.map((font) => ({ value: font.name, label: font.name })), []);
  function renderFontOption(option: ComboboxOption) {
    const loaded = loadedFonts.has(option.value);
    return (
      <span onMouseEnter={() => ensureFontLoaded(option.value)} style={{ fontFamily: fontFamilyValue(option.value, loaded) }}>
        {option.label}
      </span>
    );
  }

  function handleFilesSelected(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) return;

    const newItems: QueueItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      bitmap: null,
    }));
    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      void createImageBitmap(item.file).then((bitmap) => {
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, bitmap } : it)));
      });
    });
  }

  function handleLogoSelected(files: File[]) {
    const file = files[0];
    if (!file) return;
    setLogoFile(file);
    void createImageBitmap(file).then((bitmap) => {
      setLogoBitmap((prev) => {
        prev?.close();
        return bitmap;
      });
    });
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
        target.bitmap?.close();
      }
      return prev.filter((it) => it.id !== id);
    });
  }

  const settingsKey = useMemo(
    () =>
      JSON.stringify({
        watermarkType,
        text,
        fontFamily,
        fontSize,
        color,
        textOpacity,
        outline,
        outlineColor,
        rotation,
        hasLogo: logoBitmap !== null,
        logoScale,
        logoOpacity,
        placement,
        margin,
        spacing,
        exportFormat,
        quality,
      }),
    [watermarkType, text, fontFamily, fontSize, color, textOpacity, outline, outlineColor, rotation, logoBitmap, logoScale, logoOpacity, placement, margin, spacing, exportFormat, quality],
  );

  const drawWatermark = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (watermarkType === 'text') {
        if (!text.trim()) return;
        applyTextWatermark(canvas, {
          text,
          fontFamily: fontFamilyValue(fontFamily, loadedFonts.has(fontFamily)),
          fontSize,
          color,
          opacity: textOpacity / 100,
          outline,
          outlineColor,
          rotation,
          placement,
          margin,
          spacing,
        });
      } else if (logoBitmap) {
        applyImageWatermark(canvas, logoBitmap, {
          scale: logoScale,
          opacity: logoOpacity / 100,
          placement,
          margin,
          spacing,
        });
      }
    },
    [watermarkType, text, fontFamily, loadedFonts, fontSize, color, textOpacity, outline, outlineColor, rotation, logoBitmap, logoScale, logoOpacity, placement, margin, spacing],
  );

  // Live preview: redraws the first queued image every time any watermark
  // control changes. The source bitmap is decoded once on file add, so this
  // redraw is cheap even as sliders move continuously.
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const source = items[0];
    if (!canvas || !source?.bitmap) return;
    canvas.width = source.bitmap.width;
    canvas.height = source.bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source.bitmap, 0, 0);
    drawWatermark(canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items[0]?.bitmap, drawWatermark]);

  async function applyToItem(item: QueueItem): Promise<void> {
    if (!item.bitmap) return;
    const canvas = document.createElement('canvas');
    canvas.width = item.bitmap.width;
    canvas.height = item.bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(item.bitmap, 0, 0);
    drawWatermark(canvas);

    const mime = outputMime(item.file, exportFormat);
    const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : quality / 100);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== item.id) return it;
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
        return { ...it, resultBlob: blob, resultUrl: URL.createObjectURL(blob), resultSettingsKey: settingsKey };
      }),
    );
  }

  async function handleApplyToAll() {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      for (const item of items) {
        // eslint-disable-next-line no-await-in-loop
        await applyToItem(item);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadItem(item: QueueItem) {
    if (!item.resultUrl) return;
    triggerDownload(item.resultUrl, outputFileName(item.file, outputMime(item.file, exportFormat)));
  }

  async function handleDownloadZip() {
    const done = items.filter((it): it is QueueItem & { resultBlob: Blob } => it.resultBlob !== undefined);
    if (done.length === 0) return;
    setIsZipping(true);
    try {
      const entries: ZipEntry[] = done.map((it) => ({ name: outputFileName(it.file, outputMime(it.file, exportFormat)), blob: it.resultBlob }));
      const zipBlob = await zipCompressedImages(entries);
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, 'watermarked-images.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const doneItems = items.filter((it) => it.resultBlob !== undefined);
  const hasStaleResults = items.some((it) => it.resultBlob !== undefined && it.resultSettingsKey !== settingsKey);
  const showQualitySlider = outputMime(items[0]?.file ?? new File([], '', { type: 'image/jpeg' }), exportFormat) !== 'image/png';

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        accept="image/*"
        label="Drop photos here, or click to browse"
        hint="One file or many — watermarked entirely in your browser, never uploaded."
      />

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Preview ({items[0]?.file.name})</h3>
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-[repeating-conic-gradient(#8884_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] dark:border-paper/10">
            <canvas ref={previewCanvasRef} className="block h-auto w-full" />
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        <Button variant={watermarkType === 'text' ? 'primary' : 'secondary'} size="sm" onClick={() => setWatermarkType('text')}>
          Text watermark
        </Button>
        <Button variant={watermarkType === 'image' ? 'primary' : 'secondary'} size="sm" onClick={() => setWatermarkType('image')}>
          Image watermark (logo)
        </Button>
      </div>

      {watermarkType === 'text' ? (
        <div className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="watermark-text" className="text-sm text-ink/70 dark:text-paper/70">
              Watermark text
            </label>
            <input
              id="watermark-text"
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="© Your Name or yourwebsite.com"
              className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-ink/70 dark:text-paper/70">Font</label>
              <Combobox options={fontOptions} value={fontFamily} onChange={handleFontChange} ariaLabel="Watermark font" renderOption={renderFontOption} />
            </div>
            <Slider id="font-size" label="Font size" min={12} max={200} value={fontSize} onChange={setFontSize} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="text-color" className="text-sm text-ink/70 dark:text-paper/70">
                Color
              </label>
              <input
                id="text-color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-full cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
              />
            </div>
            <Slider id="text-opacity" label="Opacity %" min={5} max={100} value={textOpacity} onChange={setTextOpacity} />
            <Slider id="rotation" label="Rotation °" min={-180} max={180} value={rotation} onChange={setRotation} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Checkbox label="Outline (improves legibility on busy backgrounds)" checked={outline} onChange={(event) => setOutline(event.target.checked)} />
            {outline && (
              <input
                type="color"
                value={outlineColor}
                onChange={(event) => setOutlineColor(event.target.value)}
                aria-label="Outline color"
                className="h-7 w-7 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
          <FileDropzone
            onFilesSelected={handleLogoSelected}
            accept="image/*"
            label={logoFile ? `Logo: ${logoFile.name} (click to replace)` : 'Drop a logo image here, or click to browse'}
            hint="A transparent PNG works best."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Slider id="logo-scale" label="Size (% of image width)" min={2} max={80} value={logoScale} onChange={setLogoScale} />
            <Slider id="logo-opacity" label="Opacity %" min={5} max={100} value={logoOpacity} onChange={setLogoOpacity} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Placement</h3>
          <div className="grid grid-cols-3 gap-1.5 sm:w-64">
            {PLACEMENT_PRESETS.filter((p) => p.value !== 'tiled').map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setPlacement(preset.value)}
                title={preset.label}
                className={`aspect-square rounded-md border text-xs ${
                  placement === preset.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-ink/15 text-ink/50 hover:border-ink/30 dark:border-paper/15 dark:text-paper/50'
                }`}
              >
                ●
              </button>
            ))}
          </div>
          <Button variant={placement === 'tiled' ? 'primary' : 'secondary'} size="sm" onClick={() => setPlacement('tiled')} className="self-start">
            Tiled (repeated across image)
          </Button>
        </div>

        {placement === 'tiled' ? (
          <div className="max-w-xs">
            <Slider id="spacing" label="Spacing between tiles (px)" min={0} max={300} value={spacing} onChange={setSpacing} />
          </div>
        ) : (
          <div className="max-w-xs">
            <Slider id="margin" label="Margin from edge (px)" min={0} max={200} value={margin} onChange={setMargin} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Export</h3>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(EXPORT_LABELS) as ExportFormat[]).map((format) => (
            <Button key={format} variant={exportFormat === format ? 'primary' : 'secondary'} size="sm" onClick={() => setExportFormat(format)}>
              {EXPORT_LABELS[format]}
            </Button>
          ))}
        </div>
        {showQualitySlider && (
          <div className="max-w-xs">
            <Slider id="quality" label="Quality" min={1} max={100} value={quality} onChange={setQuality} />
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleApplyToAll} disabled={isProcessing}>
              {isProcessing ? 'Applying…' : items.length > 1 ? 'Apply to all' : 'Apply watermark'}
            </Button>
            {items.length > 1 && (
              <Button variant="secondary" onClick={handleDownloadZip} disabled={doneItems.length === 0 || isZipping}>
                {isZipping ? 'Zipping…' : 'Download all as ZIP'}
              </Button>
            )}
          </div>
          {hasStaleResults && (
            <p className="text-xs text-danger">Settings changed since these results were generated — click &ldquo;Apply&rdquo; again to update them.</p>
          )}

          <ul className="flex flex-col divide-y divide-ink/5 rounded-md border border-ink/10 dark:divide-paper/5 dark:border-paper/10">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.resultUrl ?? item.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink dark:text-paper">{item.file.name}</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    {formatBytes(item.file.size)}
                    {item.resultBlob && (
                      <>
                        {' → '}
                        {formatBytes(item.resultBlob.size)}
                        {item.resultSettingsKey !== settingsKey && ' (stale)'}
                      </>
                    )}
                    {!item.bitmap && ' · reading…'}
                  </p>
                </div>
                {item.resultBlob && (
                  <Button variant="secondary" size="sm" onClick={() => downloadItem(item)}>
                    Download
                  </Button>
                )}
                <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-ink/40 hover:text-danger dark:text-paper/40">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — your photos and any logo you upload are never sent anywhere.
      </span>
    </div>
  );
}
