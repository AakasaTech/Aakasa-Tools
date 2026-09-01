'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton, Slider } from '@aakasa/ui';
import { CornerControl } from './CornerControl';
import { RADIUS_PRESETS } from './data/radiusPresets';
import { buildBorderRadiusCss, type CornerRadius, type CornerValues, type RadiusUnit } from './utils/borderRadiusCss';

const DEFAULT_CORNERS: CornerValues = {
  unit: 'px',
  topLeft: { h: 8, v: 8 },
  topRight: { h: 8, v: 8 },
  bottomRight: { h: 8, v: 8 },
  bottomLeft: { h: 8, v: 8 },
};

const CORNER_KEYS = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
const CORNER_LABELS: Record<(typeof CORNER_KEYS)[number], string> = {
  topLeft: 'Top left',
  topRight: 'Top right',
  bottomRight: 'Bottom right',
  bottomLeft: 'Bottom left',
};

export function BorderRadiusTab() {
  const [corners, setCorners] = useState<CornerValues>(DEFAULT_CORNERS);
  const [linkAll, setLinkAll] = useState(true);
  const [elliptical, setElliptical] = useState(false);

  const maxValue = corners.unit === 'px' ? 200 : 50;

  const cssValue = useMemo(() => buildBorderRadiusCss(corners, elliptical), [corners, elliptical]);
  const declaration = `border-radius: ${cssValue};`;

  function updateAllCorners(patch: Partial<CornerRadius>) {
    setCorners((prev) => {
      const merged = { ...prev.topLeft, ...patch };
      return { ...prev, topLeft: merged, topRight: merged, bottomRight: merged, bottomLeft: merged };
    });
  }

  function updateOneCorner(key: (typeof CORNER_KEYS)[number], patch: Partial<CornerRadius>) {
    setCorners((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function handleLinkAllToggle(next: boolean) {
    setLinkAll(next);
    if (next) {
      setCorners((prev) => ({ ...prev, topRight: prev.topLeft, bottomRight: prev.topLeft, bottomLeft: prev.topLeft }));
    }
  }

  function handleUnitChange(unit: RadiusUnit) {
    setCorners((prev) => ({ ...prev, unit }));
  }

  function loadPreset(preset: (typeof RADIUS_PRESETS)[number]) {
    setCorners({ unit: preset.unit, ...preset.corners });
    setElliptical(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center rounded-xl bg-ink/5 p-10 dark:bg-paper/10">
        <div className="h-40 w-56 bg-accent" style={{ borderRadius: cssValue }} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {RADIUS_PRESETS.map((preset) => (
            <Button key={preset.name} variant="secondary" size="sm" onClick={() => loadPreset(preset)}>
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5">
          <Button variant={corners.unit === 'px' ? 'primary' : 'secondary'} size="sm" onClick={() => handleUnitChange('px')}>
            px
          </Button>
          <Button variant={corners.unit === '%' ? 'primary' : 'secondary'} size="sm" onClick={() => handleUnitChange('%')}>
            %
          </Button>
        </div>
        <Checkbox label="Link all corners" checked={linkAll} onChange={(event) => handleLinkAllToggle(event.target.checked)} />
        <Checkbox label="Elliptical corners" checked={elliptical} onChange={(event) => setElliptical(event.target.checked)} />
      </div>

      {linkAll ? (
        <div className="flex flex-col gap-2 rounded-md border border-ink/10 p-3 dark:border-paper/10">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Slider
                id="radius-all-h"
                label={elliptical ? 'Horizontal' : 'Radius (all corners)'}
                min={0}
                max={maxValue}
                value={corners.topLeft.h}
                onChange={(h) => updateAllCorners({ h })}
              />
            </div>
          </div>
          {elliptical && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Slider id="radius-all-v" label="Vertical" min={0} max={maxValue} value={corners.topLeft.v} onChange={(v) => updateAllCorners({ v })} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CORNER_KEYS.map((key) => (
            <CornerControl
              key={key}
              label={CORNER_LABELS[key]}
              corner={corners[key]}
              unit={corners.unit}
              elliptical={elliptical}
              max={maxValue}
              onChange={(patch) => updateOneCorner(key, patch)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">CSS</h3>
          <CopyButton value={declaration} size="sm" />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {declaration}
        </pre>
      </div>
    </div>
  );
}
