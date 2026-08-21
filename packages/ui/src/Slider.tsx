'use client';

import type { ChangeEvent } from 'react';

export interface SliderProps {
  id?: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

/**
 * A labeled range input with the current value shown numerically — not just
 * implied by handle position. Native `<input type="range">` is keyboard
 * operable (arrow keys, Home/End, Page Up/Down) out of the box.
 */
export function Slider({ id, label, min, max, step = 1, value, onChange }: SliderProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value));
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-ink/70 dark:text-paper/70">
        <label htmlFor={inputId}>{label}</label>
        <span className="font-mono text-ink dark:text-paper">{value}</span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="mt-1 w-full accent-accent"
      />
    </div>
  );
}
