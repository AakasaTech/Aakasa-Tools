'use client';

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { GradientPosition } from './utils/gradientCss';

interface PositionPickerProps {
  position: GradientPosition;
  onChange: (position: GradientPosition) => void;
  size?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** A simple 2D pad for picking the "at x% y%" origin of a radial or conic
 * gradient — click or drag anywhere inside to move the point. */
export function PositionPicker({ position, onChange, size = 64 }: PositionPickerProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
      onChange({ x: Math.round(x), y: Math.round(y) });
    },
    [onChange],
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return;
    updateFromPointer(event.clientX, event.clientY);
  }

  return (
    <div
      ref={boxRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      aria-label="Gradient position"
      tabIndex={0}
      className="relative shrink-0 cursor-crosshair touch-none rounded-md border border-ink/15 bg-ink/[0.03] outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/15 dark:bg-paper/[0.03]"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-x-0 top-1/2 h-px bg-ink/10 dark:bg-paper/10" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-ink/10 dark:bg-paper/10" />
      <div
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-accent shadow dark:border-ink"
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
      />
    </div>
  );
}
