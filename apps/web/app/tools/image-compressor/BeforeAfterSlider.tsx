'use client';

import { useState, type ChangeEvent } from 'react';

export interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  alt: string;
}

/**
 * Side-by-side before/after image comparison controlled by a single slider.
 * The "before" image sits on top and is clipped to reveal the "after" image
 * underneath — lets a user drag across the compressed output and visually
 * confirm quality is acceptable instead of trusting the size-reduction
 * percentage blindly.
 */
export function BeforeAfterSlider({ beforeUrl, afterUrl, alt }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setPosition(Number(event.target.value));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-ink/10 bg-ink/5 dark:border-paper/10 dark:bg-paper/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt={`${alt} (compressed)`} className="absolute inset-0 h-full w-full object-contain" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt={`${alt} (original)`} className="h-full w-full object-contain" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent"
          style={{ left: `${position}%` }}
          aria-hidden
        />
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-ink/60 px-1.5 py-0.5 text-xs text-paper">
          Original
        </span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-ink/60 px-1.5 py-0.5 text-xs text-paper">
          Compressed
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={handleChange}
        aria-label="Slide to compare original and compressed image"
        className="w-full accent-accent"
      />
    </div>
  );
}
