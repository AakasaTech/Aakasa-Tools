'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { ShadowLayerEditor } from './ShadowLayerEditor';
import { SHADOW_PRESETS, type PresetLayer, type ShadowPreset } from './data/presets';
import { buildBoxShadowCss, type ShadowLayer } from './utils/buildBoxShadow';

type PreviewBackground = 'light' | 'dark';

const PREVIEW_BACKGROUND_COLORS: Record<PreviewBackground, string> = {
  light: '#F0F1F3',
  dark: '#1B1F2A',
};

const DEFAULT_LAYER: Omit<ShadowLayer, 'id'> = {
  offsetX: 0,
  offsetY: 4,
  blur: 8,
  spread: 0,
  color: '#000000',
  alpha: 0.15,
  inset: false,
};

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `layer-${nextId}`;
}

function withIds(layers: PresetLayer[]): ShadowLayer[] {
  return layers.map((layer) => ({ ...layer, id: makeId() }));
}

/** Preset swatches in the gallery only need a CSS string, never real state
 * — so unlike loadPreset (which produces actual layer state and needs
 * stable unique ids for React keys), this skips makeId() entirely rather
 * than mutating the id counter on every render just to throw the ids away. */
function previewCssFor(preset: ShadowPreset): string {
  return buildBoxShadowCss(preset.layers.map((layer) => ({ ...layer, id: '' })));
}

export function BoxShadowGenerator() {
  const [layers, setLayers] = useState<ShadowLayer[]>(() => withIds([DEFAULT_LAYER]));
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>('light');

  const cssValue = useMemo(() => buildBoxShadowCss(layers), [layers]);
  const declaration = `box-shadow: ${cssValue};`;

  function updateLayer(id: string, patch: Partial<ShadowLayer>) {
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
  }

  function removeLayer(id: string) {
    setLayers((prev) => (prev.length <= 1 ? prev : prev.filter((layer) => layer.id !== id)));
  }

  function addLayer() {
    setLayers((prev) => [...prev, { ...DEFAULT_LAYER, id: makeId() }]);
  }

  function moveLayer(id: string, direction: -1 | 1) {
    setLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  function loadPreset(preset: ShadowPreset) {
    setLayers(withIds(preset.layers));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Preview</h3>
          <div className="flex gap-1.5">
            <Button variant={previewBackground === 'light' ? 'primary' : 'secondary'} size="sm" onClick={() => setPreviewBackground('light')}>
              Light backdrop
            </Button>
            <Button variant={previewBackground === 'dark' ? 'primary' : 'secondary'} size="sm" onClick={() => setPreviewBackground('dark')}>
              Dark backdrop
            </Button>
          </div>
        </div>
        <div
          className="flex items-center justify-center rounded-xl p-12 transition-colors sm:p-20"
          style={{ backgroundColor: PREVIEW_BACKGROUND_COLORS[previewBackground] }}
        >
          <div className="h-32 w-48 rounded-lg" style={{ backgroundColor: '#FFFFFF', boxShadow: cssValue }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Presets</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => loadPreset(preset)}
              className="group flex flex-col items-center gap-2 rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex h-16 w-full items-center justify-center rounded-md bg-ink/5 dark:bg-paper/10">
                <div className="h-8 w-12 rounded bg-paper dark:bg-paper" style={{ backgroundColor: '#FFFFFF', boxShadow: previewCssFor(preset) }} />
              </div>
              <span className="text-[11px] text-ink/60 group-hover:text-ink dark:text-paper/60 dark:group-hover:text-paper">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">Shadow layers</h3>
          <Button variant="secondary" size="sm" onClick={addLayer}>
            Add another shadow layer
          </Button>
        </div>
        {layers.map((layer, index) => (
          <ShadowLayerEditor
            key={layer.id}
            layer={layer}
            index={index}
            layerCount={layers.length}
            onChange={(patch) => updateLayer(layer.id, patch)}
            onRemove={() => removeLayer(layer.id)}
            onMoveUp={() => moveLayer(layer.id, -1)}
            onMoveDown={() => moveLayer(layer.id, 1)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink dark:text-paper">CSS</h3>
          <CopyButton value={declaration} size="sm" />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {declaration}
        </pre>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}
