'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, FileDropzone, Slider } from '@aakasa/ui';
import { convertImageFormat, detectHasAlpha, type TargetFormat } from './utils/convertFormat';
import { detectAvifSupport } from './utils/detectAvifSupport';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

const CONCURRENCY = 3;

const EXTENSION_BY_MIME: Record<TargetFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const FORMAT_LABELS: Record<TargetFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
};

type ItemStatus = 'pending' | 'converting' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  hasAlpha: boolean | null;
  status: ItemStatus;
  resultBlob?: Blob;
  resultUrl?: string;
  error?: string;
  /** The format/settings this item was actually last converted with — used
   * for its own display label and filename, independent of whatever the
   * format selector currently shows. Without this, switching the target
   * format after a conversion already ran would relabel an old result
   * under the new format's name while the underlying bytes stayed
   * whatever they actually were — confirmed this was a real bug (not
   * hypothetical) while testing: after converting to WebP then switching
   * the selector to JPEG without re-converting, the list showed "→ JPEG"
   * next to the WebP byte count. */
  convertedFormat?: TargetFormat;
  convertedSettingsKey?: string;
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

function outputFileName(item: QueueItem, format: TargetFormat): string {
  const dotIndex = item.file.name.lastIndexOf('.');
  const base = dotIndex === -1 ? item.file.name : item.file.name.slice(0, dotIndex);
  return `${base}.${EXTENSION_BY_MIME[format]}`;
}

function settingsKey(format: TargetFormat, qualityPercent: number, bg: string): string {
  return JSON.stringify({ format, quality: qualityPercent, background: format === 'image/jpeg' ? bg : null });
}

