'use client';

import { useMemo, useState } from 'react';
import { CopyButton, Slider } from '@aakasa/ui';
import {
  calculateClamp,
  evaluateFluidSizePx,
  generateTypeScale,
  ASSUMED_ROOT_FONT_SIZE_PX,
  type ScaleEntry,
} from './utils/fluidTypeCalc';

type SizeUnit = 'px' | 'rem';

const SCALE_RATIOS = [
  { label: '1.125 (Major Second)', value: 1.125 },
  { label: '1.2 (Minor Third)', value: 1.2 },
  { label: '1.25 (Major Third)', value: 1.25 },
  { label: '1.333 (Perfect Fourth)', value: 1.333 },
  { label: '1.5 (Perfect Fifth)', value: 1.5 },
  { label: '1.618 (Golden Ratio)', value: 1.618 },
];

const PREVIEW_PANEL_MAX_WIDTH = 700;
const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog.';

function toPx(value: number, unit: SizeUnit): number {
  return unit === 'px' ? value : value * ASSUMED_ROOT_FONT_SIZE_PX;
}

function fromPx(px: number, unit: SizeUnit): number {
  return unit === 'px' ? px : px / ASSUMED_ROOT_FONT_SIZE_PX;
}

export function FluidTypographyCalculator() {
  const [unit, setUnit] = useState<SizeUnit>('px');
  const [minSize, setMinSize] = useState(16);
  const [maxSize, setMaxSize] = useState(24);
  const [minViewport, setMinViewport] = useState(320);
  const [maxViewport, setMaxViewport] = useState(1240);
  const [previewViewport, setPreviewViewport] = useState(780);
  const [ratio, setRatio] = useState(1.25);
  const [showScale, setShowScale] = useState(false);

  function handleUnitChange(nextUnit: SizeUnit) {
    if (nextUnit === unit) return;
    setMinSize(Number(fromPx(toPx(minSize, unit), nextUnit).toFixed(4)));
    setMaxSize(Number(fromPx(toPx(maxSize, unit), nextUnit).toFixed(4)));
    setUnit(nextUnit);
  }

  const minSizePx = toPx(minSize, unit);
  const maxSizePx = toPx(maxSize, unit);
  const viewportValid = maxViewport > minViewport;

  const clampResult = useMemo(() => {
    if (!viewportValid) return null;
    try {
      return calculateClamp(minSizePx, maxSizePx, minViewport, maxViewport);
    } catch {
      return null;
    }
  }, [minSizePx, maxSizePx, minViewport, maxViewport, viewportValid]);

  const previewFontSizePx = viewportValid
    ? evaluateFluidSizePx(minSizePx, maxSizePx, minViewport, maxViewport, previewViewport)
    : minSizePx;

  const previewBoxWidth = Math.min(previewViewport, PREVIEW_PANEL_MAX_WIDTH);

  const typeScale: ScaleEntry[] = useMemo(() => {
    if (!viewportValid) return [];
    return generateTypeScale(minSizePx, maxSizePx, ratio, minViewport, maxViewport);
  }, [minSizePx, maxSizePx, ratio, minViewport, maxViewport, viewportValid]);

  const cssDeclaration = clampResult ? `font-size: ${clampResult.css};` : '';

  const scaleCssOutput = typeScale
    .map((entry) => `--font-size-${entry.name}: ${entry.css};`)
    .join('\n');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink dark:text-paper">Font size</span>
            <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
              {(['px', 'rem'] as SizeUnit[]).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleUnitChange(choice)}
                  aria-pressed={unit === choice}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    unit === choice
                      ? 'bg-paper text-ink shadow-sm dark:bg-ink dark:text-paper'
                      : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
              Min size ({unit}) at min viewport
              <input
                type="number"
                value={minSize}
                onChange={(event) => setMinSize(Number(event.target.value))}
                step={unit === 'px' ? 1 : 0.1}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
              Max size ({unit}) at max viewport
              <input
                type="number"
                value={maxSize}
                onChange={(event) => setMaxSize(Number(event.target.value))}
                step={unit === 'px' ? 1 : 0.1}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
              Min viewport (px)
              <input
                type="number"
                value={minViewport}
                onChange={(event) => setMinViewport(Number(event.target.value))}
                step={10}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
              Max viewport (px)
              <input
                type="number"
                value={maxViewport}
                onChange={(event) => setMaxViewport(Number(event.target.value))}
                step={10}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
            </label>
          </div>
          {!viewportValid && (
            <p role="alert" className="text-xs text-danger">
              Max viewport must be greater than min viewport.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
              <span>CSS</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={cssDeclaration}
                aria-label="Generated clamp() declaration"
                className="h-11 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
              <CopyButton value={cssDeclaration} disabled={!cssDeclaration} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink dark:text-paper">Live preview</span>
            <span className="font-mono text-xs text-ink/50 dark:text-paper/50">
              viewport: {previewViewport}px → {previewFontSizePx.toFixed(2)}px ({(previewFontSizePx / ASSUMED_ROOT_FONT_SIZE_PX).toFixed(3)}rem)
            </span>
          </div>

          <Slider label="Preview viewport width (px)" min={280} max={1920} value={previewViewport} onChange={setPreviewViewport} />

          <div className="overflow-x-auto rounded-md border border-ink/10 bg-paper p-4 dark:border-paper/10 dark:bg-ink">
            <div
              style={{ width: `${previewBoxWidth}px` }}
              className="flex min-h-[8rem] items-center justify-center rounded border border-dashed border-ink/20 p-4 dark:border-paper/20"
            >
              <p style={{ fontSize: `${previewFontSizePx}px` }} className="text-center text-ink dark:text-paper">
                {SAMPLE_TEXT}
              </p>
            </div>
          </div>
          <p className="text-xs text-ink/40 dark:text-paper/40">
            Drag the slider to simulate different viewport widths — the text size above is computed with the exact same formula as the
            generated CSS, not the browser&apos;s own live window width.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-4 dark:border-paper/10">
        <button type="button" onClick={() => setShowScale((value) => !value)} className="w-fit text-sm font-medium text-accent underline">
          {showScale ? 'Hide' : 'Generate'} full type scale
        </button>

        {showScale && (
          <div className="flex flex-col gap-3">
            <label className="flex w-fit flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
              Scale ratio
              <select
                value={ratio}
                onChange={(event) => setRatio(Number(event.target.value))}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
              >
                {SCALE_RATIOS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="overflow-x-auto rounded-md border border-ink/10 dark:border-paper/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 dark:border-paper/10">
                    <th className="p-2 font-medium">Name</th>
                    <th className="p-2 font-medium">Range</th>
                    <th className="p-2 font-medium">clamp()</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map((entry) => (
                    <tr key={entry.name} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                      <td className="p-2 font-medium">{entry.name}</td>
                      <td className="whitespace-nowrap p-2 font-mono text-xs text-ink/60 dark:text-paper/60">
                        {entry.minSizePx.toFixed(1)}–{entry.maxSizePx.toFixed(1)}px
                      </td>
                      <td className="whitespace-nowrap p-2 font-mono text-xs">{entry.css}</td>
                      <td className="p-2">
                        <CopyButton value={`font-size: ${entry.css};`} label="Copy" size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2">
              <CopyButton value={scaleCssOutput} label="Copy all as CSS custom properties" disabled={!scaleCssOutput} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
