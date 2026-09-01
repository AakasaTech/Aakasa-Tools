'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getContrastRatio } from '@aakasa/color-utils';
import { Button, Checkbox } from '@aakasa/ui';
import { renderPlaceholderToCanvas, type BackgroundMode, type PatternType, type TextPosition } from './utils/renderPlaceholder';

type ExportFormat = 'png' | 'jpeg';

interface SizePreset {
  label: string;
  width: number;
  height: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { label: '1:1 Square', width: 800, height: 800 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '4:3', width: 1024, height: 768 },
  { label: 'OG Image', width: 1200, height: 630 },
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
];

const TEXT_POSITIONS: { value: TextPosition; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
];

const MAX_PREVIEW_WIDTH = 480;

export function PlaceholderImageGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('solid');
  const [backgroundColor, setBackgroundColor] = useState('#CBD5E1');
  const [backgroundColor2, setBackgroundColor2] = useState('#64748B');
  const [pattern, setPattern] = useState<PatternType>('diagonal-stripes');
  const [transparentBackground, setTransparentBackground] = useState(false);

  const [customText, setCustomText] = useState('');
  const [autoFontSize, setAutoFontSize] = useState(true);
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#334155');
  const [textPosition, setTextPosition] = useState<TextPosition>('center');

  const [format, setFormat] = useState<ExportFormat>('png');
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  useEffect(() => {
    setClipboardSupported(typeof window !== 'undefined' && 'ClipboardItem' in window && typeof navigator.clipboard?.write === 'function');
  }, []);

  const effectiveText = customText.trim() || `${width} × ${height}`;

  const options = useMemo(
    () => ({
      width,
      height,
      backgroundMode,
      backgroundColor,
      backgroundColor2,
      pattern,
      transparentBackground,
      text: effectiveText,
      autoFontSize,
      fontSize,
      textColor,
      textPosition,
    }),
    [width, height, backgroundMode, backgroundColor, backgroundColor2, pattern, transparentBackground, effectiveText, autoFontSize, fontSize, textColor, textPosition],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderPlaceholderToCanvas(canvas, options);
  }, [options]);

  const contrastRatio = transparentBackground || backgroundMode !== 'solid' ? null : getContrastRatio(textColor, backgroundColor);
  const lowContrast = contrastRatio !== null && contrastRatio < 3;

  function applyPreset(preset: SizePreset) {
    setWidth(preset.width);
    setHeight(preset.height);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `placeholder-${width}x${height}.${format === 'png' ? 'png' : 'jpg'}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      mime,
      format === 'jpeg' ? 0.92 : undefined,
    );
  }

  function handleCopyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Clipboard image writes are reliably supported as PNG across browsers
    // regardless of the export Format selector above — that selector only
    // controls the downloaded file.
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 1500);
      } catch {
        // Clipboard API can reject (permissions, browser quirks) — no-op.
      }
    }, 'image/png');
  }

  const previewScale = Math.min(1, MAX_PREVIEW_WIDTH / width);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center overflow-auto rounded-xl border border-ink/10 bg-ink/5 p-6 dark:border-paper/10 dark:bg-paper/10">
        <canvas
          ref={canvasRef}
          style={{
            width: Math.round(width * previewScale),
            height: Math.round(height * previewScale),
            backgroundImage:
              'linear-gradient(45deg, rgba(128,128,128,0.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.2) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.2) 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
          className="rounded-md border border-ink/10 dark:border-paper/10"
        />
      </div>
      <p className="text-center text-xs text-ink/40 dark:text-paper/40">
        Preview shown at {Math.round(previewScale * 100)}% — the downloaded file is the full {width}×{height}px.
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZE_PRESETS.map((preset) => (
            <Button key={preset.label} variant="secondary" size="sm" onClick={() => applyPreset(preset)}>
              {preset.label} ({preset.width}×{preset.height})
            </Button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
            Width
            <input
              type="number"
              min={16}
              max={4000}
              value={width}
              onChange={(event) => setWidth(Math.max(16, Math.min(4000, Number(event.target.value))))}
              className="h-9 w-24 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
            Height
            <input
              type="number"
              min={16}
              max={4000}
              value={height}
              onChange={(event) => setHeight(Math.max(16, Math.min(4000, Number(event.target.value))))}
              className="h-9 w-24 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Background</h3>
        <div className="flex gap-1.5">
          {(['solid', 'gradient', 'pattern'] as BackgroundMode[]).map((mode) => (
            <Button key={mode} variant={backgroundMode === mode ? 'primary' : 'secondary'} size="sm" onClick={() => setBackgroundMode(mode)}>
              {mode === 'solid' ? 'Solid' : mode === 'gradient' ? 'Gradient' : 'Pattern'}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            {backgroundMode === 'gradient' ? 'Color 1' : 'Color'}
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
            />
          </label>
          {backgroundMode === 'gradient' && (
            <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
              Color 2
              <input
                type="color"
                value={backgroundColor2}
                onChange={(event) => setBackgroundColor2(event.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
              />
            </label>
          )}
          {backgroundMode === 'pattern' && (
            <div className="flex gap-1.5">
              <Button variant={pattern === 'diagonal-stripes' ? 'primary' : 'secondary'} size="sm" onClick={() => setPattern('diagonal-stripes')}>
                Diagonal stripes
              </Button>
              <Button variant={pattern === 'checkerboard' ? 'primary' : 'secondary'} size="sm" onClick={() => setPattern('checkerboard')}>
                Checkerboard
              </Button>
            </div>
          )}
          <Checkbox
            label="Transparent (PNG only)"
            checked={transparentBackground}
            onChange={(event) => setTransparentBackground(event.target.checked)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Text</h3>
        <input
          type="text"
          value={customText}
          onChange={(event) => setCustomText(event.target.value)}
          placeholder={`${width} × ${height}`}
          className="h-9 w-full max-w-sm rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
        />
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Color
            <input
              type="color"
              value={textColor}
              onChange={(event) => setTextColor(event.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Position
            <select
              value={textPosition}
              onChange={(event) => setTextPosition(event.target.value as TextPosition)}
              className="h-9 rounded-md border border-ink/10 bg-paper px-2 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
            >
              {TEXT_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </label>
          <Checkbox label="Auto size" checked={autoFontSize} onChange={(event) => setAutoFontSize(event.target.checked)} />
          {!autoFontSize && (
            <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
              Font size
              <input
                type="number"
                min={8}
                max={400}
                value={fontSize}
                onChange={(event) => setFontSize(Math.max(8, Number(event.target.value)))}
                className="h-9 w-20 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
            </label>
          )}
        </div>
        {lowContrast && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            Low contrast ({contrastRatio?.toFixed(2)}:1) between text and background — the text may be hard to read.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <Button variant={format === 'png' ? 'primary' : 'secondary'} size="sm" onClick={() => setFormat('png')}>
            PNG
          </Button>
          <Button variant={format === 'jpeg' ? 'primary' : 'secondary'} size="sm" onClick={() => setFormat('jpeg')}>
            JPEG
          </Button>
        </div>
        <Button variant="primary" onClick={handleDownload}>
          Download
        </Button>
        {clipboardSupported && (
          <Button variant="secondary" onClick={handleCopyImage}>
            {imageCopied ? 'Copied!' : 'Copy image to clipboard'}
          </Button>
        )}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}