export function FormatConverter() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/webp');
  const [quality, setQuality] = useState(85);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [avifSupported, setAvifSupported] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    detectAvifSupport().then(setAvifSupported);
  }, []);

  const processBatch = useCallback(async (targets: { id: string; file: File }[], format: TargetFormat, qualityPercent: number, bg: string) => {
    if (targets.length === 0) return;
    setIsProcessing(true);

    const key = settingsKey(format, qualityPercent, bg);
    let cursor = 0;
    async function runOne(id: string, file: File) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'converting', error: undefined } : it)));
      try {
        const blob = await convertImageFormat(file, format, qualityPercent / 100, format === 'image/jpeg' ? bg : undefined);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
            return { ...it, status: 'done', resultBlob: blob, resultUrl: URL.createObjectURL(blob), convertedFormat: format, convertedSettingsKey: key };
          }),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, status: 'error', error: err instanceof Error ? err.message : 'Conversion failed.' } : it)),
        );
      }
    }

    async function worker() {
      while (cursor < targets.length) {
        const index = cursor;
        cursor += 1;
        const target = targets[index];
        if (target) await runOne(target.id, target.file);
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()));
    setIsProcessing(false);
  }, []);

  function handleFilesSelected(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) return;

    const newItems: QueueItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      hasAlpha: null,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      void detectHasAlpha(item.file).then((hasAlpha) => {
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, hasAlpha } : it)));
      });
    });

    void processBatch(
      newItems.map((it) => ({ id: it.id, file: it.file })),
      targetFormat,
      quality,
      backgroundColor,
    );
  }

  function handleConvertAll() {
    if (items.length === 0 || isProcessing) return;
    void processBatch(
      items.map((it) => ({ id: it.id, file: it.file })),
      targetFormat,
      quality,
      backgroundColor,
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
  }

  function downloadItem(item: QueueItem) {
    if (!item.resultUrl || !item.convertedFormat) return;
    triggerDownload(item.resultUrl, outputFileName(item, item.convertedFormat));
  }

  async function handleDownloadZip() {
    const completed = items.filter(
      (it): it is QueueItem & { resultBlob: Blob; convertedFormat: TargetFormat } =>
        it.status === 'done' && it.resultBlob !== undefined && it.convertedFormat !== undefined,
    );
    if (completed.length === 0) return;
    setIsZipping(true);
    try {
      const entries: ZipEntry[] = completed.map((it) => ({ name: outputFileName(it, it.convertedFormat), blob: it.resultBlob }));
      const zipBlob = await zipCompressedImages(entries);
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, 'converted-images.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const transparentCount = items.filter((it) => it.hasAlpha).length;
  const showTransparencyWarning = targetFormat === 'image/jpeg' && transparentCount > 0;

  const doneItems = items.filter((it): it is QueueItem & { resultBlob: Blob } => it.status === 'done' && it.resultBlob !== undefined);
  const totalOutputBytes = doneItems.reduce((sum, it) => sum + it.resultBlob.size, 0);
  const totalOriginalBytes = items.reduce((sum, it) => sum + it.file.size, 0);

  const currentSettingsKey = settingsKey(targetFormat, quality, backgroundColor);
  const hasStaleResults = items.some((it) => it.status === 'done' && it.convertedSettingsKey !== currentSettingsKey);

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        accept="image/*"
        label="Drop images here, or click to browse"
        hint="One file or many — converted entirely in your browser, never uploaded."
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Target format</h3>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FORMAT_LABELS) as TargetFormat[]).map((format) => {
            const isAvif = format === 'image/avif';
            const disabled = isAvif && avifSupported !== true;
            return (
              <Button
                key={format}
                variant={targetFormat === format ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTargetFormat(format)}
                disabled={disabled}
                title={disabled ? "AVIF encoding isn't supported in this browser" : undefined}
              >
                {FORMAT_LABELS[format]}
              </Button>
            );
          })}
        </div>
        {avifSupported === false && (
          <p className="text-xs text-ink/50 dark:text-paper/50">
            AVIF is disabled — this browser doesn&apos;t support encoding it (checked by actually attempting an AVIF export, not just a
            capability flag).
          </p>
        )}
        {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp' || targetFormat === 'image/avif') && (
          <div className="max-w-xs">
            <Slider id="quality" label="Quality" min={1} max={100} value={quality} onChange={setQuality} />
          </div>
        )}
      </div>

      {showTransparencyWarning && (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          <span>
            {transparentCount} of {items.length} image{items.length === 1 ? '' : 's'} have transparency, which JPEG doesn&apos;t support —
            transparent areas will become this color:
          </span>
          <input
            type="color"
            value={backgroundColor}
            onChange={(event) => setBackgroundColor(event.target.value)}
            className="h-7 w-7 cursor-pointer rounded border border-danger/30 bg-transparent p-0.5"
          />
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleConvertAll} disabled={isProcessing}>
              {isProcessing ? 'Converting…' : 'Convert all'}
            </Button>
            <Button variant="secondary" onClick={handleDownloadZip} disabled={doneItems.length === 0 || isZipping}>
              {isZipping ? 'Zipping…' : 'Download all as ZIP'}
            </Button>
            {doneItems.length > 0 && (
              <span className="text-xs text-ink/50 dark:text-paper/50">
                Total output size: {formatBytes(totalOutputBytes)} (originals: {formatBytes(totalOriginalBytes)})
              </span>
            )}
          </div>
          {hasStaleResults && (
            <p className="text-xs text-danger">
              Format, quality, or background color changed since these results were generated — click &ldquo;Convert all&rdquo; to update them.
            </p>
          )}

          <ul className="flex flex-col divide-y divide-ink/5 rounded-md border border-ink/10 dark:divide-paper/5 dark:border-paper/10">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink dark:text-paper">{item.file.name}</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    {item.file.type.replace('image/', '').toUpperCase()} · {formatBytes(item.file.size)}
                    {item.hasAlpha && ' · transparent'}
                    {item.status === 'done' && item.resultBlob && item.convertedFormat && (
                      <>
                        {' → '}
                        {FORMAT_LABELS[item.convertedFormat]} · {formatBytes(item.resultBlob.size)}
                        {item.convertedSettingsKey !== currentSettingsKey && ' (stale)'}
                      </>
                    )}
                    {item.status === 'converting' && ' · converting…'}
                    {item.status === 'error' && <span className="text-danger"> · {item.error}</span>}
                  </p>
                </div>
                {item.status === 'done' && (
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
