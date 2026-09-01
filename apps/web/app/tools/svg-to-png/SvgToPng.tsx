'use client';

import { useState } from 'react';
import { Button, Checkbox, FileDropzone } from '@aakasa/ui';
import { convertSvgToRaster, loadSvgImage } from './utils/svgConvert';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const FORMAT_LABELS: Record<OutputFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
};

const EXTENSION_BY_MIME: Record<OutputFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

function baseName(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex === -1 ? name : name.slice(0, dotIndex);
}

export function SvgToPng() {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('image');
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pastedMarkup, setPastedMarkup] = useState('');

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [aspectLocked, setAspectLocked] = useState(true);

  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [quality, setQuality] = useState(90);

  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  async function loadSvg(markup: string, name: string) {
    setError(null);
    try {
      const img = await loadSvgImage(markup);
      setSvgMarkup(markup);
      setSourceName(name);
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setPreviewSrc(img.src);
    } catch (err) {
      setSvgMarkup(null);
      setPreviewSrc(null);
      setError(err instanceof Error ? err.message : 'Could not load this SVG.');
    }
  }

  function handleFileSelected(file: File) {
    void file.text().then((text) => loadSvg(text, baseName(file.name)));
  }

  function handlePasteConvert() {
    void loadSvg(pastedMarkup, 'image');
  }

  function updateWidth(next: number) {
    if (aspectLocked && naturalWidth > 0) {
      setHeight(Math.round((next / naturalWidth) * naturalHeight));
    }
    setWidth(next);
  }

  function updateHeight(next: number) {
    if (aspectLocked && naturalHeight > 0) {
      setWidth(Math.round((next / naturalHeight) * naturalWidth));
    }
    setHeight(next);
  }

  function applyMultiplier(n: number) {
    setWidth(Math.round(naturalWidth * n));
    setHeight(Math.round(naturalHeight * n));
  }

  const effectiveBackground = backgroundEnabled || format === 'image/jpeg' ? backgroundColor : undefined;

  async function handleDownload() {
    if (!svgMarkup || width <= 0 || height <= 0) return;
    setIsConverting(true);
    try {
      const blob = await convertSvgToRaster(svgMarkup, {
        width,
        height,
        format,
        backgroundColor: effectiveBackground,
        quality: format === 'image/png' ? undefined : quality / 100,
      });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${sourceName}-${width}x${height}.${EXTENSION_BY_MIME[format]}`);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not convert this SVG.');
    } finally {
      setIsConverting(false);
    }
  }

  async function handleDownloadCommonSizes() {
    if (!svgMarkup || width <= 0 || height <= 0) return;
    setIsZipping(true);
    try {
      const entries: ZipEntry[] = [];
      for (const multiplier of [1, 2, 3]) {
        const w = Math.round(width * multiplier);
        const h = Math.round(height * multiplier);
        // eslint-disable-next-line no-await-in-loop
        const blob = await convertSvgToRaster(svgMarkup, {
          width: w,
          height: h,
          format,
          backgroundColor: effectiveBackground,
          quality: format === 'image/png' ? undefined : quality / 100,
        });
        entries.push({ name: `${sourceName}@${multiplier}x.${EXTENSION_BY_MIME[format]}`, blob });
      }
      const zipBlob = await zipCompressedImages(entries);
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, `${sourceName}-sizes.zip`);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not convert this SVG.');
    } finally {
      setIsZipping(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone onFileSelected={handleFileSelected} accept=".svg,image/svg+xml" label="Drop an .svg file here, or click to browse" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="svg-markup" className="text-sm text-ink/70 dark:text-paper/70">
          Or paste SVG markup
        </label>
        <textarea
          id="svg-markup"
          value={pastedMarkup}
          onChange={(event) => setPastedMarkup(event.target.value)}
          placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; ...>...</svg>"
          rows={5}
          className="rounded-md border border-ink/15 bg-paper p-2 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
        <Button variant="secondary" size="sm" onClick={handlePasteConvert} disabled={!pastedMarkup.trim()} className="self-start">
          Load pasted markup
        </Button>
      </div>

      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {previewSrc && svgMarkup && (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink dark:text-paper">
              Preview ({naturalWidth}×{naturalHeight})
            </h3>
            <div className="flex items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-[repeating-conic-gradient(#8884_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-6 dark:border-paper/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt="SVG preview" className="max-h-72 max-w-full" />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <h3 className="text-sm font-medium text-ink dark:text-paper">Output size</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="out-width" className="text-xs text-ink/60 dark:text-paper/60">
                  Width
                </label>
                <input
                  id="out-width"
                  type="number"
                  min={1}
                  value={width}
                  onChange={(event) => updateWidth(Number(event.target.value))}
                  className="w-24 rounded-md border border-ink/15 bg-paper px-2 py-1.5 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="out-height" className="text-xs text-ink/60 dark:text-paper/60">
                  Height
                </label>
                <input
                  id="out-height"
                  type="number"
                  min={1}
                  value={height}
                  onChange={(event) => updateHeight(Number(event.target.value))}
                  className="w-24 rounded-md border border-ink/15 bg-paper px-2 py-1.5 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                />
              </div>
              <Checkbox label="Lock aspect ratio" checked={aspectLocked} onChange={(event) => setAspectLocked(event.target.checked)} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink/60 dark:text-paper/60">Quick scale:</span>
              {[1, 2, 3, 4].map((n) => (
                <Button key={n} variant="secondary" size="sm" onClick={() => applyMultiplier(n)}>
                  {n}x
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <h3 className="text-sm font-medium text-ink dark:text-paper">Format</h3>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((f) => (
                <Button key={f} variant={format === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFormat(f)}>
                  {FORMAT_LABELS[f]}
                </Button>
              ))}
            </div>
            {format !== 'image/png' && (
              <div className="max-w-xs">
                <label htmlFor="quality" className="flex items-center justify-between text-sm text-ink/70 dark:text-paper/70">
                  Quality <span className="font-mono text-ink dark:text-paper">{quality}</span>
                </label>
                <input
                  id="quality"
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-1 w-full accent-accent"
                />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Checkbox
                label="Fill background with a color"
                checked={backgroundEnabled || format === 'image/jpeg'}
                disabled={format === 'image/jpeg'}
                onChange={(event) => setBackgroundEnabled(event.target.checked)}
              />
              {(backgroundEnabled || format === 'image/jpeg') && (
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  className="h-7 w-8 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
                />
              )}
            </div>
            {format === 'image/jpeg' && (
              <p className="text-xs text-ink/50 dark:text-paper/50">JPEG has no transparency, so a background color is always applied.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleDownload} disabled={isConverting}>
              {isConverting ? 'Converting…' : `Download ${FORMAT_LABELS[format]}`}
            </Button>
            <Button variant="secondary" onClick={handleDownloadCommonSizes} disabled={isZipping}>
              {isZipping ? 'Generating…' : 'Download 1x/2x/3x as ZIP'}
            </Button>
          </div>
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — your SVG is never uploaded.</span>
    </div>
  );
}
