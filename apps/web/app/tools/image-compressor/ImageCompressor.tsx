'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Checkbox, FileDropzone, Slider } from '@aakasa/ui';
import { compressImage, type CompressionResult, type OutputFormat } from './utils/compressImage';
import { zipCompressedImages } from './utils/zipFiles';
import { BeforeAfterSlider } from './BeforeAfterSlider';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');
const CONCURRENCY = 3;
const MAX_DIMENSION_MIN = 320;
const MAX_DIMENSION_MAX = 4000;
const WARN_FILE_COUNT = 20;
const WARN_TOTAL_BYTES = 200 * 1024 * 1024; // 200MB

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'original', label: 'Keep original' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
];

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
};

type ItemStatus = 'pending' | 'compressing' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  progress: number;
  result?: CompressionResult;
  resultUrl?: string;
  error?: string;
  /** Settings snapshot this item was last processed with — lets the UI tell when a `done` result is stale relative to the current settings. */
  ranWithSettingsKey?: string;
}

interface Settings {
  quality: number;
  outputFormat: OutputFormat;
  resizeEnabled: boolean;
  maxDimension: number;
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

function settingsKey(settings: Settings): string {
  return JSON.stringify({
    quality: settings.quality,
    outputFormat: settings.outputFormat,
    maxDimension: settings.resizeEnabled ? settings.maxDimension : null,
  });
}

function outputFileName(item: QueueItem): string {
  const original = item.file.name;
  const dotIndex = original.lastIndexOf('.');
  const base = dotIndex === -1 ? original : original.slice(0, dotIndex);
  const mime = item.result?.file.type;
  const ext = (mime && EXTENSION_BY_MIME[mime]) ?? (dotIndex === -1 ? '' : original.slice(dotIndex + 1));
  return ext ? `${base}.${ext}` : base;
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

export function ImageCompressor() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('original');
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [maxDimension, setMaxDimension] = useState(1920);

  const settings: Settings = { quality, outputFormat, resizeEnabled, maxDimension };
  const currentKey = settingsKey(settings);

  const processBatch = useCallback(async (targets: { id: string; file: File }[], batchSettings: Settings) => {
    if (targets.length === 0) {
      return;
    }
    setIsProcessing(true);
    const key = settingsKey(batchSettings);
    const options = {
      quality: batchSettings.quality,
      outputFormat: batchSettings.outputFormat,
      maxDimension: batchSettings.resizeEnabled ? batchSettings.maxDimension : undefined,
    };

    let cursor = 0;
    async function runOne(id: string, file: File) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
          return { ...it, status: 'compressing', progress: 0, error: undefined, resultUrl: undefined };
        })
      );

