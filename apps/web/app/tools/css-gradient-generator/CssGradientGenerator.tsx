'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { AngleDial } from './AngleDial';
import { PositionPicker } from './PositionPicker';
import { StopEditor, type EditorStop } from './StopEditor';
import { GRADIENT_PRESETS } from './data/presets';
import {
  buildGradientCss,
  toTailwindArbitraryClass,
  type GradientType,
  type RadialShape,
  type RadialSize,
  type GradientPosition,
} from './utils/gradientCss';
import { generateRandomAngle, generateRandomPosition, generateRandomStops } from './utils/randomGradient';

const GRADIENT_TYPES: { value: GradientType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
  { value: 'conic', label: 'Conic' },
];

const LINEAR_ANGLE_PRESETS: { label: string; angle: number }[] = [
  { label: 'To top', angle: 0 },
  { label: 'To top right', angle: 45 },
  { label: 'To right', angle: 90 },
  { label: 'To bottom right', angle: 135 },
  { label: 'To bottom', angle: 180 },
  { label: 'To bottom left', angle: 225 },
  { label: 'To left', angle: 270 },
  { label: 'To top left', angle: 315 },
];

const RADIAL_SIZES: RadialSize[] = ['closest-side', 'farthest-side', 'closest-corner', 'farthest-corner'];

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `stop-init-${nextId}`;
}

function withIds(stops: { color: string; position: number }[]): EditorStop[] {
  return stops.map((stop) => ({ ...stop, id: makeId() }));
}

export function CssGradientGenerator() {
  const [type, setType] = useState<GradientType>('linear');
  const [stops, setStops] = useState<EditorStop[]>(() => withIds([{ color: '#5B6EF5', position: 0 }, { color: '#E8543A', position: 100 }]));
  const [angle, setAngle] = useState(135);
  const [shape, setShape] = useState<RadialShape>('circle');
  const [size, setSize] = useState<RadialSize>('farthest-corner');
  const [position, setPosition] = useState<GradientPosition>({ x: 50, y: 50 });
  const [showTailwind, setShowTailwind] = useState(false);

  const plainStops = useMemo(() => stops.map((s) => ({ color: s.color, position: s.position })), [stops]);

  const css = useMemo(
    () => buildGradientCss({ type, stops: plainStops, angle, shape, size, position }),
    [type, plainStops, angle, shape, size, position],
  );

  const declaration = `background: ${css};`;
  const tailwindClass = toTailwindArbitraryClass(css);

  function loadPreset(preset: (typeof GRADIENT_PRESETS)[number]) {
    const { config } = preset;
    setType(config.type);
    setStops(withIds(config.stops));
    setAngle(config.angle);
    setShape(config.shape);
    setSize(config.size);
    setPosition(config.position);
  }

  function randomize() {
    setStops(withIds(generateRandomStops()));
    if (type === 'linear' || type === 'conic') setAngle(generateRandomAngle());
    if (type === 'radial' || type === 'conic') setPosition(generateRandomPosition());
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="h-56 w-full rounded-xl border border-ink/10 shadow-sm sm:h-72 dark:border-paper/10"
        style={{ background: css }}
        role="img"
        aria-label="Gradient preview"
      />

      <div className="flex flex-wrap items-center gap-2">
        {GRADIENT_TYPES.map((t) => (
          <Button key={t.value} variant={type === t.value ? 'primary' : 'secondary'} size="sm" onClick={() => setType(t.value)}>
            {t.label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={randomize}>
            Randomize
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink dark:text-paper">Color stops</h3>
            <StopEditor stops={stops} onChange={setStops} />
          </div>

          {type === 'linear' && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-ink dark:text-paper">Angle</h3>
              <div className="flex items-center gap-3">
                <AngleDial angle={angle} onChange={setAngle} />
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={Math.round(angle)}
                  onChange={(event) => setAngle(Number(event.target.value))}
                  aria-label="Angle in degrees"
                  className="h-9 w-20 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
                />
                <span className="text-sm text-ink/50 dark:text-paper/50">deg</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LINEAR_ANGLE_PRESETS.map((preset) => (
                  <Button key={preset.label} variant={angle === preset.angle ? 'primary' : 'secondary'} size="sm" onClick={() => setAngle(preset.angle)}>
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {type === 'radial' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-ink dark:text-paper">Shape &amp; position</h3>
              <div className="flex gap-2">
                <Button variant={shape === 'circle' ? 'primary' : 'secondary'} size="sm" onClick={() => setShape('circle')}>
                  Circle
                </Button>
                <Button variant={shape === 'ellipse' ? 'primary' : 'secondary'} size="sm" onClick={() => setShape('ellipse')}>
                  Ellipse
                </Button>
              </div>
              <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
                Size
                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value as RadialSize)}
                  className="w-fit rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
                >
                  {RADIAL_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-3">
                <PositionPicker position={position} onChange={setPosition} />
                <span className="text-xs text-ink/50 dark:text-paper/50">
                  {Math.round(position.x)}%, {Math.round(position.y)}%
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPosition({ x: 50, y: 50 })}>
                  Center
                </Button>
              </div>
            </div>
          )}

          {type === 'conic' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-ink dark:text-paper">Starting angle &amp; position</h3>
              <div className="flex items-center gap-3">
                <AngleDial angle={angle} onChange={setAngle} />
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={Math.round(angle)}
                  onChange={(event) => setAngle(Number(event.target.value))}
                  aria-label="Starting angle in degrees"
                  className="h-9 w-20 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
                />
                <span className="text-sm text-ink/50 dark:text-paper/50">deg</span>
              </div>
              <div className="flex items-center gap-3">
                <PositionPicker position={position} onChange={setPosition} />
                <span className="text-xs text-ink/50 dark:text-paper/50">
                  {Math.round(position.x)}%, {Math.round(position.y)}%
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPosition({ x: 50, y: 50 })}>
                  Center
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink dark:text-paper">Presets</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {GRADIENT_PRESETS.map((preset) => {
                const previewCss = buildGradientCss(preset.config);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => loadPreset(preset)}
                    title={preset.name}
                    className="group flex flex-col items-center gap-1 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="block h-12 w-full rounded-md border border-ink/10 dark:border-paper/10" style={{ background: previewCss }} />
                    <span className="truncate text-[11px] text-ink/60 group-hover:text-ink dark:text-paper/60 dark:group-hover:text-paper">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink dark:text-paper">CSS</h3>
              <Checkbox label="Tailwind class" checked={showTailwind} onChange={(event) => setShowTailwind(event.target.checked)} />
            </div>
            <div className="flex items-start justify-between gap-2 rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
              <code className="whitespace-pre-wrap break-all">{showTailwind ? tailwindClass : declaration}</code>
              <CopyButton value={showTailwind ? tailwindClass : declaration} />
            </div>
          </div>
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}
