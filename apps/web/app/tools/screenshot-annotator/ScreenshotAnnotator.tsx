'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, FileDropzone } from '@aakasa/ui';
import {
  getAnnotationBounds,
  hitTestAnnotation,
  isResizable,
  moveAnnotation,
  resizeAnnotation,
  type Annotation,
  type Point,
  type Rect,
  type ResizeHandle,
  type StepMarkerAnnotation,
  type TextAnnotation,
  type ToolType,
} from './utils/annotationModel';
import { renderAnnotationsToCanvas } from './utils/renderAnnotations';
import { canRedo, canUndo, createUndoState, pushUndoState, redo, undo, type UndoState } from './utils/undoStack';

type EditorTool = ToolType | 'select';

const TOOL_LABELS: Record<EditorTool, string> = {
  select: 'Select',
  arrow: 'Arrow',
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
  freehand: 'Pen',
  text: 'Text',
  blur: 'Blur',
  highlight: 'Highlight',
  step: 'Step marker',
};

const HANDLE_HIT_PX = 8;
const CLICK_TOLERANCE_PX = 6;
const DEFAULT_STEP_RADIUS = 16;

type DragState =
  | { mode: 'move'; id: string; startPoint: Point; original: Annotation; startAnnotations: Annotation[] }
  | { mode: 'resize'; id: string; handle: ResizeHandle; startBounds: Rect; startAnnotations: Annotation[] }
  | { mode: 'create'; id: string; tool: ToolType; startPoint: Point; startAnnotations: Annotation[] }
  | { mode: 'freehand'; id: string; startAnnotations: Annotation[] };

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function measureTextWidth(ctx: CanvasRenderingContext2D, text: string, fontSize: number): number {
  ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  return ctx.measureText(text).width;
}

function hitTestHandle(bounds: Rect, point: Point, tolerance: number): ResizeHandle | null {
  const corners: [ResizeHandle, number, number][] = [
    ['nw', bounds.x, bounds.y],
    ['ne', bounds.x + bounds.width, bounds.y],
    ['sw', bounds.x, bounds.y + bounds.height],
    ['se', bounds.x + bounds.width, bounds.y + bounds.height],
  ];
  for (const [handle, cx, cy] of corners) {
    if (Math.abs(point.x - cx) <= tolerance && Math.abs(point.y - cy) <= tolerance) return handle;
  }
  return null;
}

function updateDraftForCreate(annotation: Annotation, tool: ToolType, start: Point, point: Point): Annotation {
  if (tool === 'arrow' && annotation.type === 'arrow') {
    return { ...annotation, x2: point.x, y2: point.y };
  }
  if ((tool === 'rectangle' || tool === 'blur' || tool === 'highlight' || tool === 'ellipse') && 'width' in annotation && 'height' in annotation) {
    return { ...annotation, x: start.x, y: start.y, width: point.x - start.x, height: point.y - start.y };
  }
  return annotation;
}

/** Editor-only overlay (selection outline + resize handles) — drawn on
 * the live editing canvas after the flattened render, but intentionally
 * never part of `renderAnnotationsToCanvas` itself so it can never leak
 * into an exported image. */
function drawSelectionOverlay(ctx: CanvasRenderingContext2D, annotation: Annotation) {
  const bounds = getAnnotationBounds(annotation, (text, size) => measureTextWidth(ctx, text, size));
  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8);
  ctx.setLineDash([]);
  if (isResizable(annotation)) {
    ctx.fillStyle = '#3b82f6';
    const corners = [
      [bounds.x, bounds.y],
      [bounds.x + bounds.width, bounds.y],
      [bounds.x, bounds.y + bounds.height],
      [bounds.x + bounds.width, bounds.y + bounds.height],
    ];
    for (const [cx, cy] of corners) {
      if (cx === undefined || cy === undefined) continue;
      ctx.fillRect(cx - HANDLE_HIT_PX / 2, cy - HANDLE_HIT_PX / 2, HANDLE_HIT_PX, HANDLE_HIT_PX);
    }
  }
  ctx.restore();
}

