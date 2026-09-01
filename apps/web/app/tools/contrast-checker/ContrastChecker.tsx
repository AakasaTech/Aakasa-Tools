'use client';

import { useEffect, useMemo, useState } from 'react';
import { getContrastRatio, hexToRgb } from '@aakasa/color-utils';
import { Button, CopyButton } from '@aakasa/ui';
import { suggestAccessibleColor } from './utils/suggestPassingColor';
import { simulateColorBlindness, COLOR_BLINDNESS_LABELS, type ColorBlindnessType } from './utils/colorBlindnessSimulation';

const DEFAULT_FOREGROUND = '#767676';
const DEFAULT_BACKGROUND = '#FFFFFF';

type ColorBlindMode = 'none' | ColorBlindnessType;

const COLOR_BLIND_MODES: ColorBlindMode[] = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];

function normalizeHex(value: string): string | null {
  const rgb = hexToRgb(value);
  return rgb ? `#${[rgb.r, rgb.g, rgb.b].map((c) => c.toString(16).padStart(2, '0')).join('')}` : null;
}

interface CheckResult {
  label: string;
  passed: boolean;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  function handleTextChange(raw: string) {
    setText(raw);
    const normalized = normalizeHex(raw);
    if (normalized) onChange(normalized);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-ink/70 dark:text-paper/70">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} color picker`}
          className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
        />
        <input
          type="text"
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
          className="h-9 w-28 rounded-md border border-ink/10 bg-transparent px-2 font-mono text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
        />
        <CopyButton value={value} size="sm" />
      </div>
    </div>
  );
}

function Badge({ label, passed }: CheckResult) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
        passed ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'
      }`}
    >
      <span className="text-ink dark:text-paper">{label}</span>
      <span className="font-medium">{passed ? 'Pass' : 'Fail'}</span>
    </div>
  );
}

export function ContrastChecker() {
  const [foreground, setForeground] = useState(DEFAULT_FOREGROUND);
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>('none');
  const [suggestion, setSuggestion] = useState<{ target: 'foreground' | 'background'; color: string; ratio: number } | null>(null);

  const ratio = useMemo(() => getContrastRatio(foreground, background) ?? 0, [foreground, background]);

  const checks = useMemo(
    () => ({
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    }),
    [ratio],
  );

  function updateForeground(hex: string) {
    setForeground(hex);
    setSuggestion(null);
  }

  function updateBackground(hex: string) {
    setBackground(hex);
    setSuggestion(null);
  }

  function swap() {
    setForeground(background);
    setBackground(foreground);
    setSuggestion(null);
  }

  function handleSuggest(target: 'foreground' | 'background') {
    const fixed = target === 'foreground' ? background : foreground;
    const toAdjust = target === 'foreground' ? foreground : background;
    const color = suggestAccessibleColor(fixed, toAdjust, 4.5);
    const resultingRatio = getContrastRatio(fixed, color) ?? 0;
    setSuggestion({ target, color, ratio: resultingRatio });
  }

  function applySuggestion() {
    if (!suggestion) return;
    if (suggestion.target === 'foreground') setForeground(suggestion.color);
    else setBackground(suggestion.color);
    setSuggestion(null);
  }

  const simulatedForeground = colorBlindMode === 'none' ? foreground : simulateColorBlindness(foreground, colorBlindMode);
  const simulatedBackground = colorBlindMode === 'none' ? background : simulateColorBlindness(background, colorBlindMode);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <ColorField label="Foreground (text)" value={foreground} onChange={updateForeground} />
        <ColorField label="Background" value={background} onChange={updateBackground} />
        <Button variant="secondary" size="sm" onClick={swap}>
          Swap
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-ink/10 p-5 dark:border-paper/10" style={{ backgroundColor: background }}>
        <p style={{ color: foreground, fontSize: 16, fontWeight: 400 }}>Normal text (16px) — The quick brown fox jumps over the lazy dog.</p>
        <p style={{ color: foreground, fontSize: 24, fontWeight: 400 }}>Large text, regular (24px / 18pt)</p>
        <p style={{ color: foreground, fontSize: 18.66, fontWeight: 700 }}>Large text, bold (18.66px / 14pt bold)</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink/60 dark:text-paper/60">Contrast ratio</span>
        <span className="font-mono text-3xl font-semibold text-ink dark:text-paper">{ratio.toFixed(2)}:1</span>
        <CopyButton value={`${ratio.toFixed(2)}:1`} label="Copy ratio" size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Badge label="AA Normal Text (4.5:1)" passed={checks.aaNormal} />
        <Badge label="AA Large Text (3:1)" passed={checks.aaLarge} />
        <Badge label="AAA Normal Text (7:1)" passed={checks.aaaNormal} />
        <Badge label="AAA Large Text (4.5:1)" passed={checks.aaaLarge} />
      </div>

      {!checks.aaNormal && (
        <div className="flex flex-col gap-2 rounded-md border border-ink/10 p-3 dark:border-paper/10">
          <p className="text-sm text-ink/70 dark:text-paper/70">
            This combination doesn&apos;t meet AA for normal text. Suggest a nearby color that would pass:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleSuggest('foreground')}>
              Adjust foreground
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleSuggest('background')}>
              Adjust background
            </Button>
          </div>
          {suggestion && (
            <div className="flex items-center gap-3 rounded-md bg-ink/5 p-2 dark:bg-paper/10">
              <span className="h-8 w-8 shrink-0 rounded border border-ink/10 dark:border-paper/10" style={{ backgroundColor: suggestion.color }} />
              <div className="flex flex-col">
                <span className="font-mono text-sm text-ink dark:text-paper">{suggestion.color}</span>
                <span className="text-xs text-ink/50 dark:text-paper/50">would achieve {suggestion.ratio.toFixed(2)}:1</span>
              </div>
              <Button variant="primary" size="sm" onClick={applySuggestion} className="ml-auto">
                Apply
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink dark:text-paper">Color vision simulation</h3>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_BLIND_MODES.map((mode) => (
            <Button key={mode} variant={colorBlindMode === mode ? 'primary' : 'secondary'} size="sm" onClick={() => setColorBlindMode(mode)}>
              {mode === 'none' ? 'Normal vision' : COLOR_BLINDNESS_LABELS[mode]}
            </Button>
          ))}
        </div>
        <div
          className="flex items-center justify-center rounded-md border border-ink/10 p-4 dark:border-paper/10"
          style={{ backgroundColor: simulatedBackground }}
        >
          <span style={{ color: simulatedForeground, fontSize: 18 }}>Sample text under this simulation</span>
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Approximate only — a rough sense of how this pair might look under a color vision deficiency, not a clinically precise simulation.
        </p>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}
