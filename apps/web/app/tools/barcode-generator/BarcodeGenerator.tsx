'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, CopyButton, Slider } from '@aakasa/ui';
import { FORMAT_INFO, generateBarcodeBlob, generateBarcodeDataUrl, generateBarcodeSvg, type BarcodeFormat, type BarcodeRenderOptions } from './utils/generateBarcode';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

const FORMATS = Object.keys(FORMAT_INFO) as BarcodeFormat[];
const DEBOUNCE_MS = 200;

interface BatchResult {
  line: number;
  value: string;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

function sanitizeFileName(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40);
  return cleaned || 'barcode';
}

export function BarcodeGenerator() {
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [value, setValue] = useState(FORMAT_INFO.CODE128.sample);
  const [displayValue, setDisplayValue] = useState(true);
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(100);
  const [margin, setMargin] = useState(10);

  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  const [batchText, setBatchText] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    setClipboardSupported(typeof window !== 'undefined' && 'ClipboardItem' in window && typeof navigator.clipboard?.write === 'function');
  }, []);

  const renderOptions: BarcodeRenderOptions = { displayValue, width: barWidth, height: barHeight, margin };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!value.trim()) {
        setDataUrl(null);
        setError(null);
        return;
      }
      const result = generateBarcodeDataUrl(value, format, renderOptions);
      if (result.error) {
        setDataUrl(null);
        setError(result.error);
      } else {
        setDataUrl(result.dataUrl);
        setError(null);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format, displayValue, barWidth, barHeight, margin]);

  function handleFormatChange(next: BarcodeFormat) {
    setFormat(next);
  }

  function handleUseSample() {
    setValue(FORMAT_INFO[format].sample);
  }

  function handleDownloadPng() {
    if (!dataUrl) return;
    triggerDownload(dataUrl, `${sanitizeFileName(value)}.png`);
  }

  function handleDownloadSvg() {
    const result = generateBarcodeSvg(value, format, renderOptions);
    if (result.error || !result.svg) {
      setError(result.error ?? 'Could not generate SVG.');
      return;
    }
    const blob = new Blob([result.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${sanitizeFileName(value)}.svg`);
    URL.revokeObjectURL(url);
  }

  async function handleCopyImage() {
    if (!dataUrl) return;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 1500);
    } catch {
      // Clipboard API can reject (permissions, browser quirks) — no-op.
    }
  }

  async function handleGenerateBatch() {
    const lines = batchText
      .split('\n')
      .map((line, index) => ({ line: index + 1, value: line.trim() }))
      .filter((entry) => entry.value.length > 0);
    if (lines.length === 0) return;

    setIsBatchGenerating(true);
    try {
      const results: BatchResult[] = [];
      for (const { line, value: lineValue } of lines) {
        // eslint-disable-next-line no-await-in-loop
        const { blob, error: blobError } = await generateBarcodeBlob(lineValue, format, renderOptions);
        if (blobError || !blob) {
          results.push({ line, value: lineValue, error: blobError ?? 'Could not generate this barcode.' });
        } else {
          results.push({ line, value: lineValue, dataUrl: URL.createObjectURL(blob), blob });
        }
      }
      setBatchResults(results);
    } finally {
      setIsBatchGenerating(false);
    }
  }

  async function handleDownloadBatchZip() {
    if (!batchResults) return;
    const succeeded = batchResults.filter((r): r is BatchResult & { blob: Blob } => r.blob !== undefined);
    if (succeeded.length === 0) return;
    setIsZipping(true);
    try {
      const entries: ZipEntry[] = succeeded.map((r) => ({ name: `${r.line}-${sanitizeFileName(r.value)}.png`, blob: r.blob }));
      const zipBlob = await zipCompressedImages(entries);
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, 'barcodes.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const batchFailureCount = batchResults ? batchResults.filter((r) => r.error).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Format</h3>
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map((f) => (
            <Button key={f} variant={format === f ? 'primary' : 'secondary'} size="sm" onClick={() => handleFormatChange(f)}>
              {FORMAT_INFO[f].label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">{FORMAT_INFO[format].guidance}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="barcode-value" className="text-sm text-ink/70 dark:text-paper/70">
          Value
        </label>
        <div className="flex gap-2">
          <input
            id="barcode-value"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="flex-1 rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          <Button variant="secondary" size="sm" onClick={handleUseSample}>
            Use sample
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Preview</h3>
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-ink/10 bg-white p-4 dark:border-paper/10">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="Generated barcode" className="max-w-full" />
          ) : (
            <span className="text-sm text-ink/40 dark:text-paper/40">{error ? 'Fix the value above to see a preview.' : 'Enter a value to generate a barcode.'}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Display options</h3>
        <Checkbox label="Show human-readable text" checked={displayValue} onChange={(event) => setDisplayValue(event.target.checked)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Slider id="bar-width" label="Bar width" min={1} max={5} value={barWidth} onChange={setBarWidth} />
          <Slider id="bar-height" label="Bar height" min={30} max={200} value={barHeight} onChange={setBarHeight} />
          <Slider id="margin" label="Margin" min={0} max={40} value={margin} onChange={setMargin} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={handleDownloadPng} disabled={!dataUrl}>
          Download PNG
        </Button>
        <Button variant="secondary" onClick={handleDownloadSvg} disabled={!value.trim()}>
          Download SVG
        </Button>
        {clipboardSupported && (
          <Button variant="secondary" onClick={() => void handleCopyImage()} disabled={!dataUrl}>
            {imageCopied ? 'Copied' : 'Copy image'}
          </Button>
        )}
        {dataUrl && <CopyButton value={value} label="Copy value" size="sm" />}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Batch generation</h3>
        <p className="text-xs text-ink/50 dark:text-paper/50">One value per line, generated using the format and display options above.</p>
        <textarea
          value={batchText}
          onChange={(event) => setBatchText(event.target.value)}
          placeholder={`${FORMAT_INFO[format].sample}\n${FORMAT_INFO[format].sample}`}
          rows={5}
          className="rounded-md border border-ink/15 bg-paper p-2 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => void handleGenerateBatch()} disabled={!batchText.trim() || isBatchGenerating}>
            {isBatchGenerating ? 'Generating…' : 'Generate batch'}
          </Button>
          {batchResults && (
            <Button variant="secondary" size="sm" onClick={() => void handleDownloadBatchZip()} disabled={isZipping || batchResults.every((r) => r.error)}>
              {isZipping ? 'Zipping…' : 'Download all as ZIP'}
            </Button>
          )}
        </div>

        {batchResults && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-ink/60 dark:text-paper/60">
              {batchResults.length - batchFailureCount} of {batchResults.length} generated
              {batchFailureCount > 0 && ` — ${batchFailureCount} failed`}
            </p>
            <ul className="flex flex-col divide-y divide-ink/5 rounded-md border border-ink/10 dark:divide-paper/5 dark:border-paper/10">
              {batchResults.map((result) => (
                <li key={result.line} className="flex items-center gap-3 p-2">
                  <span className="w-10 shrink-0 text-xs text-ink/40 dark:text-paper/40">Line {result.line}</span>
                  {result.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.dataUrl} alt="" className="h-10 rounded bg-white" />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-xs text-danger">
                      &ldquo;{result.value}&rdquo; — {result.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — the values you enter are never uploaded.</span>
    </div>
  );
}
