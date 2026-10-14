'use client';

import { useMemo, useState } from 'react';
import { CopyButton } from '@aakasa/ui';
import { calculateDimensionFromRatio, findNearestCommonRatio, simplifyRatio } from './utils/aspectRatioCalc';

type Mode = 'fromRatio' | 'fromDimensions';

const PRESET_RATIOS: { label: string; width: number; height: number }[] = [
  { label: '16:9', width: 16, height: 9 },
  { label: '4:3', width: 4, height: 3 },
  { label: '1:1', width: 1, height: 1 },
  { label: '21:9', width: 21, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '3:2', width: 3, height: 2 },
  { label: '5:4', width: 5, height: 4 },
];

const PREVIEW_MAX_WIDTH = 260;
const PREVIEW_MAX_HEIGHT = 200;

function PreviewRectangle({ ratioWidth, ratioHeight }: { ratioWidth: number; ratioHeight: number }) {
  const valid = ratioWidth > 0 && ratioHeight > 0;
  const scale = valid ? Math.min(PREVIEW_MAX_WIDTH / ratioWidth, PREVIEW_MAX_HEIGHT / ratioHeight) : 0;
  const boxWidth = valid ? ratioWidth * scale : 0;
  const boxHeight = valid ? ratioHeight * scale : 0;

  return (
    <div
      className="flex items-center justify-center rounded-md border border-ink/10 bg-paper dark:border-paper/10 dark:bg-ink"
      style={{ width: PREVIEW_MAX_WIDTH + 24, height: PREVIEW_MAX_HEIGHT + 24 }}
    >
      {valid ? (
        <div
          style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
          className="flex items-center justify-center rounded border-2 border-accent bg-accent/10 text-xs font-medium text-accent"
        >
          {ratioWidth}:{ratioHeight}
        </div>
      ) : (
        <span className="text-xs text-ink/40 dark:text-paper/40">Enter valid values to preview</span>
      )}
    </div>
  );
}

export function AspectRatioCalculator() {
  const [mode, setMode] = useState<Mode>('fromRatio');

  // Mode A: dimensions from ratio
  const [ratioWidth, setRatioWidth] = useState(16);
  const [ratioHeight, setRatioHeight] = useState(9);
  const [knownDimension, setKnownDimension] = useState(1920);
  const [knownIsWidth, setKnownIsWidth] = useState(true);

  // Mode B: ratio from dimensions
  const [width, setWidth] = useState(2560);
  const [height, setHeight] = useState(1600);

  const computedDimension = useMemo(
    () => calculateDimensionFromRatio(ratioWidth, ratioHeight, knownDimension, knownIsWidth),
    [ratioWidth, ratioHeight, knownDimension, knownIsWidth]
  );
  const exactDimension = useMemo(
    () => (knownIsWidth ? (knownDimension * ratioHeight) / ratioWidth : (knownDimension * ratioWidth) / ratioHeight),
    [ratioWidth, ratioHeight, knownDimension, knownIsWidth]
  );
  const wasRounded = ratioWidth > 0 && ratioHeight > 0 && knownDimension > 0 && computedDimension !== exactDimension;

  const simplified = useMemo(() => simplifyRatio(width, height), [width, height]);
  const isExactCommonRatio = useMemo(
    () => PRESET_RATIOS.some((preset) => preset.width === simplified.ratioWidth && preset.height === simplified.ratioHeight),
    [simplified]
  );
  const nearestCommon = useMemo(
    () => (isExactCommonRatio ? null : findNearestCommonRatio(simplified.decimal)),
    [simplified, isExactCommonRatio]
  );

  const modeAResultLabel = knownIsWidth ? `${knownDimension} × ${computedDimension}` : `${computedDimension} × ${knownDimension}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
        <ModeTab active={mode === 'fromRatio'} onClick={() => setMode('fromRatio')}>
          Dimensions from ratio
        </ModeTab>
        <ModeTab active={mode === 'fromDimensions'} onClick={() => setMode('fromDimensions')}>
          Ratio from dimensions
        </ModeTab>
      </div>

      {mode === 'fromRatio' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">Ratio</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={ratioWidth}
                  onChange={(event) => setRatioWidth(Number(event.target.value))}
                  min={1}
                  className="w-20 rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
                <span className="text-ink/40 dark:text-paper/40">:</span>
                <input
                  type="number"
                  value={ratioHeight}
                  onChange={(event) => setRatioHeight(Number(event.target.value))}
                  min={1}
                  className="w-20 rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_RATIOS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setRatioWidth(preset.width);
                    setRatioHeight(preset.height);
                  }}
                  className="rounded-md bg-ink/5 px-2.5 py-1 text-xs text-ink/70 hover:bg-ink/10 dark:bg-paper/10 dark:text-paper/70 dark:hover:bg-paper/20"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">I know the…</span>
              <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
                <ModeTab active={knownIsWidth} onClick={() => setKnownIsWidth(true)}>
                  Width
                </ModeTab>
                <ModeTab active={!knownIsWidth} onClick={() => setKnownIsWidth(false)}>
                  Height
                </ModeTab>
              </div>
              <input
                type="number"
                value={knownDimension}
                onChange={(event) => setKnownDimension(Number(event.target.value))}
                min={1}
                aria-label={knownIsWidth ? 'Known width' : 'Known height'}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">Result (width × height)</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={modeAResultLabel}
                  aria-label="Calculated dimensions"
                  className="h-11 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
                <CopyButton value={modeAResultLabel} />
              </div>
              {wasRounded && (
                <p className="text-xs text-ink/40 dark:text-paper/40">
                  Rounded to the nearest whole pixel (exact value: {exactDimension.toFixed(2)}).
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <PreviewRectangle ratioWidth={ratioWidth} ratioHeight={ratioHeight} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
                Width
                <input
                  type="number"
                  value={width}
                  onChange={(event) => setWidth(Number(event.target.value))}
                  min={1}
                  className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
                Height
                <input
                  type="number"
                  value={height}
                  onChange={(event) => setHeight(Number(event.target.value))}
                  min={1}
                  className="rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">Simplified ratio</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${simplified.ratioWidth}:${simplified.ratioHeight}`}
                  aria-label="Simplified ratio"
                  className="h-11 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
                <CopyButton value={`${simplified.ratioWidth}:${simplified.ratioHeight}`} />
              </div>
            </div>

            <p className="text-sm text-ink/70 dark:text-paper/70">
              Decimal ratio: <span className="font-mono text-ink dark:text-paper">{simplified.decimal.toFixed(4)}</span>
            </p>

            <p className="text-sm text-ink/70 dark:text-paper/70">
              {isExactCommonRatio ? (
                <>This is exactly the common <span className="font-mono text-ink dark:text-paper">{simplified.ratioWidth}:{simplified.ratioHeight}</span> ratio.</>
              ) : nearestCommon ? (
                <>
                  Nearest common ratio: <span className="font-mono text-ink dark:text-paper">{nearestCommon.ratio}</span>{' '}
                  <span className="text-xs text-ink/40 dark:text-paper/40">(off by {nearestCommon.difference.toFixed(3)} in decimal terms — not an exact match)</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <PreviewRectangle ratioWidth={simplified.ratioWidth} ratioHeight={simplified.ratioHeight} />
          </div>
        </div>
      )}
    </div>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-paper text-ink shadow-sm dark:bg-ink dark:text-paper' : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}