export function ScreenshotAnnotator() {
  const [baseBitmap, setBaseBitmap] = useState<ImageBitmap | null>(null);
  const [history, setHistory] = useState<UndoState<Annotation[]>>(() => createUndoState<Annotation[]>([]));
  const annotations = history.present;

  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(24);
  const [highlightOpacity, setHighlightOpacity] = useState(0.4);
  const [blurMode, setBlurMode] = useState<'blur' | 'pixelate'>('pixelate');
  const [blurIntensity, setBlurIntensity] = useState(14);
  const [nextStepNumber, setNextStepNumber] = useState(1);
  const [zoom, setZoom] = useState(1);

  const [pendingText, setPendingText] = useState<Point | null>(null);
  const [pendingTextValue, setPendingTextValue] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingInputRef = useRef<HTMLInputElement>(null);

  async function loadBaseImage(file: File) {
    const bitmap = await createImageBitmap(file);
    setBaseBitmap((prev) => {
      prev?.close();
      return bitmap;
    });
    setHistory(createUndoState<Annotation[]>([]));
    setSelectedId(null);
    setNextStepNumber(1);
    setZoom(1);
  }

  function handleFileSelected(file: File) {
    void loadBaseImage(file);
  }

  // Paste-from-clipboard: many users land on this tool with a screenshot
  // already on their OS clipboard from a native screenshot shortcut — read
  // any image item off a paste event anywhere on the page and load it
  // exactly like a dropped file.
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void loadBaseImage(file);
          }
          break;
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Delete/Backspace removes the selected annotation; Ctrl/Cmd+Z and
  // Ctrl/Cmd+Shift+Z (or +Y) drive undo/redo. Skipped entirely while an
  // <input>/<textarea> has focus so typing in the text-tool's overlay (or
  // any future text field) never gets intercepted as a shortcut.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        setHistory((h) => pushUndoState(h, h.present.filter((a) => a.id !== selectedId)));
        setSelectedId(null);
        return;
      }
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory((h) => (event.shiftKey ? redo(h) : undo(h)));
      } else if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        setHistory((h) => redo(h));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // Live editor render: flattened annotations plus the selection overlay.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseBitmap) return;
    renderAnnotationsToCanvas(canvas, baseBitmap, annotations);
    const ctx = canvas.getContext('2d');
    const selected = annotations.find((a) => a.id === selectedId);
    if (ctx && selected) drawSelectionOverlay(ctx, selected);
  }, [baseBitmap, annotations, selectedId]);

  const setPresentLive = useCallback((updater: (present: Annotation[]) => Annotation[]) => {
    setHistory((h) => ({ ...h, present: updater(h.present) }));
  }, []);

  function newDraftAnnotation(tool: ToolType, point: Point): Annotation {
    const id = crypto.randomUUID();
    switch (tool) {
      case 'arrow':
        return { id, type: 'arrow', x1: point.x, y1: point.y, x2: point.x, y2: point.y, color, strokeWidth };
      case 'rectangle':
        return { id, type: 'rectangle', x: point.x, y: point.y, width: 0, height: 0, color, strokeWidth };
      case 'ellipse':
        return { id, type: 'ellipse', x: point.x, y: point.y, width: 0, height: 0, color, strokeWidth };
      case 'blur':
        return { id, type: 'blur', x: point.x, y: point.y, width: 0, height: 0, mode: blurMode, intensity: blurIntensity };
      case 'highlight':
        return { id, type: 'highlight', x: point.x, y: point.y, width: 0, height: 0, color, opacity: highlightOpacity };
      case 'freehand':
        return { id, type: 'freehand', points: [point], color, strokeWidth };
      default:
        throw new Error(`newDraftAnnotation: unsupported tool ${tool}`);
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !baseBitmap) return;
    const point = getCanvasPoint(canvas, event.clientX, event.clientY);
    canvas.setPointerCapture(event.pointerId);
    const ctx = canvas.getContext('2d');

    if (activeTool === 'select') {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && isResizable(selected)) {
        const bounds = getAnnotationBounds(selected, ctx ? (t, s) => measureTextWidth(ctx, t, s) : undefined);
        const handle = hitTestHandle(bounds, point, HANDLE_HIT_PX / zoom);
        if (handle) {
          dragRef.current = { mode: 'resize', id: selected.id, handle, startBounds: bounds, startAnnotations: annotations };
          return;
        }
      }
      for (let i = annotations.length - 1; i >= 0; i -= 1) {
        const candidate = annotations[i];
        if (candidate && hitTestAnnotation(candidate, point, CLICK_TOLERANCE_PX / zoom, ctx ? (t, s) => measureTextWidth(ctx, t, s) : undefined)) {
          setSelectedId(candidate.id);
          dragRef.current = { mode: 'move', id: candidate.id, startPoint: point, original: candidate, startAnnotations: annotations };
          return;
        }
      }
      setSelectedId(null);
      return;
    }

    if (activeTool === 'text') {
      setPendingText(point);
      setPendingTextValue('');
      return;
    }

    if (activeTool === 'step') {
      const newAnnotation: StepMarkerAnnotation = {
        id: crypto.randomUUID(),
        type: 'step',
        x: point.x,
        y: point.y,
        number: nextStepNumber,
        color,
        radius: DEFAULT_STEP_RADIUS,
      };
      setHistory((h) => pushUndoState(h, [...h.present, newAnnotation]));
      setNextStepNumber((n) => n + 1);
      setSelectedId(newAnnotation.id);
      return;
    }

    if (activeTool === 'freehand') {
      const draft = newDraftAnnotation('freehand', point);
      dragRef.current = { mode: 'freehand', id: draft.id, startAnnotations: annotations };
      setPresentLive((present) => [...present, draft]);
      setSelectedId(draft.id);
      return;
    }

    const draft = newDraftAnnotation(activeTool, point);
    dragRef.current = { mode: 'create', id: draft.id, tool: activeTool, startPoint: point, startAnnotations: annotations };
    setPresentLive((present) => [...present, draft]);
    setSelectedId(draft.id);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const point = getCanvasPoint(canvas, event.clientX, event.clientY);

    if (drag.mode === 'move') {
      const dx = point.x - drag.startPoint.x;
      const dy = point.y - drag.startPoint.y;
      const moved = moveAnnotation(drag.original, dx, dy);
      setPresentLive((present) => present.map((a) => (a.id === drag.id ? moved : a)));
    } else if (drag.mode === 'resize') {
      setPresentLive((present) =>
        present.map((a) => (a.id === drag.id && isResizable(a) ? resizeAnnotation(a, drag.handle, drag.startBounds, point) : a)),
      );
    } else if (drag.mode === 'create') {
      setPresentLive((present) => present.map((a) => (a.id === drag.id ? updateDraftForCreate(a, drag.tool, drag.startPoint, point) : a)));
    } else if (drag.mode === 'freehand') {
      setPresentLive((present) => present.map((a) => (a.id === drag.id && a.type === 'freehand' ? { ...a, points: [...a.points, point] } : a)));
    }
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    setHistory((h) => {
      if (drag.mode === 'create') {
        const created = h.present.find((a) => a.id === drag.id);
        if (created) {
          if (created.type === 'arrow') {
            const length = Math.hypot(created.x2 - created.x1, created.y2 - created.y1);
            if (length < 2) return { ...h, present: drag.startAnnotations };
          } else {
            const bounds = getAnnotationBounds(created);
            if (bounds.width < 2 && bounds.height < 2) return { ...h, present: drag.startAnnotations };
          }
        }
      } else if (drag.mode === 'freehand') {
        const created = h.present.find((a) => a.id === drag.id);
        if (created && created.type === 'freehand' && created.points.length < 2) return { ...h, present: drag.startAnnotations };
      } else if (drag.mode === 'move' || drag.mode === 'resize') {
        // No-op drags (click without movement) shouldn't create an undo step.
        if (JSON.stringify(h.present) === JSON.stringify(drag.startAnnotations)) return h;
      }
      return pushUndoState({ ...h, present: drag.startAnnotations }, h.present);
    });
  }

  useEffect(() => {
    if (pendingText) pendingInputRef.current?.focus();
  }, [pendingText]);

  function commitPendingText() {
    if (!pendingText) return;
    const text = pendingTextValue.trim();
    if (text) {
      const newAnnotation: TextAnnotation = { id: crypto.randomUUID(), type: 'text', x: pendingText.x, y: pendingText.y, text, color, fontSize };
      setHistory((h) => pushUndoState(h, [...h.present, newAnnotation]));
      setSelectedId(newAnnotation.id);
    }
    setPendingText(null);
    setPendingTextValue('');
  }

  function cancelPendingText() {
    setPendingText(null);
    setPendingTextValue('');
  }

  function handleToolSelect(tool: EditorTool) {
    setActiveTool(tool);
    if (tool !== 'select') setSelectedId(null);
  }

  function handleDeleteSelected() {
    if (!selectedId) return;
    setHistory((h) => pushUndoState(h, h.present.filter((a) => a.id !== selectedId)));
    setSelectedId(null);
  }

  function handleClearAll() {
    if (annotations.length === 0) return;
    setHistory((h) => pushUndoState(h, []));
    setSelectedId(null);
  }

  function handleStartOver() {
    baseBitmap?.close();
    setBaseBitmap(null);
    setHistory(createUndoState<Annotation[]>([]));
    setSelectedId(null);
  }

  function fitToWidth() {
    const viewport = viewportRef.current;
    if (!viewport || !baseBitmap) return;
    const available = viewport.clientWidth - 24;
    setZoom(Math.max(0.1, Math.min(1, available / baseBitmap.width)));
  }

  function handleDownload(format: 'image/png' | 'image/jpeg') {
    if (!baseBitmap) return;
    const exportCanvas = document.createElement('canvas');
    renderAnnotationsToCanvas(exportCanvas, baseBitmap, annotations);
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        triggerDownload(url, format === 'image/png' ? 'annotated-screenshot.png' : 'annotated-screenshot.jpg');
        URL.revokeObjectURL(url);
      },
      format,
      format === 'image/jpeg' ? 0.92 : undefined,
    );
  }

  const selectedAnnotation = useMemo(() => annotations.find((a) => a.id === selectedId) ?? null, [annotations, selectedId]);

  const showColor = activeTool !== 'blur' && activeTool !== 'select';
  const showStrokeWidth = activeTool === 'arrow' || activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'freehand';
  const showFontSize = activeTool === 'text';
  const showHighlightOpacity = activeTool === 'highlight';
  const showBlurOptions = activeTool === 'blur';

  if (!baseBitmap) {
    return (
      <div className="flex flex-col gap-4">
        <FileDropzone
          onFileSelected={handleFileSelected}
          accept="image/*"
          label="Drop a screenshot here, click to browse, or paste (Ctrl/Cmd+V) an image from your clipboard"
          hint="This tool annotates an image you provide — it does not capture screenshots itself."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" ref={wrapperRef}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-ink/10 bg-paper p-1.5 dark:border-paper/10 dark:bg-ink">
        {(Object.keys(TOOL_LABELS) as EditorTool[]).map((tool) => (
          <Button key={tool} variant={activeTool === tool ? 'primary' : 'ghost'} size="sm" onClick={() => handleToolSelect(tool)}>
            {TOOL_LABELS[tool]}
          </Button>
        ))}
        <span className="mx-1 h-5 w-px bg-ink/10 dark:bg-paper/10" />
        <Button variant="ghost" size="sm" onClick={() => setHistory(undo)} disabled={!canUndo(history)}>
          Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setHistory(redo)} disabled={!canRedo(history)}>
          Redo
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDeleteSelected} disabled={!selectedAnnotation}>
          Delete selected
        </Button>
      </div>

      {(showColor || showStrokeWidth || showFontSize || showHighlightOpacity || showBlurOptions) && (
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-ink/10 bg-paper p-2.5 text-sm dark:border-paper/10 dark:bg-ink">
          {showColor && (
            <label className="flex items-center gap-1.5 text-ink/70 dark:text-paper/70">
              Color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5 dark:border-paper/15" />
            </label>
          )}
          {showStrokeWidth && (
            <label className="flex items-center gap-2 text-ink/70 dark:text-paper/70">
              Width
              <input type="range" min={1} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="accent-accent" />
              <span className="w-6 font-mono text-xs text-ink dark:text-paper">{strokeWidth}</span>
            </label>
          )}
          {showFontSize && (
            <label className="flex items-center gap-2 text-ink/70 dark:text-paper/70">
              Font size
              <input type="range" min={10} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="accent-accent" />
              <span className="w-6 font-mono text-xs text-ink dark:text-paper">{fontSize}</span>
            </label>
          )}
          {showHighlightOpacity && (
            <label className="flex items-center gap-2 text-ink/70 dark:text-paper/70">
              Opacity
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={highlightOpacity}
                onChange={(e) => setHighlightOpacity(Number(e.target.value))}
                className="accent-accent"
              />
            </label>
          )}
          {showBlurOptions && (
            <>
              <div className="flex items-center gap-1.5">
                <Button variant={blurMode === 'pixelate' ? 'primary' : 'secondary'} size="sm" onClick={() => setBlurMode('pixelate')}>
                  Pixelate
                </Button>
                <Button variant={blurMode === 'blur' ? 'primary' : 'secondary'} size="sm" onClick={() => setBlurMode('blur')}>
                  Blur
                </Button>
              </div>
              <label className="flex items-center gap-2 text-ink/70 dark:text-paper/70">
                Intensity
                <input type="range" min={4} max={30} value={blurIntensity} onChange={(e) => setBlurIntensity(Number(e.target.value))} className="accent-accent" />
              </label>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}>
          −
        </Button>
        <span className="w-12 text-center font-mono text-xs text-ink/70 dark:text-paper/70">{Math.round(zoom * 100)}%</span>
        <Button variant="secondary" size="sm" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>
          +
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setZoom(1)}>
          100%
        </Button>
        <Button variant="secondary" size="sm" onClick={fitToWidth}>
          Fit to width
        </Button>
        <span className="mx-1 h-5 w-px bg-ink/10 dark:bg-paper/10" />
        <Button variant="secondary" size="sm" onClick={handleClearAll} disabled={annotations.length === 0}>
          Clear all
        </Button>
        <Button variant="secondary" size="sm" onClick={handleStartOver}>
          Start over
        </Button>
        <span className="flex-1" />
        <Button variant="primary" size="sm" onClick={() => handleDownload('image/png')}>
          Flatten &amp; download PNG
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleDownload('image/jpeg')}>
          Download JPEG
        </Button>
      </div>

      <div ref={viewportRef} className="relative h-[70vh] overflow-auto rounded-lg border border-ink/10 bg-ink/5 dark:border-paper/10 dark:bg-paper/5">
        <div className="relative inline-block p-3">
          <canvas
            ref={canvasRef}
            style={{ width: baseBitmap.width * zoom, height: baseBitmap.height * zoom, cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
            className="block touch-none rounded border border-ink/10 bg-white dark:border-paper/10"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          {pendingText && canvasRef.current && (
            <input
              ref={pendingInputRef}
              value={pendingTextValue}
              onChange={(e) => setPendingTextValue(e.target.value)}
              onBlur={commitPendingText}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitPendingText();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelPendingText();
                }
              }}
              style={{
                position: 'absolute',
                left: 12 + pendingText.x * zoom,
                top: 12 + pendingText.y * zoom,
                fontSize: fontSize * zoom,
                color,
                minWidth: 80,
              }}
              className="rounded border border-dashed border-accent bg-white/90 px-1 outline-none"
            />
          )}
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — your screenshot, and everything you draw on it, never leaves your device.
      </span>
    </div>
  );
}
