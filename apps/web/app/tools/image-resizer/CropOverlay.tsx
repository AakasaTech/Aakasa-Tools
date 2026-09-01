'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { moveRect, resizeRect, type CropRect, type HandleName } from './utils/cropMath';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  cropRect: CropRect;
  onChange: (rect: CropRect) => void;
  aspectRatio: number | null;
}

type DragMode = { type: 'move' } | { type: 'resize'; handle: HandleName };

const HANDLES: HandleName[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_POSITION_CLASS: Record<HandleName, string> = {
  nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
  n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
  ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
  e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
  se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
  sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
  w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
};

/** A draggable-to-reposition, drag-handle-to-resize crop selection box
 * overlaid on the (possibly display-scaled) source image. All drag math
 * happens in the image's own intrinsic pixel space (via cropMath.ts) —
 * screen-space pointer deltas are divided by `scale` before being applied,
 * so the resulting crop rect is always correct in source-image
 * coordinates regardless of how large or small the preview is shown. */
export function CropOverlay({ imageWidth, imageHeight, displayWidth, displayHeight, cropRect, onChange, aspectRatio }: CropOverlayProps) {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; rect: CropRect } | null>(null);
  const cropRectRef = useRef(cropRect);
  cropRectRef.current = cropRect;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const scale = displayWidth / imageWidth;

  useEffect(() => {
    if (!dragMode) return undefined;
    const bounds = { width: imageWidth, height: imageHeight };

    function handleMove(event: PointerEvent) {
      const start = dragStartRef.current;
      if (!start || !dragMode) return;
      const deltaX = (event.clientX - start.pointerX) / scale;
      const deltaY = (event.clientY - start.pointerY) / scale;

      const next =
        dragMode.type === 'move'
          ? moveRect(start.rect, deltaX, deltaY, bounds)
          : resizeRect(start.rect, dragMode.handle, deltaX, deltaY, aspectRatio, bounds);
      onChangeRef.current(next);
    }
    function handleUp() {
      setDragMode(null);
      dragStartRef.current = null;
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragMode, scale, aspectRatio, imageWidth, imageHeight]);

  function startMove(event: ReactPointerEvent) {
    event.stopPropagation();
    dragStartRef.current = { pointerX: event.clientX, pointerY: event.clientY, rect: cropRectRef.current };
    setDragMode({ type: 'move' });
  }

  function startResize(event: ReactPointerEvent, handle: HandleName) {
    event.stopPropagation();
    dragStartRef.current = { pointerX: event.clientX, pointerY: event.clientY, rect: cropRectRef.current };
    setDragMode({ type: 'resize', handle });
  }

  const rectStyle = {
    left: cropRect.x * scale,
    top: cropRect.y * scale,
    width: cropRect.width * scale,
    height: cropRect.height * scale,
  };

  return (
    <div className="relative select-none" style={{ width: displayWidth, height: displayHeight }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/50" style={{ height: rectStyle.top }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/50" style={{ top: rectStyle.top + rectStyle.height }} />
      <div className="pointer-events-none absolute bg-black/50" style={{ top: rectStyle.top, height: rectStyle.height, left: 0, width: rectStyle.left }} />
      <div
        className="pointer-events-none absolute bg-black/50"
        style={{ top: rectStyle.top, height: rectStyle.height, left: rectStyle.left + rectStyle.width, right: 0 }}
      />

      <div onPointerDown={startMove} className="absolute cursor-move border-2 border-accent" style={rectStyle}>
        {HANDLES.map((handle) => (
          <div
            key={handle}
            onPointerDown={(event) => startResize(event, handle)}
            className={`absolute h-3 w-3 touch-none rounded-full border-2 border-accent bg-white ${HANDLE_POSITION_CLASS[handle]}`}
          />
        ))}
      </div>
    </div>
  );
}
