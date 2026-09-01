'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, Checkbox, Combobox, FileDropzone, Slider, type ComboboxOption } from '@aakasa/ui';
import { getTextBoxBounds, renderMemeToCanvas, type TextBoxConfig } from './utils/renderMeme';
import { FONT_CATALOG, fallbackFor } from '../font-pairing/utils/fontCatalog';
import { loadGoogleFont } from '../font-pairing/utils/loadGoogleFont';

const DEFAULT_FONT = 'Anton';
const DEFAULT_MAX_WIDTH_PERCENT = 92;
const HIT_TEST_PADDING = 12;

const CATEGORY_BY_NAME = new Map(FONT_CATALOG.map((font) => [font.name, font.category]));

function fontFamilyValue(name: string, loaded: boolean): string {
  const category = CATEGORY_BY_NAME.get(name);
  const fallback = category ? fallbackFor(category) : 'sans-serif';
  return loaded ? `'${name}', ${fallback}` : fallback;
}

function makeTextBox(overrides: Partial<TextBoxConfig> & { text: string }): TextBoxConfig {
  return {
    id: crypto.randomUUID(),
    xPercent: 50,
    yPercent: 50,
    fontFamily: DEFAULT_FONT,
    fontSize: 64,
    autoFit: true,
    maxWidthPercent: DEFAULT_MAX_WIDTH_PERCENT,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 8,
    align: 'center',
    uppercase: true,
    ...overrides,
  };
}

function createDefaultTextBoxes(): TextBoxConfig[] {
  return [makeTextBox({ text: 'TOP TEXT', yPercent: 8 }), makeTextBox({ text: 'BOTTOM TEXT', yPercent: 92 })];
}

/** A plain, purely programmatic gray canvas shown before the user uploads a
 * photo — generated pixels only, never a bundled image file, so the tool
 * has something to caption immediately without shipping any example/
 * template image (see the no-bundled-templates requirement). */
