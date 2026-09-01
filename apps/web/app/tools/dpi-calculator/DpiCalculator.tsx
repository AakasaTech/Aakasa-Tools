'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox } from '@aakasa/ui';
import {
  calculateDpi,
  calculateMegapixels,
  calculatePhysicalSize,
  calculatePixelDimensions,
  convertFromInches,
  convertToInches,
  type PhysicalUnit,
} from './utils/dpiCalculations';

type SolveTarget = 'physical' | 'pixels' | 'dpi';

const UNIT_LABELS: Record<PhysicalUnit, string> = { in: 'in', cm: 'cm', mm: 'mm' };

const PRINT_SIZE_PRESETS: { label: string; widthIn: number; heightIn: number }[] = [
  { label: '4×6 in', widthIn: 4, heightIn: 6 },
  { label: '5×7 in', widthIn: 5, heightIn: 7 },
  { label: '8×10 in', widthIn: 8, heightIn: 10 },
  { label: 'A4', widthIn: 8.27, heightIn: 11.69 },
  { label: 'A3', widthIn: 11.69, heightIn: 16.54 },
];

const DPI_PRESETS: { label: string; value: number; note: string }[] = [
  { label: 'Web / Screen', value: 96, note: 'Traditional reference figure for screen display' },
  { label: 'Standard Print', value: 300, note: 'Common photo/document print quality' },
  { label: 'High-Quality Print', value: 600, note: 'Fine art / high-detail print' },
];

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function fieldClass(computed: boolean): string {
  return `w-full rounded-md border px-3 py-2 font-mono text-sm ${
    computed
      ? 'border-accent/40 bg-accent/10 text-ink dark:text-paper'
      : 'border-ink/15 bg-paper text-ink dark:border-paper/15 dark:bg-ink dark:text-paper'
  }`;
}

