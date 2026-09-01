'use client';

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

interface AngleDialProps {
  /** 0-360, CSS gradient angle convention: 0 = up, increases clockwise. */
  angle: number;
  onChange: (angle: number) => void;
  size?: number;
}

/** A draggable rotary dial for picking an angle 0-360°, matching CSS
 * gradient angle convention (0deg points up, 90deg points right). Always
 * paired with a plain numeric input alongside it in the parent — the dial
 * is fast for rough adjustment, the number field is what you use when a
 * design spec calls for exactly 137deg. */
export function AngleDial({ angle, onChange, size = 64 }: AngleDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = dialRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
      onChange(Math.round(deg));
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange((Math.round(angle) + 1 + 360) % 360);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange((Math.round(angle) - 1 + 360) % 360);
    }
  }

  const angleRad = (angle * Math.PI) / 180;
  const handleRadius = size / 2 - 6;
  const handleX = size / 2 + handleRadius * Math.sin(angleRad);
  const handleY = size / 2 - handleRadius * Math.cos(angleRad);

  return (
    <div
      ref={dialRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Gradient angle"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(angle)}
      tabIndex={0}
      className="relative shrink-0 cursor-pointer touch-none rounded-full border border-ink/15 bg-paper outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/15 dark:bg-ink"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-px w-[calc(50%-6px)] origin-left bg-ink/25 dark:bg-paper/25"
        style={{ transform: `rotate(${angle - 90}deg)` }}
      />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/30 dark:bg-paper/30" />
      <div
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-accent shadow dark:border-ink"
        style={{ left: handleX, top: handleY }}
      />
    </div>
  );
}
