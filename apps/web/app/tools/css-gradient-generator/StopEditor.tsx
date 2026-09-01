'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { hexToRgb, rgbToHex } from '@aakasa/color-utils';
import { Button } from '@aakasa/ui';
import { buildLinearGradient, type ColorStop } from './utils/gradientCss';

export interface EditorStop extends ColorStop {
  id: string;
}

interface StopEditorProps {
  stops: EditorStop[];
  onChange: (stops: EditorStop[]) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `stop-${Date.now()}-${nextId}`;
}

/** The color at a given position, linearly interpolated between whichever
 * two stops bracket it — used so clicking the bar to add a stop drops in a
 * color that matches what's already rendered there, instead of an
 * arbitrary default that would visibly jump the gradient. */
function interpolateColor(stops: ColorStop[], position: number): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return '#888888';
  if (position <= first.position) return first.color;
  if (position >= last.position) return last.color;

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (!a || !b) continue;
    if (position >= a.position && position <= b.position) {
      const t = (position - a.position) / (b.position - a.position || 1);
      const rgbA = hexToRgb(a.color) ?? { r: 0, g: 0, b: 0 };
      const rgbB = hexToRgb(b.color) ?? { r: 0, g: 0, b: 0 };
      return rgbToHex({
        r: rgbA.r + (rgbB.r - rgbA.r) * t,
        g: rgbA.g + (rgbB.g - rgbA.g) * t,
        b: rgbA.b + (rgbB.b - rgbA.b) * t,
      });
    }
  }
  return first.color;
}

export function StopEditor({ stops, onChange }: StopEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Refs so the window-level drag listeners (set up once per drag, not on
  // every position update) always see the latest stops/onChange without
  // needing to depend on them and re-subscribe on every pointermove.
  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!draggingId) return undefined;

    function handleMove(event: PointerEvent) {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
      // Only the dragged stop's position changes — every other stop keeps
      // its own position untouched, regardless of how many stops exist.
      onChangeRef.current(stopsRef.current.map((stop) => (stop.id === draggingId ? { ...stop, position: round(pct) } : stop)));
    }
    function handleUp() {
      setDraggingId(null);
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingId]);

  function handleBarPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = round(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100));
    const newStop: EditorStop = { id: makeId(), color: interpolateColor(stops, pct), position: pct };
    onChange([...stops, newStop]);
  }

  function handleMarkerPointerDown(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    setDraggingId(id);
  }

  function updateStop(id: string, patch: Partial<Pick<EditorStop, 'color' | 'position'>>) {
    onChange(stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)));
  }

  function removeStop(id: string) {
    if (stops.length <= 2) return;
    onChange(stops.filter((stop) => stop.id !== id));
  }

  function addStop() {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const last = sorted[sorted.length - 1];
    const secondLast = sorted[sorted.length - 2];
    const pct = last && secondLast ? round((last.position + secondLast.position) / 2) : 50;
    onChange([...stops, { id: makeId(), color: interpolateColor(stops, pct), position: pct }]);
  }

  const barPreviewCss = buildLinearGradient(
    stops.map((s) => ({ color: s.color, position: s.position })),
    90,
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div
          ref={barRef}
          onPointerDown={handleBarPointerDown}
          role="presentation"
          className="relative h-10 w-full cursor-copy touch-none rounded-md border border-ink/15 dark:border-paper/15"
          style={{ background: barPreviewCss }}
          title="Click to add a color stop"
        >
          {stops.map((stop) => (
            <button
              key={stop.id}
              type="button"
              aria-label={`Stop at ${stop.position}%`}
              onPointerDown={(event) => handleMarkerPointerDown(event, stop.id)}
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-paper shadow ring-1 ring-ink/20 active:cursor-grabbing dark:border-ink dark:ring-paper/30"
              style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">Click the bar to add a stop, drag a marker to reposition it.</p>
      </div>

      <div className="flex flex-col gap-2">
        {stops
          .map((stop, index) => ({ stop, index }))
          .sort((a, b) => a.stop.position - b.stop.position)
          .map(({ stop }) => (
            <div key={stop.id} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                aria-label="Stop color"
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
              />
              <input
                type="text"
                value={stop.color}
                onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                spellCheck={false}
                aria-label="Stop color hex"
                className="h-8 w-24 rounded-md border border-ink/10 bg-transparent px-2 font-mono text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(stop.position)}
                onChange={(event) => updateStop(stop.id, { position: clamp(Number(event.target.value), 0, 100) })}
                aria-label="Stop position percent"
                className="h-8 w-16 rounded-md border border-ink/10 bg-transparent px-2 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
              />
              <span className="text-xs text-ink/40 dark:text-paper/40">%</span>
              <Button variant="ghost" size="sm" onClick={() => removeStop(stop.id)} disabled={stops.length <= 2}>
                Remove
              </Button>
            </div>
          ))}
      </div>

      <Button variant="secondary" size="sm" onClick={addStop} className="self-start">
        Add stop
      </Button>
    </div>
  );
}