export function DpiCalculator() {
  const [solveFor, setSolveFor] = useState<SolveTarget>('physical');
  const [pixelWidth, setPixelWidth] = useState(3000);
  const [pixelHeight, setPixelHeight] = useState(2000);
  const [physicalWidthIn, setPhysicalWidthIn] = useState(10);
  const [physicalHeightIn, setPhysicalHeightIn] = useState(2000 / 300);
  const [dpi, setDpi] = useState(300);
  const [unit, setUnit] = useState<PhysicalUnit>('in');
  const [aspectLocked, setAspectLocked] = useState(false);
  const [lockedRatio, setLockedRatio] = useState<number | null>(null);

  const pixelsInputsEditable = solveFor !== 'pixels';
  const physicalInputsEditable = solveFor !== 'physical';
  const dpiInputEditable = solveFor !== 'dpi';

  // The solved group is derived fresh on every render from the other two —
  // never stored as separately-editable state, so there's no way for it
  // to drift out of sync or be edited directly.
  const effectivePixels = useMemo(() => {
    if (solveFor === 'pixels') {
      return calculatePixelDimensions({ width: physicalWidthIn, height: physicalHeightIn }, dpi);
    }
    return { width: pixelWidth, height: pixelHeight };
  }, [solveFor, physicalWidthIn, physicalHeightIn, dpi, pixelWidth, pixelHeight]);

  const effectivePhysicalIn = useMemo(() => {
    if (solveFor === 'physical') {
      return calculatePhysicalSize({ width: pixelWidth, height: pixelHeight }, dpi);
    }
    return { width: physicalWidthIn, height: physicalHeightIn };
  }, [solveFor, pixelWidth, pixelHeight, dpi, physicalWidthIn, physicalHeightIn]);

  const effectiveDpi = useMemo(() => {
    if (solveFor === 'dpi') {
      return calculateDpi({ width: pixelWidth, height: pixelHeight }, { width: physicalWidthIn, height: physicalHeightIn });
    }
    return dpi;
  }, [solveFor, pixelWidth, pixelHeight, physicalWidthIn, physicalHeightIn, dpi]);

  const megapixels = calculateMegapixels(effectivePixels);

  function handleAspectLockToggle(checked: boolean) {
    setAspectLocked(checked);
    if (checked) {
      if (pixelsInputsEditable && pixelHeight > 0) setLockedRatio(pixelWidth / pixelHeight);
      else if (physicalInputsEditable && physicalHeightIn > 0) setLockedRatio(physicalWidthIn / physicalHeightIn);
    } else {
      setLockedRatio(null);
    }
  }

  function handlePixelWidthChange(value: number) {
    setPixelWidth(value);
    if (aspectLocked && lockedRatio) setPixelHeight(Math.round(value / lockedRatio));
  }

  function handlePixelHeightChange(value: number) {
    setPixelHeight(value);
    if (aspectLocked && lockedRatio) setPixelWidth(Math.round(value * lockedRatio));
  }

  function handlePhysicalWidthChange(displayValue: number) {
    const inches = convertToInches(displayValue, unit);
    setPhysicalWidthIn(inches);
    if (aspectLocked && lockedRatio) setPhysicalHeightIn(inches / lockedRatio);
  }

  function handlePhysicalHeightChange(displayValue: number) {
    const inches = convertToInches(displayValue, unit);
    setPhysicalHeightIn(inches);
    if (aspectLocked && lockedRatio) setPhysicalWidthIn(inches * lockedRatio);
  }

  function applyPrintSizePreset(widthIn: number, heightIn: number) {
    setPhysicalWidthIn(widthIn);
    setPhysicalHeightIn(heightIn);
    if (solveFor === 'physical') setSolveFor('pixels');
    setLockedRatio(aspectLocked ? widthIn / heightIn : null);
  }

  function applyDpiPreset(value: number) {
    setDpi(value);
    if (solveFor === 'dpi') setSolveFor('physical');
  }

  const displayPhysicalWidth = round(convertFromInches(effectivePhysicalIn.width, unit), 2);
  const displayPhysicalHeight = round(convertFromInches(effectivePhysicalIn.height, unit), 2);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Solve for</h3>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Pick which value you want calculated — its fields are highlighted and read-only below; the other two stay editable.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={solveFor === 'physical' ? 'primary' : 'secondary'} size="sm" onClick={() => setSolveFor('physical')}>
            Physical size
          </Button>
          <Button variant={solveFor === 'pixels' ? 'primary' : 'secondary'} size="sm" onClick={() => setSolveFor('pixels')}>
            Pixel dimensions
          </Button>
          <Button variant={solveFor === 'dpi' ? 'primary' : 'secondary'} size="sm" onClick={() => setSolveFor('dpi')}>
            DPI / PPI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`flex flex-col gap-2 rounded-lg border p-4 ${solveFor === 'pixels' ? 'border-accent/40 bg-accent/5' : 'border-ink/10 dark:border-paper/10'}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-ink dark:text-paper">Pixel dimensions</h4>
            {solveFor === 'pixels' && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">Computed</span>}
          </div>
          <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
            Width (px)
            <input
              type="number"
              min={1}
              value={Math.round(effectivePixels.width)}
              disabled={!pixelsInputsEditable}
              onChange={(event) => handlePixelWidthChange(Number(event.target.value))}
              className={fieldClass(!pixelsInputsEditable)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
            Height (px)
            <input
              type="number"
              min={1}
              value={Math.round(effectivePixels.height)}
              disabled={!pixelsInputsEditable}
              onChange={(event) => handlePixelHeightChange(Number(event.target.value))}
              className={fieldClass(!pixelsInputsEditable)}
            />
          </label>
          <span className="text-xs text-ink/50 dark:text-paper/50">{round(megapixels, 2)} MP</span>
        </div>

        <div className={`flex flex-col gap-2 rounded-lg border p-4 ${solveFor === 'physical' ? 'border-accent/40 bg-accent/5' : 'border-ink/10 dark:border-paper/10'}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-ink dark:text-paper">Physical size</h4>
            {solveFor === 'physical' && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">Computed</span>}
          </div>
          <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
            Width ({UNIT_LABELS[unit]})
            <input
              type="number"
              min={0}
              step="any"
              value={displayPhysicalWidth}
              disabled={!physicalInputsEditable}
              onChange={(event) => handlePhysicalWidthChange(Number(event.target.value))}
              className={fieldClass(!physicalInputsEditable)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
            Height ({UNIT_LABELS[unit]})
            <input
              type="number"
              min={0}
              step="any"
              value={displayPhysicalHeight}
              disabled={!physicalInputsEditable}
              onChange={(event) => handlePhysicalHeightChange(Number(event.target.value))}
              className={fieldClass(!physicalInputsEditable)}
            />
          </label>
          <div className="flex gap-1">
            {(['in', 'cm', 'mm'] as PhysicalUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`rounded px-2 py-0.5 text-xs ${unit === u ? 'bg-accent text-white' : 'bg-ink/5 text-ink/60 dark:bg-paper/10 dark:text-paper/60'}`}
              >
                {UNIT_LABELS[u]}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex flex-col gap-2 rounded-lg border p-4 ${solveFor === 'dpi' ? 'border-accent/40 bg-accent/5' : 'border-ink/10 dark:border-paper/10'}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-ink dark:text-paper">DPI / PPI</h4>
            {solveFor === 'dpi' && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">Computed</span>}
          </div>
          <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
            Dots/pixels per inch
            <input
              type="number"
              min={1}
              value={round(effectiveDpi, 2)}
              disabled={!dpiInputEditable}
              onChange={(event) => setDpi(Number(event.target.value))}
              className={fieldClass(!dpiInputEditable)}
            />
          </label>
          <div className="flex flex-col gap-1">
            {DPI_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyDpiPreset(preset.value)}
                title={preset.note}
                className="rounded border border-ink/10 px-2 py-1 text-left text-xs text-ink/70 hover:border-accent hover:text-ink dark:border-paper/10 dark:text-paper/70"
              >
                {preset.label} — <span className="font-mono">{preset.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Checkbox label="Lock aspect ratio" checked={aspectLocked} onChange={(event) => handleAspectLockToggle(event.target.checked)} />
        <span className="text-xs text-ink/50 dark:text-paper/50">Keeps width/height proportional as you edit either editable group.</span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Common print sizes</h3>
        <div className="flex flex-wrap gap-1.5">
          {PRINT_SIZE_PRESETS.map((preset) => (
            <Button key={preset.label} variant="secondary" size="sm" onClick={() => applyPrintSizePreset(preset.widthIn, preset.heightIn)}>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border-y border-r border-l-2 border-ink/10 border-l-accent bg-accent/5 p-4 text-sm text-ink dark:border-paper/10 dark:text-paper">
        A <span className="font-mono">{Math.round(effectivePixels.width)}×{Math.round(effectivePixels.height)}px</span> image at{' '}
        <span className="font-mono">{round(effectiveDpi, 2)}</span> DPI prints at{' '}
        <span className="font-mono">
          {displayPhysicalWidth}×{displayPhysicalHeight} {UNIT_LABELS[unit]}
        </span>{' '}
        (<span className="font-mono">{round(megapixels, 2)} MP</span>).
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
