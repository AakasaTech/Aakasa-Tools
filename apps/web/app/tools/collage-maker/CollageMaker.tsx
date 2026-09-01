'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button } from '@aakasa/ui';
import { COLLAGE_TEMPLATES, type CollageTemplate } from './utils/collageTemplates';
import { computeDrawRect, renderCollageToCanvas, type CropOffset, type PhotoAssignment, type PixelRect } from './utils/renderCollage';

type AspectMode = 'square' | 'landscape' | 'portrait' | 'custom';
type ExportFormat = 'image/png' | 'image/jpeg';

interface CellAssignment {
  previewUrl: string;
  image: HTMLImageElement;
  cropOffset: CropOffset;
  zoom: number;
}

const DRAG_CLICK_THRESHOLD_PX = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function loadImageElement(file: File): Promise<{ image: HTMLImageElement; previewUrl: string }> {
  const previewUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ image: img, previewUrl });
    img.onerror = () => reject(new Error('Could not load this image.'));
    img.src = previewUrl;
  });
}

function getCanvasDimensions(mode: AspectMode, customWidth: number, customHeight: number): { width: number; height: number } {
  if (mode === 'custom') return { width: Math.max(1, customWidth), height: Math.max(1, customHeight) };
  if (mode === 'landscape') return { width: 1200, height: 900 };
  if (mode === 'portrait') return { width: 900, height: 1200 };
  return { width: 1200, height: 1200 };
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

export function CollageMaker() {
  const [aspectMode, setAspectMode] = useState<AspectMode>('square');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(1200);
  const [templateId, setTemplateId] = useState(COLLAGE_TEMPLATES[0]!.id);
  const [assignments, setAssignments] = useState<Map<number, CellAssignment>>(new Map());
  const [gap, setGap] = useState(8);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [cornerRadius, setCornerRadius] = useState(0);
  const [swapSelectedIndex, setSwapSelectedIndex] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [imgRects, setImgRects] = useState<Record<number, PixelRect>>({});

  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const assignmentsRef = useRef(assignments);
  const pendingCellIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  const template: CollageTemplate = useMemo(() => COLLAGE_TEMPLATES.find((t) => t.id === templateId) ?? COLLAGE_TEMPLATES[0]!, [templateId]);
  const canvasDimensions = getCanvasDimensions(aspectMode, customWidth, customHeight);

  const computeImgRectsFor = useCallback((currentAssignments: Map<number, CellAssignment>): Record<number, PixelRect> => {
    const next: Record<number, PixelRect> = {};
    cellRefs.current.forEach((el, index) => {
      const assignment = currentAssignments.get(index);
      if (!assignment || !el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      next[index] = computeDrawRect({ x: 0, y: 0, width: rect.width, height: rect.height }, assignment.image, assignment.cropOffset, assignment.zoom);
    });
    return next;
  }, []);

  // Uses `assignments` directly from this render's closure (not the ref)
  // — a layout effect runs before the plain effect that syncs the ref, so
  // reading the ref here would see last render's assignments, one step
  // behind, and a just-added photo would never get an initial rect.
  useLayoutEffect(() => {
    setImgRects(computeImgRectsFor(assignments));
  }, [templateId, aspectMode, customWidth, customHeight, gap, assignments, computeImgRectsFor]);

  // A ResizeObserver on the grid container catches every reason a cell's
  // actual rendered size could change — window resize, but also the
  // container going from zero-size (e.g. not yet laid out, or briefly
  // hidden) to its real size, which the layout effect above can race with
  // on first mount. Without this, a cell measured at 0×0 would silently
  // never get an image rect until *something else* happened to trigger a
  // recompute.
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setImgRects(computeImgRectsFor(assignmentsRef.current));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [computeImgRectsFor]);

  // Live canvas preview — the same renderCollageToCanvas call the final
  // export uses, so what's shown here is never an approximation of the
  // download.
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;
    const photoAssignments: PhotoAssignment[] = Array.from(assignments.entries()).map(([cellIndex, a]) => ({
      cellIndex,
      image: a.image,
      cropOffset: a.cropOffset,
      zoom: a.zoom,
    }));
    renderCollageToCanvas(canvas, template, photoAssignments, { gap, borderColor, cornerRadius });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, assignments, gap, borderColor, cornerRadius, canvasDimensions.width, canvasDimensions.height]);

  function updateAssignment(index: number, patch: Partial<CellAssignment>) {
    setAssignments((prev) => {
      const current = prev.get(index);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(index, { ...current, ...patch });
      return next;
    });
  }

  async function assignFileToCell(index: number, file: File) {
    try {
      const { image, previewUrl } = await loadImageElement(file);
      setAssignments((prev) => {
        const existing = prev.get(index);
        if (existing) URL.revokeObjectURL(existing.previewUrl);
        const next = new Map(prev);
        next.set(index, { image, previewUrl, cropOffset: { x: 0, y: 0 }, zoom: 1 });
        return next;
      });
    } catch {
      // Unreadable file — leave the cell as-is.
    }
  }

  function openPickerForCell(index: number) {
    pendingCellIndexRef.current = index;
    fileInputRef.current?.click();
  }

  function handleFileInputChange(event: ReactChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const index = pendingCellIndexRef.current;
    event.target.value = '';
    if (file && index !== null) void assignFileToCell(index, file);
  }

  function handleCellDrop(index: number, event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) void assignFileToCell(index, file);
  }

  function swapCells(a: number, b: number) {
    setAssignments((prev) => {
      const next = new Map(prev);
      const assignmentA = prev.get(a);
      const assignmentB = prev.get(b);
      if (assignmentB) next.set(a, assignmentB);
      else next.delete(a);
      if (assignmentA) next.set(b, assignmentA);
      else next.delete(b);
      return next;
    });
  }

  function handleCellClick(index: number) {
    const assignment = assignmentsRef.current.get(index);
    if (!assignment) {
      openPickerForCell(index);
      return;
    }
    if (swapSelectedIndex === null) {
      setSwapSelectedIndex(index);
    } else if (swapSelectedIndex === index) {
      setSwapSelectedIndex(null);
    } else {
      swapCells(swapSelectedIndex, index);
      setSwapSelectedIndex(null);
    }
  }

  // Filled cells are both draggable (pan-to-reposition-crop) and
  // clickable (swap-select) — a pointerdown that ends with minimal
  // movement is treated as a click; anything past a small threshold is
  // treated as a pan drag instead, so the two interactions don't collide.
  function handleFilledCellPointerDown(index: number, event: ReactPointerEvent<HTMLDivElement>) {
    const assignment = assignmentsRef.current.get(index);
    const cellEl = cellRefs.current.get(index);
    if (!assignment || !cellEl) return;

    const rect = cellEl.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = { ...assignment.cropOffset };
    let moved = false;

    const synthetic = computeDrawRect({ x: 0, y: 0, width: rect.width, height: rect.height }, assignment.image, { x: 0, y: 0 }, assignment.zoom);
    const slackX = synthetic.width - rect.width;
    const slackY = synthetic.height - rect.height;

    function handleMove(moveEvent: PointerEvent) {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.hypot(dx, dy) > DRAG_CLICK_THRESHOLD_PX) moved = true;
      const newX = slackX > 0 ? clamp(startOffset.x - dx / (slackX / 2), -1, 1) : 0;
      const newY = slackY > 0 ? clamp(startOffset.y - dy / (slackY / 2), -1, 1) : 0;
      updateAssignment(index, { cropOffset: { x: newX, y: newY } });
    }

    function handleUp() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      if (!moved) handleCellClick(index);
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  function handleZoomChange(index: number, zoom: number) {
    updateAssignment(index, { zoom });
  }

  function handleReplaceClick(index: number, event: ReactMouseEvent) {
    event.stopPropagation();
    openPickerForCell(index);
  }

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    setSwapSelectedIndex(null);
  }

  async function handleDownload() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasDimensions.width;
    exportCanvas.height = canvasDimensions.height;
    const photoAssignments: PhotoAssignment[] = Array.from(assignments.entries()).map(([cellIndex, a]) => ({
      cellIndex,
      image: a.image,
      cropOffset: a.cropOffset,
      zoom: a.zoom,
    }));
    renderCollageToCanvas(exportCanvas, template, photoAssignments, { gap, borderColor, cornerRadius });
    const blob = await new Promise<Blob | null>((resolve) => exportCanvas.toBlob(resolve, exportFormat, exportFormat === 'image/jpeg' ? quality / 100 : undefined));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    triggerDownload(url, exportFormat === 'image/png' ? 'collage.png' : 'collage.jpg');
    URL.revokeObjectURL(url);
  }

  const filledCount = assignments.size;

  return (
    <div className="flex flex-col gap-5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Layout</h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {COLLAGE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTemplateChange(t.id)}
              title={t.label}
              className={`relative aspect-square rounded-md border p-1 ${
                templateId === t.id ? 'border-accent bg-accent/10' : 'border-ink/15 hover:border-ink/30 dark:border-paper/15'
              }`}
            >
              <div className="relative h-full w-full">
                {t.cells.map((cell, i) => (
                  <div
                    key={i}
                    className="absolute rounded-[1px] bg-ink/30 dark:bg-paper/40"
                    style={{ left: `${cell.x * 100}%`, top: `${cell.y * 100}%`, width: `${cell.width * 100}%`, height: `${cell.height * 100}%`, margin: 1 }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Canvas shape</h3>
        <div className="flex flex-wrap gap-1.5">
          {(['square', 'landscape', 'portrait', 'custom'] as AspectMode[]).map((mode) => (
            <Button key={mode} variant={aspectMode === mode ? 'primary' : 'secondary'} size="sm" onClick={() => setAspectMode(mode)}>
              {mode[0]!.toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
        {aspectMode === 'custom' && (
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
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">
            Photos ({filledCount}/{template.cells.length})
          </h3>
          {swapSelectedIndex !== null && <span className="text-xs text-accent">Click another filled cell to swap, or click it again to cancel.</span>}
        </div>
        <div
          ref={gridContainerRef}
          className="relative mx-auto w-full max-w-xl overflow-hidden rounded-md border border-ink/10 dark:border-paper/10"
          style={{ aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`, backgroundColor: borderColor }}
        >
          {template.cells.map((cell, index) => {
            const assignment = assignments.get(index);
            const rect = imgRects[index];
            const isSwapSelected = swapSelectedIndex === index;
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) cellRefs.current.set(index, el);
                  else cellRefs.current.delete(index);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleCellDrop(index, event)}
                onClick={assignment ? undefined : () => handleCellClick(index)}
                onPointerDown={assignment ? (event) => handleFilledCellPointerDown(index, event) : undefined}
                className={`absolute overflow-hidden ${assignment ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer bg-ink/5 hover:bg-ink/10 dark:bg-paper/5'}`}
                style={{
                  left: `calc(${cell.x * 100}% + ${gap / 2}px)`,
                  top: `calc(${cell.y * 100}% + ${gap / 2}px)`,
                  width: `calc(${cell.width * 100}% - ${gap}px)`,
                  height: `calc(${cell.height * 100}% - ${gap}px)`,
                  borderRadius: cornerRadius,
                  outline: isSwapSelected ? '3px solid #3b82f6' : undefined,
                  outlineOffset: isSwapSelected ? -3 : undefined,
                }}
              >
                {assignment && rect ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assignment.previewUrl}
                      alt=""
                      draggable={false}
                      className="pointer-events-none absolute select-none"
                      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, maxWidth: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={(event) => handleReplaceClick(index, event)}
                      className="absolute right-1 top-1 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-ink/80"
                    >
                      Replace
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={assignment.zoom}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => handleZoomChange(index, Number(event.target.value))}
                      className="absolute bottom-1 left-1 right-1 accent-accent"
                    />
                  </>
                ) : (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-ink/40 dark:text-paper/40">+</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-ink/50 dark:text-paper/50">
          Click an empty cell to add a photo, drag within a filled cell to reposition it, use the slider to zoom, or click two filled cells to swap them.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Spacing &amp; style</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-sm text-ink/70 dark:text-paper/70">
              <label htmlFor="gap">Gap</label>
              <span className="font-mono text-ink dark:text-paper">{gap}px</span>
            </div>
            <input id="gap" type="range" min={0} max={40} value={gap} onChange={(event) => setGap(Number(event.target.value))} className="mt-1 w-full accent-accent" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm text-ink/70 dark:text-paper/70">
              <label htmlFor="corner-radius">Corner rounding</label>
              <span className="font-mono text-ink dark:text-paper">{cornerRadius}px</span>
            </div>
            <input
              id="corner-radius"
              type="range"
              min={0}
              max={80}
              value={cornerRadius}
              onChange={(event) => setCornerRadius(Number(event.target.value))}
              className="mt-1 w-full accent-accent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink/70 dark:text-paper/70">Background / gap color</span>
          <input
            type="color"
            value={borderColor}
            onChange={(event) => setBorderColor(event.target.value)}
            className="h-7 w-8 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Export</h3>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={exportFormat === 'image/png' ? 'primary' : 'secondary'} size="sm" onClick={() => setExportFormat('image/png')}>
            PNG
          </Button>
          <Button variant={exportFormat === 'image/jpeg' ? 'primary' : 'secondary'} size="sm" onClick={() => setExportFormat('image/jpeg')}>
            JPEG
          </Button>
        </div>
        {exportFormat === 'image/jpeg' && (
          <div className="max-w-xs">
            <div className="flex items-center justify-between text-sm text-ink/70 dark:text-paper/70">
              <label htmlFor="quality">Quality</label>
              <span className="font-mono text-ink dark:text-paper">{quality}</span>
            </div>
            <input id="quality" type="range" min={1} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-1 w-full accent-accent" />
          </div>
        )}
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Output size: {canvasDimensions.width}×{canvasDimensions.height}px.
        </p>
      </div>

      <Button variant="primary" onClick={() => void handleDownload()} disabled={filledCount === 0} className="self-start">
        Download collage
      </Button>

      {filledCount > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Final preview</h3>
          <p className="text-xs text-ink/50 dark:text-paper/50">
            This is the actual flattened canvas render — pixel-identical to the file &quot;Download collage&quot; produces, not an approximation of it.
          </p>
          <div className="overflow-hidden rounded-md border border-ink/10 dark:border-paper/10">
            <canvas ref={previewCanvasRef} className="block h-auto max-h-72 w-full object-contain" />
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — your photos are never uploaded.</span>
    </div>
  );
}