function createPlaceholderBitmap(): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#64748b';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Upload an image to get started', canvas.width / 2, canvas.height / 2);
  }
  return createImageBitmap(canvas);
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function MemeGenerator() {
  const [baseBitmap, setBaseBitmap] = useState<ImageBitmap | null>(null);
  // Starts empty rather than pre-populated with createDefaultTextBoxes(): its
  // ids come from crypto.randomUUID(), which would produce different values
  // during the server render vs. the client's first render and break
  // hydration (id-derived `htmlFor`/`id` pairs mismatching). Populated in the
  // mount effect below instead, which only ever runs client-side.
  const [textBoxes, setTextBoxes] = useState<TextBoxConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boundsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const ensureFontLoaded = useCallback((family: string) => {
    void loadGoogleFont(family).then(() => {
      setLoadedFonts((prev) => (prev.has(family) ? prev : new Set(prev).add(family)));
    });
  }, []);

  useEffect(() => {
    ensureFontLoaded(DEFAULT_FONT);
    void createPlaceholderBitmap().then(setBaseBitmap);
    setTextBoxes(createDefaultTextBoxes());
    setClipboardSupported(typeof window !== 'undefined' && 'ClipboardItem' in window && typeof navigator.clipboard?.write === 'function');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileSelected(file: File) {
    void createImageBitmap(file).then((bitmap) => {
      setBaseBitmap((prev) => {
        prev?.close();
        return bitmap;
      });
    });
  }

  const renderableBoxes = useMemo(
    () => textBoxes.map((box) => ({ ...box, fontFamily: fontFamilyValue(box.fontFamily, loadedFonts.has(box.fontFamily)) })),
    [textBoxes, loadedFonts],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseBitmap) return;
    canvas.width = baseBitmap.width;
    canvas.height = baseBitmap.height;
    renderMemeToCanvas(canvas, baseBitmap, renderableBoxes);
    boundsRef.current = getTextBoxBounds(canvas, renderableBoxes);
  }, [baseBitmap, renderableBoxes]);

  function hitTest(point: { x: number; y: number }): string | null {
    const entries = Object.entries(boundsRef.current);
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const entry = entries[i];
      if (!entry) continue;
      const [id, b] = entry;
      if (
        point.x >= b.x - HIT_TEST_PADDING &&
        point.x <= b.x + b.width + HIT_TEST_PADDING &&
        point.y >= b.y - HIT_TEST_PADDING &&
        point.y <= b.y + b.height + HIT_TEST_PADDING
      ) {
        return id;
      }
    }
    return null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(canvas, event.clientX, event.clientY);
    const id = hitTest(point);
    if (!id) return;
    const box = textBoxes.find((b) => b.id === id);
    if (!box) return;
    setSelectedId(id);
    const anchorX = canvas.width * (box.xPercent / 100);
    const anchorY = canvas.height * (box.yPercent / 100);
    dragRef.current = { id, offsetX: point.x - anchorX, offsetY: point.y - anchorY };
    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const point = getCanvasPoint(canvas, event.clientX, event.clientY);
    const xPercent = Math.min(100, Math.max(0, ((point.x - drag.offsetX) / canvas.width) * 100));
    const yPercent = Math.min(100, Math.max(0, ((point.y - drag.offsetY) / canvas.height) * 100));
    setTextBoxes((prev) => prev.map((b) => (b.id === drag.id ? { ...b, xPercent, yPercent } : b)));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function updateBox(id: string, patch: Partial<TextBoxConfig>) {
    setTextBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBox(id: string) {
    setTextBoxes((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function addBox() {
    const box = makeTextBox({ text: 'New text' });
    setTextBoxes((prev) => [...prev, box]);
    setSelectedId(box.id);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      triggerDownload(url, 'meme.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function handleCopyToClipboard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

  const fontOptions: ComboboxOption[] = useMemo(() => FONT_CATALOG.map((font) => ({ value: font.name, label: font.name })), []);
  function renderFontOption(option: ComboboxOption) {
    const loaded = loadedFonts.has(option.value);
    return (
      <span onMouseEnter={() => ensureFontLoaded(option.value)} style={{ fontFamily: fontFamilyValue(option.value, loaded) }}>
        {option.label}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        onFileSelected={handleFileSelected}
        accept="image/*"
        label="Drop your own photo here, or click to browse"
        hint="Your image — no built-in templates. Processed entirely in your browser, never uploaded."
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Preview — drag any text to reposition it</h3>
        <div className="overflow-hidden rounded-lg border border-ink/10 dark:border-paper/10">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full cursor-move touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={addBox}>
          + Add text box
        </Button>
        <Button variant="primary" onClick={handleDownload}>
          Download PNG
        </Button>
        {clipboardSupported && (
          <Button variant="secondary" onClick={handleCopyToClipboard}>
            {imageCopied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {textBoxes.map((box, index) => (
          <div
            key={box.id}
            onFocus={() => setSelectedId(box.id)}
            className={`flex flex-col gap-3 rounded-lg border p-4 ${
              selectedId === box.id ? 'border-accent' : 'border-ink/10 dark:border-paper/10'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-medium text-ink dark:text-paper">Text box {index + 1}</h4>
              <button type="button" onClick={() => removeBox(box.id)} className="text-xs text-ink/40 hover:text-danger dark:text-paper/40">
                Delete
              </button>
            </div>

            <input
              type="text"
              value={box.text}
              onChange={(event) => updateBox(box.id, { text: event.target.value })}
              placeholder="Caption text"
              className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-ink/70 dark:text-paper/70">Font</label>
                <Combobox
                  options={fontOptions}
                  value={box.fontFamily}
                  onChange={(value) => {
                    updateBox(box.id, { fontFamily: value });
                    ensureFontLoaded(value);
                  }}
                  ariaLabel={`Font for text box ${index + 1}`}
                  renderOption={renderFontOption}
                />
              </div>
              <Slider
                id={`font-size-${box.id}`}
                label="Max font size"
                min={12}
                max={160}
                value={box.fontSize}
                onChange={(value) => updateBox(box.id, { fontSize: value })}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Checkbox
                label="Auto-fit to width (shrinks long text, keeps short text full size)"
                checked={box.autoFit}
                onChange={(event) => updateBox(box.id, { autoFit: event.target.checked })}
              />
              <Checkbox label="UPPERCASE" checked={box.uppercase} onChange={(event) => updateBox(box.id, { uppercase: event.target.checked })} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`color-${box.id}`} className="text-sm text-ink/70 dark:text-paper/70">
                  Text color
                </label>
                <input
                  id={`color-${box.id}`}
                  type="color"
                  value={box.color}
                  onChange={(event) => updateBox(box.id, { color: event.target.value })}
                  className="h-9 w-full cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`stroke-color-${box.id}`} className="text-sm text-ink/70 dark:text-paper/70">
                  Outline color
                </label>
                <input
                  id={`stroke-color-${box.id}`}
                  type="color"
                  value={box.strokeColor}
                  onChange={(event) => updateBox(box.id, { strokeColor: event.target.value })}
                  className="h-9 w-full cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
                />
              </div>
              <Slider
                id={`stroke-width-${box.id}`}
                label="Outline width"
                min={0}
                max={20}
                value={box.strokeWidth}
                onChange={(value) => updateBox(box.id, { strokeWidth: value })}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm text-ink/70 dark:text-paper/70">Align:</span>
              {(['left', 'center', 'right'] as CanvasTextAlign[]).map((align) => (
                <Button key={align} variant={box.align === align ? 'primary' : 'secondary'} size="sm" onClick={() => updateBox(box.id, { align })}>
                  {align}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — your photo is never uploaded. There are no built-in meme templates; upload your own image to
        get started.
      </span>
    </div>
  );
}
