'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, FileDropzone, Slider } from '@aakasa/ui';
import { renderTransformSteps, type TransformStep } from './utils/transformImage';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

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

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
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
  return `${base}-transformed.${EXTENSION_BY_MIME[mime]}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), mime, quality);
  });
}

export function ImageRotator() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [steps, setSteps] = useState<TransformStep[]>([]);
  const [previousSteps, setPreviousSteps] = useState<TransformStep[] | null>(null);
  const [customAngle, setCustomAngle] = useState(0);
  const [backgroundFillEnabled, setBackgroundFillEnabled] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('original');
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function recordUndoPoint() {
    setPreviousSteps(steps);
  }

  function addStep(step: TransformStep) {
    recordUndoPoint();
    setSteps((prev) => [...prev, step]);
  }

  function handleRotate90(direction: 1 | -1) {
    addStep({ type: 'rotate', degrees: 90 * direction });
  }

  function handleRotate180() {
    addStep({ type: 'rotate', degrees: 180 });
  }

  function handleFlip(horizontal: boolean, vertical: boolean) {
    addStep({ type: 'flip', horizontal, vertical });
  }

  function handleUndo() {
    if (previousSteps === null) return;
    setSteps(previousSteps);
    setPreviousSteps(null);
  }

  function handleReset() {
    recordUndoPoint();
    setSteps([]);
    setCustomAngle(0);
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

  const effectiveBackground = backgroundFillEnabled || exportFormat === 'image/jpeg' ? backgroundColor : undefined;
  const allSteps: TransformStep[] = customAngle !== 0 ? [...steps, { type: 'rotate', degrees: customAngle }] : steps;

  const settingsKey = JSON.stringify({ steps, customAngle, effectiveBackground, exportFormat, quality });

  // Live preview: redraws the first queued image through the current
  // transform pipeline every time any control changes.
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const source = items[0];
    if (!canvas || !source?.bitmap) return;
    renderTransformSteps(canvas, source.bitmap, allSteps, effectiveBackground);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items[0]?.bitmap, steps, customAngle, effectiveBackground]);

  async function applyToItem(item: QueueItem): Promise<void> {
    if (!item.bitmap) return;
    const canvas = document.createElement('canvas');
    renderTransformSteps(canvas, item.bitmap, allSteps, effectiveBackground);

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
      triggerDownload(url, 'rotated-images.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const doneItems = items.filter((it) => it.resultBlob !== undefined);
  const hasStaleResults = items.some((it) => it.resultBlob !== undefined && it.resultSettingsKey !== settingsKey);
  const hasTransform = steps.length > 0 || customAngle !== 0;
  const showQualitySlider = exportFormat !== 'image/png';

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        accept="image/*"
        label="Drop photos here, or click to browse"
        hint="One file or many — rotated and flipped entirely in your browser, never uploaded."
      />

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Preview ({items[0]?.file.name})</h3>
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-[repeating-conic-gradient(#8884_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] dark:border-paper/10">
            <canvas ref={previewCanvasRef} className="block h-auto max-h-96 w-full object-contain" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => handleRotate90(-1)}>
            Rotate 90° CCW
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleRotate90(1)}>
            Rotate 90° CW
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRotate180}>
            Rotate 180°
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleFlip(true, false)}>
            Flip horizontal
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleFlip(false, true)}>
            Flip vertical
          </Button>
          <span className="mx-1 h-5 w-px bg-ink/10 dark:bg-paper/10" />
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={previousSteps === null}>
            Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={!hasTransform}>
            Reset
          </Button>
        </div>

        <div className="max-w-sm">
          <Slider id="custom-angle" label="Custom angle °" min={0} max={360} value={customAngle} onChange={setCustomAngle} />
        </div>
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

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Checkbox
            label="Fill exposed corners with a color"
            checked={backgroundFillEnabled || exportFormat === 'image/jpeg'}
            disabled={exportFormat === 'image/jpeg'}
            onChange={(event) => setBackgroundFillEnabled(event.target.checked)}
          />
          {(backgroundFillEnabled || exportFormat === 'image/jpeg') && (
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="h-7 w-8 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
            />
          )}
        </div>
        {exportFormat === 'image/jpeg' && (
          <p className="text-xs text-ink/50 dark:text-paper/50">JPEG has no transparency, so a rotated image&apos;s exposed corners always need a fill color.</p>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleApplyToAll} disabled={isProcessing}>
              {isProcessing ? 'Applying…' : items.length > 1 ? 'Apply to all' : 'Apply'}
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

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — your images are never uploaded.</span>
    </div>
  );
}
