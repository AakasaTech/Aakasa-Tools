'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, FileDropzone } from '@aakasa/ui';
import { ESTIMATED_DOWNLOAD_MB, loadModel, processImageBackground, type DownloadProgress } from './utils/removeBackground';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

type ModelState = 'idle' | 'loading' | 'ready' | 'error';
type BackgroundMode = 'transparent' | 'color' | 'image';
type ItemStatus = 'queued' | 'processing' | 'done' | 'error';

const LARGE_IMAGE_THRESHOLD = 4000;

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
  status: ItemStatus;
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultBitmap?: ImageBitmap;
  error?: string;
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

function outputFileName(file: File): string {
  const dotIndex = file.name.lastIndexOf('.');
  const base = dotIndex === -1 ? file.name : file.name.slice(0, dotIndex);
  return `${base}-no-bg.png`;
}

/** Composites a background-removed (transparent) result onto whatever the
 * current background mode calls for — a flat color, a second uploaded
 * image (cover-fit, centered), or left as-is for 'transparent'. Runs at
 * both preview-render time and download time so what's downloaded always
 * matches what was last shown, not a stale cached blob. */
function compositeBackground(
  canvas: HTMLCanvasElement,
  resultBitmap: ImageBitmap,
  mode: BackgroundMode,
  color: string,
  bgBitmap: ImageBitmap | null,
) {
  canvas.width = resultBitmap.width;
  canvas.height = resultBitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mode === 'color') {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (mode === 'image' && bgBitmap) {
    const scale = Math.max(canvas.width / bgBitmap.width, canvas.height / bgBitmap.height);
    const w = bgBitmap.width * scale;
    const h = bgBitmap.height * scale;
    ctx.drawImage(bgBitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  ctx.drawImage(resultBitmap, 0, 0);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/png');
  });
}

