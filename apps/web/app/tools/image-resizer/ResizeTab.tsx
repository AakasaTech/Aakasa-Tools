'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox } from '@aakasa/ui';
import { RESIZE_PRESETS } from './data/resizePresets';
import { resizeToCanvas, type ExportOptions } from './utils/resizeImage';

interface ResizeTabProps {
  bitmap: ImageBitmap;
  previewUrl: string;
  format: ExportOptions;
  downloadBlob: (filename: string, blob: Blob) => void;
  clipboardSupported: boolean;
  imageCopied: boolean;
  onCopyToClipboard: (blob: Blob) => void;
}

const ASPECT_MISMATCH_TOLERANCE = 0.02;

export function ResizeTab({ bitmap, previewUrl, format, downloadBlob, clipboardSupported, imageCopied, onCopyToClipboard }: ResizeTabProps) {
  const sourceAspectRatio = bitmap.width / bitmap.height;

  const [width, setWidth] = useState(bitmap.width);
  const [height, setHeight] = useState(bitmap.height);
  const [lockAspect, setLockAspect] = useState(true);
  const [percentage, setPercentage] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setWidth(bitmap.width);
    setHeight(bitmap.height);
    setPercentage(100);
  }, [bitmap]);

  function handleWidthChange(nextWidth: number) {
    setWidth(nextWidth);
    if (lockAspect) setHeight(Math.max(1, Math.round(nextWidth / sourceAspectRatio)));
  }

  function handleHeightChange(nextHeight: number) {
    setHeight(nextHeight);
    if (lockAspect) setWidth(Math.max(1, Math.round(nextHeight * sourceAspectRatio)));
  }

  function handlePercentageChange(nextPercentage: number) {
    setPercentage(nextPercentage);
    setWidth(Math.max(1, Math.round((bitmap.width * nextPercentage) / 100)));
    setHeight(Math.max(1, Math.round((bitmap.height * nextPercentage) / 100)));
  }

  function applyPreset(preset: { width: number; height: number }) {
    setWidth(preset.width);
    setHeight(preset.height);
  }

  const currentAspectRatio = width / height;
  const aspectMismatch = Math.abs(currentAspectRatio - sourceAspectRatio) > ASPECT_MISMATCH_TOLERANCE;
  const isUpscale = width > bitmap.width || height > bitmap.height;

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const blob = await resizeToCanvas(bitmap, width, height, true, format);
      const ext = format.mimeType === 'image/png' ? 'png' : format.mimeType === 'image/webp' ? 'webp' : 'jpg';
      downloadBlob(`resized-${width}x${height}.${ext}`, blob);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    // Clipboard image writes are only reliably supported as PNG across
    // browsers, independent of whatever format Download is set to.
    const blob = await resizeToCanvas(bitmap, width, height, true, { mimeType: 'image/png' });
    onCopyToClipboard(blob);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center rounded-xl bg-ink/5 p-6 dark:bg-paper/10">
        <div
          className="max-h-80 max-w-full overflow-hidden rounded-md border border-ink/10 dark:border-paper/10"
          style={{ aspectRatio: `${width} / ${height}`, width: Math.min(400, width) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Resize preview" className="h-full w-full object-fill" />
        </div>
      </div>
      <p className="text-center text-xs text-ink/40 dark:text-paper/40">
        Preview shows the actual target shape{aspectMismatch ? ' — stretched, since the aspect ratio changed' : ''}.
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {RESIZE_PRESETS.map((preset) => (
            <Button key={preset.label} variant="secondary" size="sm" onClick={() => applyPreset(preset)}>
              {preset.label} ({preset.width}×{preset.height})
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
          Width (px)
          <input
            type="number"
            min={1}
            max={8000}
            value={width}
            onChange={(event) => handleWidthChange(Number(event.target.value))}
            className="h-9 w-24 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
          Height (px)
          <input
            type="number"
            min={1}
            max={8000}
            value={height}
            onChange={(event) => handleHeightChange(Number(event.target.value))}
            className="h-9 w-24 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
          />
        </label>
        <Checkbox label="Lock aspect ratio" checked={lockAspect} onChange={(event) => setLockAspect(event.target.checked)} />
        <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
          Or scale by %
          <input
            type="number"
            min={1}
            max={400}
            value={percentage}
            onChange={(event) => handlePercentageChange(Number(event.target.value))}
            className="h-9 w-20 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
          />
        </label>
      </div>

      {aspectMismatch && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          These dimensions don&apos;t match your image&apos;s aspect ratio ({sourceAspectRatio.toFixed(2)}:1) — the image will be stretched
          to fit rather than cropped. Switch to Crop mode instead if you want a distortion-free fit.
        </p>
      )}
      {isUpscale && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          This is larger than the source image ({bitmap.width}×{bitmap.height}) — upscaling can&apos;t add real detail, so the result may
          look soft.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Download'}
        </Button>
        {clipboardSupported && (
          <Button variant="secondary" onClick={handleCopy}>
            {imageCopied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
        )}
      </div>
    </div>
  );
}
