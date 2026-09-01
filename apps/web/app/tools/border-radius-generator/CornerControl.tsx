'use client';

import { useId } from 'react';
import { Slider } from '@aakasa/ui';
import type { CornerRadius, RadiusUnit } from './utils/borderRadiusCss';

interface CornerControlProps {
  label: string;
  corner: CornerRadius;
  unit: RadiusUnit;
  elliptical: boolean;
  max: number;
  onChange: (patch: Partial<CornerRadius>) => void;
}

function NumberField({ value, max, unit, onChange }: { value: number; max: number; unit: RadiusUnit; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={max}
        value={Math.round(value * 100) / 100}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 w-16 rounded-md border border-ink/10 bg-transparent px-2 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
      />
      <span className="text-xs text-ink/40 dark:text-paper/40">{unit}</span>
    </div>
  );
}

export function CornerControl({ label, corner, unit, elliptical, max, onChange }: CornerControlProps) {
  const idBase = useId();

  return (
    <div className="flex flex-col gap-2 rounded-md border border-ink/10 p-2.5 dark:border-paper/10">
      <span className="text-xs font-medium text-ink/70 dark:text-paper/70">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Slider id={`${idBase}-h`} label={elliptical ? 'Horizontal' : 'Radius'} min={0} max={max} value={corner.h} onChange={(h) => onChange({ h })} />
        </div>
        <NumberField value={corner.h} max={max} unit={unit} onChange={(h) => onChange({ h })} />
      </div>
      {elliptical && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Slider id={`${idBase}-v`} label="Vertical" min={0} max={max} value={corner.v} onChange={(v) => onChange({ v })} />
          </div>
          <NumberField value={corner.v} max={max} unit={unit} onChange={(v) => onChange({ v })} />
        </div>
      )}
    </div>
  );
}