export function BackgroundRemover() {
  const [modelState, setModelState] = useState<ModelState>('idle');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  const itemsRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const previewCanvases = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('transparent');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImageBitmap, setBackgroundImageBitmap] = useState<ImageBitmap | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  async function handleLoadModel() {
    setModelState('loading');
    setModelError(null);
    try {
      await loadModel(setDownloadProgress);
      setModelState('ready');
    } catch (err) {
      setModelState('error');
      setModelError(err instanceof Error ? err.message : 'Could not load the AI model.');
    }
  }

  const processOne = useCallback(async (id: string) => {
    const item = itemsRef.current.find((it) => it.id === id);
    if (!item) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'processing', progress: 0 } : it)));
    try {
      const blob = await processImageBackground(item.file, (progress) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress } : it)));
      });
      const resultBitmap = await createImageBitmap(blob);
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
          return { ...it, status: 'done', progress: 1, resultBlob: blob, resultUrl: URL.createObjectURL(blob), resultBitmap };
        }),
      );
    } catch (err) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'error', error: err instanceof Error ? err.message : 'Processing failed.' } : it)));
    }
  }, []);

  const runQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const next = itemsRef.current.find((it) => it.status === 'queued');
        if (!next) break;
        // eslint-disable-next-line no-await-in-loop
        await processOne(next.id);
      }
    } finally {
      processingRef.current = false;
    }
  }, [processOne]);

  function handleFilesSelected(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) return;

    const newItems: QueueItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      width: null,
      height: null,
      status: 'queued',
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      void createImageBitmap(item.file).then((bitmap) => {
        const { width, height } = bitmap;
        bitmap.close();
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, width, height } : it)));
      });
    });

    void runQueue();
  }

  function handleBackgroundImageSelected(files: File[]) {
    const file = files[0];
    if (!file) return;
    void createImageBitmap(file).then((bitmap) => {
      setBackgroundImageBitmap((prev) => {
        prev?.close();
        return bitmap;
      });
    });
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
        target.resultBitmap?.close();
      }
      previewCanvases.current.delete(id);
      return prev.filter((it) => it.id !== id);
    });
  }

  // Redraws every completed item's composited preview whenever the result
  // itself, or the chosen background treatment, changes.
  useEffect(() => {
    for (const item of items) {
      if (!item.resultBitmap) continue;
      const canvas = previewCanvases.current.get(item.id);
      if (!canvas) continue;
      compositeBackground(canvas, item.resultBitmap, backgroundMode, backgroundColor, backgroundImageBitmap);
    }
  }, [items, backgroundMode, backgroundColor, backgroundImageBitmap]);

  async function downloadItem(item: QueueItem) {
    if (!item.resultBitmap) return;
    const canvas = document.createElement('canvas');
    compositeBackground(canvas, item.resultBitmap, backgroundMode, backgroundColor, backgroundImageBitmap);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    triggerDownload(url, outputFileName(item.file));
    URL.revokeObjectURL(url);
  }

  async function handleDownloadZip() {
    const done = items.filter((it): it is QueueItem & { resultBitmap: ImageBitmap } => it.resultBitmap !== undefined);
    if (done.length === 0) return;
    setIsZipping(true);
    try {
      const entries: ZipEntry[] = [];
      for (const item of done) {
        const canvas = document.createElement('canvas');
        compositeBackground(canvas, item.resultBitmap, backgroundMode, backgroundColor, backgroundImageBitmap);
        // eslint-disable-next-line no-await-in-loop
        const blob = await canvasToBlob(canvas);
        entries.push({ name: outputFileName(item.file), blob });
      }
      const zipBlob = await zipCompressedImages(entries);
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, 'background-removed.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const doneCount = items.filter((it) => it.status === 'done').length;
  const progressPercent =
    downloadProgress && downloadProgress.totalBytes > 0 ? Math.round((downloadProgress.loadedBytes / downloadProgress.totalBytes) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      {modelState !== 'ready' && (
        <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-5 dark:border-paper/10">
          {modelState === 'idle' && (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                This tool uses an AI model that runs entirely in your browser to remove backgrounds — no photo is ever uploaded to a server.
                The model itself needs to be downloaded once, the first time you use it (roughly <strong>{ESTIMATED_DOWNLOAD_MB} MB</strong>).
                It&apos;s cached for the rest of this visit after that.
              </p>
              <Button variant="primary" onClick={handleLoadModel} className="self-start">
                Load AI model (~{ESTIMATED_DOWNLOAD_MB} MB)
              </Button>
            </>
          )}

          {modelState === 'loading' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink dark:text-paper">Loading AI model…</p>
              {progressPercent !== null && downloadProgress ? (
                <>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
                    <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    {formatBytes(downloadProgress.loadedBytes)} of {formatBytes(downloadProgress.totalBytes)} ({progressPercent}%)
                  </span>
                </>
              ) : (
                <span className="text-xs text-ink/50 dark:text-paper/50">Starting download — this may take a moment on a slower connection.</span>
              )}
            </div>
          )}

          {modelState === 'error' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-danger">{modelError ?? 'Could not load the AI model.'}</p>
              <Button variant="secondary" onClick={handleLoadModel} className="self-start">
                Try again
              </Button>
            </div>
          )}
        </div>
      )}

      {modelState === 'ready' && (
        <>
          <FileDropzone
            multiple
            onFilesSelected={handleFilesSelected}
            accept="image/*"
            label="Drop photos here, or click to browse"
            hint="One file or many — processed one at a time, entirely in your browser."
          />

          <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <h3 className="text-sm font-medium text-ink dark:text-paper">Background</h3>
            <div className="flex flex-wrap gap-1.5">
              <Button variant={backgroundMode === 'transparent' ? 'primary' : 'secondary'} size="sm" onClick={() => setBackgroundMode('transparent')}>
                Transparent
              </Button>
              <Button variant={backgroundMode === 'color' ? 'primary' : 'secondary'} size="sm" onClick={() => setBackgroundMode('color')}>
                Solid color
              </Button>
              <Button variant={backgroundMode === 'image' ? 'primary' : 'secondary'} size="sm" onClick={() => setBackgroundMode('image')}>
                Another image
              </Button>
            </div>
            {backgroundMode === 'color' && (
              <input
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                className="h-9 w-24 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
              />
            )}
            {backgroundMode === 'image' && (
              <FileDropzone
                onFilesSelected={handleBackgroundImageSelected}
                accept="image/*"
                label={backgroundImageBitmap ? 'Background image set — click to replace' : 'Drop a background image here, or click to browse'}
              />
            )}
          </div>

          {items.length > 1 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={handleDownloadZip} disabled={doneCount === 0 || isZipping}>
                {isZipping ? 'Zipping…' : 'Download all as ZIP'}
              </Button>
              <span className="text-xs text-ink/50 dark:text-paper/50">
                {doneCount} of {items.length} done
              </span>
            </div>
          )}

          <ul className="flex flex-col gap-4">
            {items.map((item) => {
              const isLarge = item.width !== null && item.height !== null && Math.max(item.width, item.height) > LARGE_IMAGE_THRESHOLD;
              return (
                <li key={item.id} className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink dark:text-paper">{item.file.name}</p>
                      <p className="text-xs text-ink/50 dark:text-paper/50">
                        {formatBytes(item.file.size)}
                        {item.width && item.height && ` · ${item.width}×${item.height}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-ink/40 hover:text-danger dark:text-paper/40">
                      Remove
                    </button>
                  </div>

                  {isLarge && (
                    <p className="text-xs text-danger">
                      This image is larger than {LARGE_IMAGE_THRESHOLD}px on its longest edge — processing may be slower and use more memory.
                    </p>
                  )}

                  {item.status === 'queued' && <p className="text-sm text-ink/50 dark:text-paper/50">Waiting…</p>}
                  {item.status === 'processing' && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm text-ink dark:text-paper">Removing background…</p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
                        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {item.status === 'error' && <p className="text-sm text-danger">{item.error}</p>}

                  {item.status === 'done' && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-ink/50 dark:text-paper/50">Original</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.previewUrl} alt="Original" className="w-full rounded-md border border-ink/10 object-contain dark:border-paper/10" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-ink/50 dark:text-paper/50">Result</span>
                          <div className="overflow-hidden rounded-md border border-ink/10 bg-[repeating-conic-gradient(#8884_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:border-paper/10">
                            <canvas
                              ref={(el) => {
                                if (el) previewCanvases.current.set(item.id, el);
                                else previewCanvases.current.delete(item.id);
                              }}
                              className="block h-auto w-full"
                            />
                          </div>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => downloadItem(item)} className="self-start">
                        Download
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Your photos are never uploaded — the AI model downloads once to your browser, and every image is processed locally after that.
      </span>
    </div>
  );
}
