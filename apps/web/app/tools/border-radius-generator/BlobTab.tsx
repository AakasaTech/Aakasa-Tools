'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, CopyButton, Slider } from '@aakasa/ui';
import { generateRandomBlob } from './utils/blobGenerator';
import { buildBorderRadiusCss, type CornerValues } from './utils/borderRadiusCss';

const MAX_HISTORY = 8;
const INITIAL_COMPLEXITY = 50;

interface BlobHistoryState {
  history: CornerValues[];
  index: number;
}

export function BlobTab() {
  const [complexity, setComplexity] = useState(INITIAL_COMPLEXITY);
  const [fillColor, setFillColor] = useState('#5B6EF5');
  const [outlineOnly, setOutlineOnly] = useState(false);
  const [state, setState] = useState<BlobHistoryState>(() => ({ history: [generateRandomBlob(INITIAL_COMPLEXITY)], index: 0 }));

  const blob = state.history[state.index] ?? state.history[state.history.length - 1] ?? generateRandomBlob(INITIAL_COMPLEXITY);
  const cssValue = useMemo(() => buildBorderRadiusCss(blob, true), [blob]);
  const declaration = `border-radius: ${cssValue};`;

  function randomize() {
    const next = generateRandomBlob(complexity);
    setState((prev) => {
      const truncated = prev.history.slice(0, prev.index + 1);
      let updated = [...truncated, next];
      let newIndex = updated.length - 1;
      if (updated.length > MAX_HISTORY) {
        const overflow = updated.length - MAX_HISTORY;
        updated = updated.slice(overflow);
        newIndex -= overflow;
      }
      return { history: updated, index: newIndex };
    });
  }

  function goBack() {
    setState((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }));
  }

  function goForward() {
    setState((prev) => ({ ...prev, index: Math.min(prev.history.length - 1, prev.index + 1) }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center rounded-xl bg-ink/5 p-10 dark:bg-paper/10">
        <div
          className="h-48 w-48"
          style={{
            borderRadius: cssValue,
            backgroundColor: outlineOnly ? 'transparent' : fillColor,
            border: outlineOnly ? `3px solid ${fillColor}` : 'none',
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={randomize}>
          Randomize
        </Button>
        <Button variant="ghost" size="sm" onClick={goBack} disabled={state.index === 0}>
          ← Previous
        </Button>
        <Button variant="ghost" size="sm" onClick={goForward} disabled={state.index === state.history.length - 1}>
          Next →
        </Button>
        <span className="text-xs text-ink/40 dark:text-paper/40">
          {state.index + 1} of {state.history.length} recent
        </span>
      </div>

      <div className="max-w-sm">
        <Slider id="blob-complexity" label="Complexity" min={0} max={100} value={complexity} onChange={setComplexity} />
        <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">Higher complexity produces more pronounced, wavy asymmetry on the next randomize.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="blob-fill-color" className="text-sm text-ink/70 dark:text-paper/70">
            Fill color
          </label>
          <input
            id="blob-fill-color"
            type="color"
            value={fillColor}
            onChange={(event) => setFillColor(event.target.value)}
            className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
          />
        </div>
        <Checkbox label="Outline only" checked={outlineOnly} onChange={(event) => setOutlineOnly(event.target.checked)} />
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
    </div>
  );
}
