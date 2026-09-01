'use client';

import { useEffect, useState } from 'react';
import { Button, FileDropzone, Slider } from '@aakasa/ui';
import { ResizeTab } from './ResizeTab';
import { CropTab } from './CropTab';
import type { ExportOptions } from './utils/resizeImage';

type Mode = 'resize' | 'crop';
type FormatChoice = 'original' | 'image/png' | 'image/jpeg' | 'image/webp';

const FORMAT_LABELS: Record<FormatChoice, string> = {
  original: 'Keep original',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
};

function resolveOriginalMimeType(sourceType: string | undefined): ExportOptions['mimeType'] {
  return sourceType === 'image/png' || sourceType === 'image/webp' ? sourceType : 'image/jpeg';
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('resize');
  const [formatChoice, setFormatChoice] = useState<FormatChoice>('original');
  const [quality, setQuality] = useState(90);
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  useEffect(() => {
    setClipboardSupported(typeof window !== 'undefined' && 'ClipboardItem' in window && typeof navigator.clipboard?.write === 'function');
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileSelected(selected: File) {
    const bmp = await createImageBitmap(selected);
    setFile(selected);
    setBitmap(bmp);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  async function handleCopyToClipboard(blob: Blob) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 1500);
    } catch {
      // Clipboard API can reject (permissions, browser quirks) — no-op.
    }
  }

  const effectiveMimeType: ExportOptions['mimeType'] = formatChoice === 'original' ? resolveOriginalMimeType(file?.type) : formatChoice;

  const format: ExportOptions = { mimeType: effectiveMimeType, quality: quality / 100 };

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        onFileSelected={handleFileSelected}
        accept="image/*"
        label="Drop an image here, or click to browse"
        hint="JPG, PNG, or WebP — processed entirely in your browser, never uploaded."
      />

      {bitmap && file && previewUrl && (
        <>
          <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
            <Button variant={mode === 'resize' ? 'primary' : 'ghost'} size="sm" onClick={() => setMode('resize')} className="flex-1">
              Resize
            </Button>
            <Button variant={mode === 'crop' ? 'primary' : 'ghost'} size="sm" onClick={() => setMode('crop')} className="flex-1">
              Crop
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-ink/70 dark:text-paper/70">Export format</span>
              <div className="flex gap-1.5">
                {(Object.keys(FORMAT_LABELS) as FormatChoice[]).map((choice) => (
                  <Button key={choice} variant={formatChoice === choice ? 'primary' : 'secondary'} size="sm" onClick={() => setFormatChoice(choice)}>
                    {FORMAT_LABELS[choice]}
                  </Button>
                ))}
              </div>
            </div>
            {(effectiveMimeType === 'image/jpeg' || effectiveMimeType === 'image/webp') && (
              <div className="max-w-xs flex-1">
                <Slider id="export-quality" label="Quality" min={1} max={100} value={quality} onChange={setQuality} />
              </div>
            )}
          </div>

          {mode === 'resize' ? (
            <ResizeTab
              bitmap={bitmap}
              previewUrl={previewUrl}
              format={format}
              downloadBlob={downloadBlob}
              clipboardSupported={clipboardSupported}
              imageCopied={imageCopied}
              onCopyToClipboard={handleCopyToClipboard}
            />
          ) : (
            <CropTab
              bitmap={bitmap}
              previewUrl={previewUrl}
              format={format}
              downloadBlob={downloadBlob}
              clipboardSupported={clipboardSupported}
              imageCopied={imageCopied}
              onCopyToClipboard={handleCopyToClipboard}
            />
          )}
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — your image is never uploaded.</span>
    </div>
  );
}
