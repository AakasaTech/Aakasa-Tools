'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, CopyButton, FileDropzone } from '@aakasa/ui';
import { zipCompressedImages, type ZipEntry } from '../image-compressor/utils/zipFiles';
import { buildIcoFile, resizeToPngBlob, toSquareSource } from './utils/generateFavicons';
import { buildWebManifest } from './utils/generateManifest';
import { buildFaviconHtmlTags } from './utils/generateHtmlSnippet';

interface PreviewSizeInfo {
  size: number;
  label: string;
}

const PREVIEW_SIZES: PreviewSizeInfo[] = [
  { size: 16, label: '16×16 — browser tab' },
  { size: 32, label: '32×32 — taskbar / bookmarks' },
  { size: 48, label: '48×48 — inside favicon.ico' },
  { size: 180, label: '180×180 — Apple touch icon' },
  { size: 192, label: '192×192 — Android / PWA' },
  { size: 512, label: '512×512 — Android / PWA' },
];

const DISPLAY_BOX = 96;
const MIN_RECOMMENDED_DIMENSION = 512;

interface GeneratedFile {
  name: string;
  blob: Blob;
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, rgba(128,128,128,0.25) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.25) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.25) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.25) 75%)',
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
};

export function FaviconGenerator() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number } | null>(null);
  const [cropToSquare, setCropToSquare] = useState(true);
  const [icoBackground, setIcoBackground] = useState('#FFFFFF');
  const [manifestName, setManifestName] = useState('My Site');
  const [previewBlobs, setPreviewBlobs] = useState<Record<number, Blob>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [icoPreviewUrl, setIcoPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[] | null>(null);

  // A plain accumulator array, not a DOM node ref — reading `.current` at
  // cleanup time is deliberate here (it should revoke whatever object URLs
  // have piled up by unmount, not a snapshot from when the effect was set
  // up), so the exhaustive-deps warning about stale ref reads doesn't apply.
  const latestUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      latestUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Regenerate the (transparent, no ICO background) preview set whenever
  // the source image or the crop-to-square choice changes. These blobs
  // are also reused directly as the downloadable PNGs — no need to render
  // them twice.
  useEffect(() => {
    if (!bitmap) {
      setPreviewBlobs({});
      setPreviewUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
      return undefined;
    }

    let cancelled = false;
    const source = toSquareSource(bitmap, cropToSquare);

    (async () => {
      const blobs: Record<number, Blob> = {};
      for (const { size } of PREVIEW_SIZES) {
        blobs[size] = await resizeToPngBlob(source, size, null);
      }
      if (cancelled) return;

      setPreviewBlobs(blobs);
      setPreviewUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        const next: Record<number, string> = {};
        for (const [size, blob] of Object.entries(blobs)) {
          const url = URL.createObjectURL(blob);
          next[Number(size)] = url;
          latestUrlsRef.current.push(url);
        }
        return next;
      });
      setGeneratedFiles(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [bitmap, cropToSquare]);

  // The ICO-specific preview (background flattened in) updates separately
  // since it's the only thing that depends on icoBackground.
  useEffect(() => {
    if (!bitmap) {
      setIcoPreviewUrl(null);
      return undefined;
    }
    let cancelled = false;
    const source = toSquareSource(bitmap, cropToSquare);

    (async () => {
      const blob = await resizeToPngBlob(source, 32, icoBackground);
      if (cancelled) return;
      setIcoPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(blob);
        latestUrlsRef.current.push(url);
        return url;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [bitmap, cropToSquare, icoBackground]);

  async function handleFileSelected(file: File) {
    const bmp = await createImageBitmap(file);
    setBitmap(bmp);
    setSourceDims({ width: bmp.width, height: bmp.height });
    setCropToSquare(bmp.width !== bmp.height);
  }

  function getPreviewBlob(size: number): Blob {
    const blob = previewBlobs[size];
    if (!blob) throw new Error(`Missing generated preview for size ${size}`);
    return blob;
  }

  async function handleGenerate() {
    if (!bitmap || Object.keys(previewBlobs).length === 0) return;
    setIsGenerating(true);
    try {
      const source = toSquareSource(bitmap, cropToSquare);
      const [ico16, ico32, ico48] = await Promise.all([
        resizeToPngBlob(source, 16, icoBackground),
        resizeToPngBlob(source, 32, icoBackground),
        resizeToPngBlob(source, 48, icoBackground),
      ]);
      const icoBlob = await buildIcoFile([
        { size: 16, blob: ico16 },
        { size: 32, blob: ico32 },
        { size: 48, blob: ico48 },
      ]);

      const manifestJson = buildWebManifest({
        name: manifestName,
        shortName: manifestName,
        themeColor: icoBackground,
        backgroundColor: icoBackground,
      });
      const manifestBlob = new Blob([manifestJson], { type: 'application/manifest+json' });

      setGeneratedFiles([
        { name: 'favicon.ico', blob: icoBlob },
        { name: 'favicon-16x16.png', blob: getPreviewBlob(16) },
        { name: 'favicon-32x32.png', blob: getPreviewBlob(32) },
        { name: 'apple-touch-icon.png', blob: getPreviewBlob(180) },
        { name: 'android-chrome-192x192.png', blob: getPreviewBlob(192) },
        { name: 'android-chrome-512x512.png', blob: getPreviewBlob(512) },
        { name: 'site.webmanifest', blob: manifestBlob },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadZip() {
    if (!generatedFiles) return;
    const entries: ZipEntry[] = generatedFiles.map((f) => ({ name: f.name, blob: f.blob }));
    const zipBlob = await zipCompressedImages(entries);
    downloadBlob('favicons.zip', zipBlob);
  }

  const isNonSquare = sourceDims ? sourceDims.width !== sourceDims.height : false;
  const isSmall = sourceDims ? Math.min(sourceDims.width, sourceDims.height) < MIN_RECOMMENDED_DIMENSION : false;
  const htmlSnippet = buildFaviconHtmlTags();

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        onFileSelected={handleFileSelected}
        accept="image/*"
        label="Drop a source image here, or click to browse"
        hint="Square, at least 512×512, recommended for the sharpest results at every size."
      />

      {sourceDims && (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-ink/60 dark:text-paper/60">
            Source: {sourceDims.width}×{sourceDims.height}
          </p>
          {(isNonSquare || isSmall) && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {isNonSquare && 'This image isn\'t square — it will be center-cropped to a square before resizing. '}
              {isSmall && 'This image is smaller than the recommended 512×512, so the larger sizes (192×192, 512×512) will be upscaled and may look soft.'}
            </p>
          )}
          {isNonSquare && (
            <label className="flex items-center gap-2 text-xs text-ink/70 dark:text-paper/70">
              <input type="checkbox" checked={cropToSquare} onChange={(event) => setCropToSquare(event.target.checked)} className="accent-accent" />
              Center-crop to square (unchecking stretches the image to fit instead)
            </label>
          )}
        </div>
      )}

      {bitmap && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Preview at each size</h3>
          <p className="text-xs text-ink/50 dark:text-paper/50">
            Shown scaled up with no smoothing at the small sizes, so you can honestly judge legibility — a detailed logo that looks great at 512px
            often turns into a blurry blob at 16px, and that&apos;s worth seeing before you download.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {PREVIEW_SIZES.map(({ size, label }) => (
              <div key={size} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex items-center justify-center overflow-hidden rounded-md border border-ink/10 dark:border-paper/10"
                  style={{ width: DISPLAY_BOX, height: DISPLAY_BOX, ...CHECKERBOARD_STYLE }}
                >
                  {previewUrls[size] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrls[size]}
                      alt={`Preview at ${size}×${size}`}
                      width={DISPLAY_BOX}
                      height={DISPLAY_BOX}
                      style={{ imageRendering: size < DISPLAY_BOX ? 'pixelated' : 'auto' }}
                    />
                  )}
                </div>
                <span className="text-center text-[11px] leading-tight text-ink/60 dark:text-paper/60">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bitmap && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ico-background" className="text-sm text-ink/70 dark:text-paper/70">
              favicon.ico background
            </label>
            <div className="flex items-center gap-2">
              <input
                id="ico-background"
                type="color"
                value={icoBackground}
                onChange={(event) => setIcoBackground(event.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
              />
              {icoPreviewUrl && (
                <div className="flex items-center justify-center rounded border border-ink/10 dark:border-paper/10" style={{ width: 36, height: 36 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icoPreviewUrl} alt="favicon.ico preview" width={32} height={32} />
                </div>
              )}
            </div>
          </div>
          <p className="max-w-sm text-xs text-ink/50 dark:text-paper/50">
            .ico files handle transparency inconsistently across contexts, so this background is flattened in only for favicon.ico. The PNG files
            below keep transparency if your source image has it.
          </p>
        </div>
      )}

      {bitmap && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manifest-name" className="text-sm text-ink/70 dark:text-paper/70">
            Site name (for site.webmanifest)
          </label>
          <input
            id="manifest-name"
            type="text"
            value={manifestName}
            onChange={(event) => setManifestName(event.target.value)}
            className="h-9 w-64 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
          />
        </div>
      )}

      {bitmap && (
        <Button variant="primary" onClick={handleGenerate} disabled={isGenerating} className="self-start">
          {isGenerating ? 'Generating…' : 'Generate favicon set'}
        </Button>
      )}

      {generatedFiles && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink dark:text-paper">Generated files</h3>
            <Button variant="secondary" size="sm" onClick={handleDownloadZip}>
              Download all as ZIP
            </Button>
          </div>
          <ul className="flex flex-col divide-y divide-ink/5 rounded-md border border-ink/10 dark:divide-paper/5 dark:border-paper/10">
            {generatedFiles.map((file) => (
              <li key={file.name} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-ink dark:text-paper">{file.name}</span>
                <button type="button" onClick={() => downloadBlob(file.name, file.blob)} className="text-xs text-accent hover:underline">
                  Download
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink dark:text-paper">HTML for your &lt;head&gt;</h3>
              <CopyButton value={htmlSnippet} size="sm" />
            </div>
            <pre className="overflow-x-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
              {htmlSnippet}
            </pre>
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — your image is never uploaded.</span>
    </div>
  );
}
