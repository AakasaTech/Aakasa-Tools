'use client';

import { useId } from 'react';
import { Button, Slider } from '@aakasa/ui';
import type { ShadowLayer } from './utils/buildBoxShadow';

interface ShadowLayerEditorProps {
  layer: ShadowLayer;
  index: number;
  layerCount: number;
  onChange: (patch: Partial<ShadowLayer>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function NumberField({
  id,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-8 w-full rounded-md border border-ink/10 bg-transparent px-2 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
    />
  );
}

function SliderField({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <Slider id={id} label={label} min={min} max={max} step={step} value={value} onChange={onChange} />
      <NumberField id={`${id}-number`} min={min} max={max} value={value} onChange={onChange} />
    </div>
  );
}

export function ShadowLayerEditor({ layer, index, layerCount, onChange, onRemove, onMoveUp, onMoveDown }: ShadowLayerEditorProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink dark:text-paper">Layer {index + 1}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} aria-label="Move layer up">
            ↑
          </Button>
          <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={index === layerCount - 1} aria-label="Move layer down">
            ↓
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={layerCount <= 1} className="text-danger">
            Remove
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SliderField label="Offset X" min={-100} max={100} value={layer.offsetX} onChange={(v) => onChange({ offsetX: v })} />
        <SliderField label="Offset Y" min={-100} max={100} value={layer.offsetY} onChange={(v) => onChange({ offsetY: v })} />
        <SliderField label="Blur" min={0} max={150} value={layer.blur} onChange={(v) => onChange({ blur: Math.max(0, v) })} />
        <SliderField label="Spread" min={-50} max={50} value={layer.spread} onChange={(v) => onChange({ spread: v })} />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-ink/70 dark:text-paper/70">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={layer.color}
              onChange={(event) => onChange({ color: event.target.value })}
              aria-label="Shadow color"
              className="h-8 w-8 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
            />
            <input
              type="text"
              value={layer.color}
              onChange={(event) => onChange({ color: event.target.value })}
              spellCheck={false}
              aria-label="Shadow color hex"
              className="h-8 w-24 rounded-md border border-ink/10 bg-transparent px-2 font-mono text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            />
          </div>
        </div>

        <div className="min-w-[10rem] flex-1">
          <SliderField
            label="Opacity"
            min={0}
            max={100}
            value={Math.round(layer.alpha * 100)}
            onChange={(v) => onChange({ alpha: Math.min(1, Math.max(0, v / 100)) })}
          />
        </div>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-ink/70 dark:text-paper/70">
          <input type="checkbox" checked={layer.inset} onChange={(event) => onChange({ inset: event.target.checked })} className="accent-accent" />
          Inset
        </label>
      </div>
    </div>
  );
}