      try {
        const result = await compressImage(file, {
          ...options,
          onProgress: (progress) => {
            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress } : it)));
          },
        });
        const resultUrl = URL.createObjectURL(result.file);
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, status: 'done', progress: 100, result, resultUrl, ranWithSettingsKey: key }
              : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Compression failed.',
                  ranWithSettingsKey: key,
                }
              : it
          )
        );
      }
    }

    async function worker() {
      while (cursor < targets.length) {
        const index = cursor;
        cursor += 1;
        const target = targets[index];
        if (target) {
          await runOne(target.id, target.file);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()));
    setIsProcessing(false);
  }, []);

  function handleFilesSelected(files: File[]) {
    const accepted = files.filter((file) => ACCEPTED_TYPES.includes(file.type));
    if (accepted.length === 0) {
      return;
    }

    const newItems: QueueItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setSelectedId((prev) => prev ?? newItems[0]?.id ?? null);
    void processBatch(
      newItems.map((it) => ({ id: it.id, file: it.file })),
      settings
    );
  }

  function handleRecompress() {
    if (items.length === 0 || isProcessing) {
      return;
    }
    void processBatch(
      items.map((it) => ({ id: it.id, file: it.file })),
      settings
    );
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function downloadItem(item: QueueItem) {
    if (!item.resultUrl) return;
    triggerDownload(item.resultUrl, outputFileName(item));
  }

  async function handleDownloadZip() {
    const completed = items.filter((it) => it.status === 'done' && it.result);
    if (completed.length === 0) return;
    setIsZipping(true);
    try {
      const zipBlob = await zipCompressedImages(
        completed.map((it) => ({ name: outputFileName(it), blob: it.result!.file }))
      );
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, 'compressed-images.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const completedItems = useMemo(() => items.filter((it) => it.status === 'done' && it.result), [items]);
  const totalOriginal = useMemo(
    () => completedItems.reduce((sum, it) => sum + (it.result?.originalSize ?? 0), 0),
    [completedItems]
  );
  const totalCompressed = useMemo(
    () => completedItems.reduce((sum, it) => sum + (it.result?.compressedSize ?? 0), 0),
    [completedItems]
  );
  const percentSaved = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  const overallProgress =
    items.length === 0
      ? 0
      : Math.round(
          items.reduce((sum, it) => sum + (it.status === 'done' || it.status === 'error' ? 100 : it.progress), 0) /
            items.length
        );

  const isDirty = items.some(
    (it) => (it.status === 'done' || it.status === 'error') && it.ranWithSettingsKey !== currentKey
  );

  const compareItem =
    (selectedId ? completedItems.find((it) => it.id === selectedId) : undefined) ?? completedItems[0];

  const totalBytes = items.reduce((sum, it) => sum + it.file.size, 0);
  const showBatchWarning = items.length > WARN_FILE_COUNT || totalBytes > WARN_TOTAL_BYTES;

  return (
    <div className="flex flex-col gap-6">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        accept={ACCEPT_ATTR}
        label="Drop images here, or click to browse"
        hint="JPG, PNG, or WebP — one file or many, compressed entirely in your browser, never uploaded."
      />

      {showBatchWarning && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {items.length} images (~{formatBytes(totalBytes)}) queued — a batch this large may take a while and use
          significant memory in this browser tab.
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="flex flex-col gap-4 rounded-md border border-ink/10 p-4 dark:border-paper/10">
            <h2 className="font-display text-sm font-semibold text-ink dark:text-paper">Compression settings</h2>

            <div>
              <Slider label="Quality" min={1} max={100} value={quality} onChange={setQuality} />
              <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">
                Applies to JPEG and WebP output. PNG re-encoding is lossless, so quality has no effect on it.
              </p>
            </div>

            <div>
              <span className="text-sm text-ink/70 dark:text-paper/70">Output format</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {FORMAT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={outputFormat === opt.value ? 'primary' : 'secondary'}
                    onClick={() => setOutputFormat(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {outputFormat === 'webp' && (
                <p className="mt-1.5 text-xs text-ink/50 dark:text-paper/50">
                  WebP typically produces meaningfully smaller files than JPEG at equivalent visual quality.
                </p>
              )}
              {outputFormat === 'jpeg' && (
                <p className="mt-1.5 text-xs text-ink/50 dark:text-paper/50">
                  JPEG has no transparency channel — images with an alpha channel are converted to WebP instead so
                  nothing gets flattened to a solid color.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Checkbox
                label="Resize longest edge"
                checked={resizeEnabled}
                onChange={(event) => setResizeEnabled(event.target.checked)}
              />
              <div className={resizeEnabled ? '' : 'pointer-events-none opacity-40'}>
                <Slider
                  label="Max dimension (px)"
                  min={MAX_DIMENSION_MIN}
                  max={MAX_DIMENSION_MAX}
                  step={10}
                  value={maxDimension}
                  onChange={setMaxDimension}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleRecompress} disabled={isProcessing || !isDirty} variant="secondary">
                Re-compress {items.length > 1 ? 'all' : ''}
              </Button>
              {isProcessing && (
                <span className="text-xs text-ink/50 dark:text-paper/50">Processing… {overallProgress}%</span>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          )}

          {compareItem?.resultUrl && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-semibold text-ink dark:text-paper">Preview</h2>
              <BeforeAfterSlider
                beforeUrl={compareItem.previewUrl}
                afterUrl={compareItem.resultUrl}
                alt={compareItem.file.name}
              />
            </div>
          )}

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const reduction =
                item.result && item.result.originalSize > 0
                  ? Math.round((1 - item.result.compressedSize / item.result.originalSize) * 100)
                  : null;

              return (
                <li
                  key={item.id}
                  className={`flex gap-3 rounded-md border p-3 transition-colors ${
                    compareItem?.id === item.id
                      ? 'border-accent bg-accent/5'
                      : 'border-ink/10 dark:border-paper/10'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink dark:text-paper">{item.file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                        className="shrink-0 text-xs text-ink/40 hover:text-danger dark:text-paper/40"
                      >
                        Remove
                      </button>
                    </div>

                    <p className="font-mono text-xs text-ink/60 dark:text-paper/60">
                      {formatBytes(item.file.size)}
                      {item.result && (
                        <>
                          {' → '}
                          {formatBytes(item.result.compressedSize)}
                          {reduction !== null && (
                            <span className={reduction >= 0 ? 'text-success' : 'text-danger'}>
                              {' '}
                              ({reduction >= 0 ? '-' : '+'}
                              {Math.abs(reduction)}%)
                            </span>
                          )}
                        </>
                      )}
                    </p>

                    {item.result?.note && (
                      <p className="text-xs text-accent">{item.result.note}</p>
                    )}

                    {item.status === 'compressing' && (
                      <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
                        <div
                          className="h-full rounded-full bg-accent transition-[width]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {item.status === 'error' && (
                      <p role="alert" className="text-xs text-danger">
                        {item.error}
                      </p>
                    )}

                    {item.status === 'done' && (
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className="text-xs text-accent hover:underline"
                        >
                          {compareItem?.id === item.id ? 'Comparing' : 'Compare'}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadItem(item)}
                          className="text-xs text-accent hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {completedItems.length > 0 && (
            <div className="rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-ink dark:text-paper">
              Reduced {completedItems.length} image{completedItems.length === 1 ? '' : 's'} from{' '}
              <span className="font-mono">{formatBytes(totalOriginal)}</span> to{' '}
              <span className="font-mono">{formatBytes(totalCompressed)}</span> (
              <span className="font-mono">{percentSaved}%</span> smaller)
            </div>
          )}

          {completedItems.length > 1 && (
            <Button variant="secondary" onClick={() => void handleDownloadZip()} disabled={isZipping}>
              {isZipping ? 'Zipping…' : `Download all ${completedItems.length} as ZIP`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
