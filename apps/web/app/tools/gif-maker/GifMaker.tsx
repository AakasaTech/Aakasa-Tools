'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import { Button, Checkbox, FileDropzone, Slider } from '@aakasa/ui';
import { encodeGifFromFrames } from './utils/encodeGif';
import { computeTargetDimensions, normalizeFrames, type DimensionStrategy, type SourceFrame } from './utils/normalizeFrames';

const LARGE_FRAME_COUNT_THRESHOLD = 50;
const LARGE_DIMENSION_THRESHOLD = 1600;

interface FrameItem {
  id: string;
  file: File;
  previewUrl: string;
  bitmap: ImageBitmap | null;
  /** undefined = use the global per-frame duration. */
  delayOverride?: number;
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

export function GifMaker() {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [globalDelay, setGlobalDelay] = useState(100);
  const [dimensionStrategy, setDimensionStrategy] = useState<DimensionStrategy>('first');
  const [customWidth, setCustomWidth] = useState(480);
  const [customHeight, setCustomHeight] = useState(360);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [loopForever, setLoopForever] = useState(true);
  const [quality, setQuality] = useState(10);
  const [dither, setDither] = useState(false);

  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dragIndexRef = useRef<number | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function handleFilesSelected(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) return;

    const newItems: FrameItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      bitmap: null,
    }));
    setFrames((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      void createImageBitmap(item.file).then((bitmap) => {
        setFrames((prev) => prev.map((it) => (it.id === item.id ? { ...it, bitmap } : it)));
      });
    });
  }

  function removeFrame(id: string) {
    setFrames((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        target.bitmap?.close();
      }
      return prev.filter((it) => it.id !== id);
    });
  }

  function updateFrameDelay(id: string, delay: number | undefined) {
    setFrames((prev) => prev.map((it) => (it.id === id ? { ...it, delayOverride: delay } : it)));
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(event: ReactDragEvent<HTMLLIElement>) {
    event.preventDefault();
  }

  function handleDrop(event: ReactDragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;
    setFrames((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(index, 0, moved);
      return next;
    });
  }

  const sourceFrames: SourceFrame[] = useMemo(
    () =>
      frames
        .filter((f): f is FrameItem & { bitmap: ImageBitmap } => f.bitmap !== null)
        .map((f) => ({ bitmap: f.bitmap, delay: f.delayOverride ?? globalDelay })),
    [frames, globalDelay],
  );

  const customDimensions = dimensionStrategy === 'custom' ? { width: customWidth, height: customHeight } : undefined;
  const targetDimensions = useMemo(
    () => computeTargetDimensions(sourceFrames, dimensionStrategy, customDimensions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceFrames, dimensionStrategy, customWidth, customHeight],
  );

  const normalizedPreview = useMemo(
    () => normalizeFrames(sourceFrames, dimensionStrategy, backgroundColor, customDimensions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceFrames, dimensionStrategy, backgroundColor, customWidth, customHeight],
  );

  // Live preview: a simple canvas animation loop cycling through the same
  // normalized frames/timings that will be encoded, so what's previewed
  // matches the eventual output rather than an approximation of it.
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || normalizedPreview.length === 0) return;

    let cancelled = false;
    let timeoutId: number;
    let index = 0;

    function showFrame(i: number) {
      const frame = normalizedPreview[i];
      if (!canvas || !frame) return;
      canvas.width = frame.canvas.width;
      canvas.height = frame.canvas.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(frame.canvas, 0, 0);
    }

    function tick() {
      if (cancelled) return;
      showFrame(index);
      const delay = normalizedPreview[index]?.delay || 100;
      timeoutId = window.setTimeout(() => {
        index += 1;
        if (index >= normalizedPreview.length) {
          if (!loopForever) {
            cancelled = true;
            return;
          }
          index = 0;
        }
        tick();
      }, delay);
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [normalizedPreview, loopForever]);

  async function handleEncode() {
    if (sourceFrames.length === 0 || isEncoding) return;
    setIsEncoding(true);
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const encodeFrames = normalizeFrames(sourceFrames, dimensionStrategy, backgroundColor, customDimensions);
      const blob = await encodeGifFromFrames(
        encodeFrames,
        {
          width: targetDimensions.width,
          height: targetDimensions.height,
          quality,
          repeat: loopForever ? 0 : -1,
          dither,
        },
        setProgress,
      );
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the GIF.');
    } finally {
      setIsEncoding(false);
    }
  }

  function handleDownload() {
    if (!resultUrl) return;
    triggerDownload(resultUrl, 'animation.gif');
  }

  function handleClearAll() {
    frames.forEach((f) => {
      URL.revokeObjectURL(f.previewUrl);
      f.bitmap?.close();
    });
    setFrames([]);
    setResultBlob(null);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const showLargeWarning =
    frames.length > LARGE_FRAME_COUNT_THRESHOLD || sourceFrames.some((f) => f.bitmap.width > LARGE_DIMENSION_THRESHOLD || f.bitmap.height > LARGE_DIMENSION_THRESHOLD);

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        accept="image/*"
        label="Drop images here, or click to browse"
        hint="Add them in any order — you can drag to reorder below. Processed entirely in your browser, never uploaded."
      />

      {frames.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink dark:text-paper">Frames ({frames.length}) — drag to reorder</h3>
            <button type="button" onClick={handleClearAll} className="text-xs text-ink/40 hover:text-danger dark:text-paper/40">
              Clear all
            </button>
          </div>
          <ul className="flex flex-wrap gap-3">
            {frames.map((frame, index) => (
              <li
                key={frame.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, index)}
                className="flex w-28 cursor-move flex-col gap-1 rounded-md border border-ink/10 p-2 dark:border-paper/10"
              >
                <span className="text-center text-[10px] text-ink/40 dark:text-paper/40">#{index + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frame.previewUrl} alt="" className="h-16 w-full rounded object-cover" />
                <input
                  type="number"
                  min={10}
                  placeholder={`${globalDelay}ms`}
                  value={frame.delayOverride ?? ''}
                  onChange={(event) => updateFrameDelay(frame.id, event.target.value ? Number(event.target.value) : undefined)}
                  className="w-full rounded border border-ink/15 bg-paper px-1 py-0.5 text-center text-[11px] text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                />
                <button type="button" onClick={() => removeFrame(frame.id)} className="text-[10px] text-ink/40 hover:text-danger dark:text-paper/40">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {normalizedPreview.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Live preview</h3>
          <div className="flex items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-[repeating-conic-gradient(#8884_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-3 dark:border-paper/10">
            <canvas ref={previewCanvasRef} className="max-h-64 max-w-full" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Timing</h3>
        <div className="max-w-xs">
          <Slider id="global-delay" label="Duration per frame (ms)" min={20} max={2000} step={10} value={globalDelay} onChange={setGlobalDelay} />
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Applies to every frame that doesn&apos;t have its own duration set (the box under each thumbnail overrides it individually).
        </p>
        <Checkbox label="Loop forever" checked={loopForever} onChange={(event) => setLoopForever(event.target.checked)} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Output dimensions</h3>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={dimensionStrategy === 'first' ? 'primary' : 'secondary'} size="sm" onClick={() => setDimensionStrategy('first')}>
            Match first frame
          </Button>
          <Button variant={dimensionStrategy === 'largest' ? 'primary' : 'secondary'} size="sm" onClick={() => setDimensionStrategy('largest')}>
            Match largest frame
          </Button>
          <Button variant={dimensionStrategy === 'custom' ? 'primary' : 'secondary'} size="sm" onClick={() => setDimensionStrategy('custom')}>
            Custom size
          </Button>
        </div>
        {dimensionStrategy === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={customWidth}
              onChange={(event) => setCustomWidth(Number(event.target.value))}
              className="w-20 rounded-md border border-ink/15 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
            <span className="text-ink/50 dark:text-paper/50">×</span>
            <input
              type="number"
              min={1}
              value={customHeight}
              onChange={(event) => setCustomHeight(Number(event.target.value))}
              className="w-20 rounded-md border border-ink/15 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </div>
        )}
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Output will be {targetDimensions.width}×{targetDimensions.height}px. Frames with a different aspect ratio are scaled to fit and
          letterboxed — never stretched — with the color below filling the extra space.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/60 dark:text-paper/60">Letterbox color</span>
          <input
            type="color"
            value={backgroundColor}
            onChange={(event) => setBackgroundColor(event.target.value)}
            className="h-7 w-8 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Encoding quality</h3>
        <div className="max-w-xs">
          <Slider id="quality" label="Sample interval (lower = better, slower)" min={1} max={30} value={quality} onChange={setQuality} />
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          GIF always uses up to 256 colors — this controls how carefully those colors are chosen from your frames, not the color count itself.
          Lower values sample more pixels for a more accurate palette but take longer to encode.
        </p>
        <Checkbox label="Dithering (reduces visible color banding on gradients, at the cost of a slightly noisier look)" checked={dither} onChange={(event) => setDither(event.target.checked)} />
      </div>

      {showLargeWarning && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          A lot of frames and/or large image dimensions — encoding may take a while.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => void handleEncode()} disabled={sourceFrames.length === 0 || isEncoding}>
          {isEncoding ? `Encoding… ${progress}%` : 'Generate GIF'}
        </Button>
        {resultBlob && (
          <>
            <Button variant="secondary" onClick={handleDownload}>
              Download GIF
            </Button>
            <span className="text-xs text-ink/50 dark:text-paper/50">{formatBytes(resultBlob.size)}</span>
          </>
        )}
      </div>

      {isEncoding && (
        <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {resultUrl && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Result</h3>
          <div className="flex items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-[repeating-conic-gradient(#8884_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-3 dark:border-paper/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Generated GIF" className="max-h-64 max-w-full" />
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — your images are never uploaded.</span>
    </div>
  );
}
