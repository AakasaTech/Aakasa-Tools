'use client';

import { useState } from 'react';
import { Button, CopyButton, FileDropzone } from '@aakasa/ui';
import { GpsMapPreview } from './GpsMapPreview';
import { readMetadata, type ParsedExifData } from './utils/readExifData';
import { stripImageMetadata } from './utils/stripMetadata';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  /** undefined = still reading, null = read failed. */
  metadata: ParsedExifData | null | undefined;
  isStripping: boolean;
  strippedBlob?: Blob;
  strippedUrl?: string;
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

function strippedFileName(originalName: string): string {
  const dotIndex = originalName.lastIndexOf('.');
  const base = dotIndex === -1 ? originalName : originalName.slice(0, dotIndex);
  const ext = dotIndex === -1 ? '' : originalName.slice(dotIndex);
  return `${base}-stripped${ext}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-paper/50">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-ink/60 dark:text-paper/60">{label}</span>
      <span className="text-ink dark:text-paper">{value}</span>
    </div>
  );
}

export function ExifViewer() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  function handleFilesSelected(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) return;

    const newItems: QueueItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      metadata: undefined,
      isStripping: false,
    }));
    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      void readMetadata(item.file).then((metadata) => {
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, metadata } : it)));
      });
    });
  }

  async function stripOne(id: string, file: File) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isStripping: true } : it)));
    try {
      const blob = await stripImageMetadata(file);
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (it.strippedUrl) URL.revokeObjectURL(it.strippedUrl);
          return { ...it, isStripping: false, strippedBlob: blob, strippedUrl: URL.createObjectURL(blob) };
        }),
      );
    } catch {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isStripping: false } : it)));
    }
  }

  function handleStripAll() {
    items.forEach((item) => void stripOne(item.id, item.file));
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.strippedUrl) URL.revokeObjectURL(target.strippedUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  }

  function downloadStripped(item: QueueItem) {
    if (!item.strippedUrl) return;
    triggerDownload(item.strippedUrl, strippedFileName(item.file.name));
  }

  async function handleDownloadZip() {
    const stripped = items.filter((it): it is QueueItem & { strippedBlob: Blob } => it.strippedBlob !== undefined);
    if (stripped.length === 0) return;
    setIsZipping(true);
    try {
      const entries: ZipEntry[] = stripped.map((it) => ({ name: strippedFileName(it.file.name), blob: it.strippedBlob }));
      const zipBlob = await zipCompressedImages(entries);
      const url = URL.createObjectURL(zipBlob);
      triggerDownload(url, 'stripped-images.zip');
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  const strippedCount = items.filter((it) => it.strippedBlob).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md bg-accent/10 px-3 py-2 text-xs text-ink dark:text-paper">
        Everything here — reading metadata, showing any GPS location, and removing it — happens entirely in your browser. Nothing about
        your photos, including any location data, is ever uploaded or sent anywhere.
      </div>

      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        accept="image/*"
        label="Drop photos here, or click to browse"
        hint="JPEG is the most common carrier of EXIF data — processed entirely in your browser, never uploaded."
      />

      {items.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={handleStripAll}>
            Remove metadata from all
          </Button>
          <Button variant="secondary" onClick={handleDownloadZip} disabled={strippedCount === 0 || isZipping}>
            {isZipping ? 'Zipping…' : 'Download all as ZIP'}
          </Button>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink dark:text-paper">{item.file.name}</p>
                <p className="text-xs text-ink/50 dark:text-paper/50">{formatBytes(item.file.size)}</p>
              </div>
              <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-ink/40 hover:text-danger dark:text-paper/40">
                Remove
              </button>
            </div>

            {item.metadata === undefined && <p className="text-sm text-ink/50 dark:text-paper/50">Reading metadata…</p>}

            {item.metadata !== undefined &&
              (item.metadata === null || (!item.metadata.hasMeaningfulData && Object.keys(item.metadata.raw ?? {}).length === 0)) && (
                <p className="rounded-md bg-ink/5 px-3 py-2 text-sm text-ink/70 dark:bg-paper/10 dark:text-paper/70">
                  No EXIF data found in this file. This is normal for screenshots, already-stripped images, or images exported by many
                  editing tools.
                </p>
              )}

            {item.metadata && (item.metadata.hasMeaningfulData || Object.keys(item.metadata.raw).length > 0) && (
              <div className="flex flex-col gap-4">
                {item.metadata.gps && <GpsMapPreview gps={item.metadata.gps} />}

                {!item.metadata.hasMeaningfulData && (
                  <p className="rounded-md bg-ink/5 px-3 py-2 text-sm text-ink/70 dark:bg-paper/10 dark:text-paper/70">
                    No camera, capture, date, GPS, or software metadata found — only incidental technical fields (see the raw dump below).
                  </p>
                )}

                {item.metadata.camera && (
                  <Section title="Camera / Device">
                    {item.metadata.camera.make && <Field label="Make" value={item.metadata.camera.make} />}
                    {item.metadata.camera.model && <Field label="Model" value={item.metadata.camera.model} />}
                    {item.metadata.camera.lens && <Field label="Lens" value={item.metadata.camera.lens} />}
                  </Section>
                )}

                {item.metadata.captureSettings && (
                  <Section title="Capture settings">
                    {item.metadata.captureSettings.aperture && <Field label="Aperture" value={item.metadata.captureSettings.aperture} />}
                    {item.metadata.captureSettings.shutterSpeed && (
                      <Field label="Shutter speed" value={item.metadata.captureSettings.shutterSpeed} />
                    )}
                    {item.metadata.captureSettings.iso !== undefined && <Field label="ISO" value={item.metadata.captureSettings.iso} />}
                    {item.metadata.captureSettings.focalLength && (
                      <Field label="Focal length" value={item.metadata.captureSettings.focalLength} />
                    )}
                  </Section>
                )}

                {item.metadata.dateTaken && (
                  <Section title="Date taken">
                    <p className="text-sm text-ink dark:text-paper">{item.metadata.dateTaken}</p>
                  </Section>
                )}

                {item.metadata.software && (
                  <Section title="Software / editing history">
                    <p className="text-sm text-ink dark:text-paper">{item.metadata.software}</p>
                  </Section>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-xs font-medium text-accent">Show full raw metadata</summary>
                  <div className="mt-2 flex flex-col gap-2">
                    <CopyButton value={JSON.stringify(item.metadata.raw, null, 2)} label="Copy raw JSON" size="sm" />
                    <pre className="max-h-64 overflow-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
                      {JSON.stringify(item.metadata.raw, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-ink/5 pt-3 dark:border-paper/5">
              <Button variant="secondary" size="sm" onClick={() => stripOne(item.id, item.file)} disabled={item.isStripping}>
                {item.isStripping ? 'Removing…' : 'Remove all metadata'}
              </Button>
              {item.strippedBlob && (
                <>
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    {formatBytes(item.file.size)} → {formatBytes(item.strippedBlob.size)}
                  </span>
                  <Button variant="primary" size="sm" onClick={() => downloadStripped(item)}>
                    Download cleaned file
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
