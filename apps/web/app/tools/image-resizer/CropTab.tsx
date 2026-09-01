'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@aakasa/ui';
import { CropOverlay } from './CropOverlay';
import { initialCropRect, type CropRect } from './utils/cropMath';
import { cropToCanvas } from './utils/cropImage';
import type { ExportOptions } from './utils/resizeImage';

interface CropTabProps {
  bitmap: ImageBitmap;
  previewUrl: string;
  format: ExportOptions;
  downloadBlob: (filename: string, blob: Blob) => void;
  clipboardSupported: boolean;
  imageCopied: boolean;
  onCopyToClipboard: (blob: Blob) => void;
}

interface AspectOption {
  label: string;
  ratio: number | null;
}

const ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
];

const MAX_DISPLAY_WIDTH = 480;
const MAX_PREVIEW_SIZE = 220;

export function CropTab({ bitmap, previewUrl, format, downloadBlob, clipboardSupported, imageCopied, onCopyToClipboard }: CropTabProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<CropRect>(() => initialCropRect({ width: bitmap.width, height: bitmap.height }, null));
  const [isGenerating, setIsGenerating] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setCropRect(initialCropRect({ width: bitmap.width, height: bitmap.height }, null));
    setAspectRatio(null);
  }, [bitmap]);

  function handleAspectChange(ratio: number | null) {
    setAspectRatio(ratio);
    setCropRect(initialCropRect({ width: bitmap.width, height: bitmap.height }, ratio));
  }

  const displayScale = Math.min(1, MAX_DISPLAY_WIDTH / bitmap.width);
  const displayWidth = Math.round(bitmap.width * displayScale);
  const displayHeight = Math.round(bitmap.height * displayScale);

  // Live crop preview — drawn directly (no Blob encoding) so it can update
  // on every drag frame cheaply.
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const previewScale = Math.min(1, MAX_PREVIEW_SIZE / cropRect.width, MAX_PREVIEW_SIZE / cropRect.height);
    const previewWidth = Math.max(1, Math.round(cropRect.width * previewScale));
    const previewHeight = Math.max(1, Math.round(cropRect.height * previewScale));
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    ctx.clearRect(0, 0, previewWidth, previewHeight);
    ctx.drawImage(bitmap, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, previewWidth, previewHeight);
  }, [bitmap, cropRect]);

  function updateNumericField(patch: Partial<CropRect>) {
    setCropRect((prev) => {
      const next = { ...prev, ...patch };
      next.x = Math.max(0, Math.min(bitmap.width - next.width, next.x));
      next.y = Math.max(0, Math.min(bitmap.height - next.height, next.y));
      next.width = Math.max(10, Math.min(bitmap.width - next.x, next.width));
      next.height = Math.max(10, Math.min(bitmap.height - next.y, next.height));
      return next;
    });
  }

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const blob = await cropToCanvas(bitmap, cropRect, format);
      const ext = format.mimeType === 'image/png' ? 'png' : format.mimeType === 'image/webp' ? 'webp' : 'jpg';
      downloadBlob(`cropped-${Math.round(cropRect.width)}x${Math.round(cropRect.height)}.${ext}`, blob);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    const blob = await cropToCanvas(bitmap, cropRect, { mimeType: 'image/png' });
    onCopyToClipboard(blob);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Crop aspect ratio</h3>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant={aspectRatio === option.ratio ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleAspectChange(option.ratio)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center overflow-auto rounded-xl bg-ink/5 p-4 dark:bg-paper/10">
          <div className="relative" style={{ width: displayWidth, height: displayHeight }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Source" className="absolute left-0 top-0 h-full w-full" draggable={false} />
            <CropOverlay
              imageWidth={bitmap.width}
              imageHeight={bitmap.height}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              cropRect={cropRect}
              onChange={setCropRect}
              aspectRatio={aspectRatio}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink dark:text-paper">Live preview</h3>
            <canvas ref={previewCanvasRef} className="rounded-md border border-ink/10 dark:border-paper/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
              X
              <input
                type="number"
                value={Math.round(cropRect.x)}
                onChange={(event) => updateNumericField({ x: Number(event.target.value) })}
                className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
              Y
              <input
                type="number"
                value={Math.round(cropRect.y)}
                onChange={(event) => updateNumericField({ y: Number(event.target.value) })}
                className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
              Width
              <input
                type="number"
                value={Math.round(cropRect.width)}
                onChange={(event) => updateNumericField({ width: Number(event.target.value) })}
                className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
              Height
              <input
                type="number"
                value={Math.round(cropRect.height)}
                onChange={(event) => updateNumericField({ height: Number(event.target.value) })}
                className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
            </label>
          </div>

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
      </div>
    </div>
  );
}
