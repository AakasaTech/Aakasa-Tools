'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, type RgbColor } from '@aakasa/color-utils';
import { rgbToCmyk, cmykToRgb, type CmykColor } from './utils/cmykConversion';
import { Button, CopyButton } from '@aakasa/ui';

const DEFAULT_RGB: RgbColor = { r: 52, g: 152, b: 219 };
const HISTORY_LIMIT = 8;
const HISTORY_SETTLE_MS = 500;

function parseIntInRange(raw: string, min: number, max: number): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function randomRgb(): RgbColor {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

function FormatCard({ title, copyValue, children }: { title: string; copyValue: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink dark:text-paper">{title}</span>
        <CopyButton value={copyValue} size="sm" />
      </div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
      {label}
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className={`h-9 w-full rounded-md border bg-paper px-2 font-mono text-sm text-ink outline-none focus:border-accent dark:bg-ink dark:text-paper ${
          error ? 'border-danger' : 'border-ink/15 dark:border-paper/15'
        }`}
      />
      {error && <span className="text-danger">{error}</span>}
    </label>
  );
}

function HexPanel({ rgb, onChange }: { rgb: RgbColor; onChange: (rgb: RgbColor) => void }) {
  const canonical = rgbToHex(rgb);
  const [text, setText] = useState(canonical);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(canonical);
    setError(null);
  }, [canonical]);

  function handleChange(raw: string) {
    setText(raw);
    if (raw.trim() === '') {
      setError(null);
      return;
    }
    const parsed = hexToRgb(raw);
    if (!parsed) {
      setError('Invalid hex color, e.g. #3B82F6 or #38F.');
      return;
    }
    setError(null);
    onChange(parsed);
  }

  return (
    <FormatCard title="HEX" copyValue={canonical}>
      <NumberField label="Hex" value={text} error={error ?? undefined} onChange={handleChange} />
    </FormatCard>
  );
}

function RgbPanel({ rgb, onChange }: { rgb: RgbColor; onChange: (rgb: RgbColor) => void }) {
  const [r, setR] = useState(String(rgb.r));
  const [g, setG] = useState(String(rgb.g));
  const [b, setB] = useState(String(rgb.b));
  const [errors, setErrors] = useState<{ r?: string; g?: string; b?: string }>({});

  useEffect(() => {
    setR(String(rgb.r));
    setG(String(rgb.g));
    setB(String(rgb.b));
    setErrors({});
  }, [rgb]);

  function commit(nextR: string, nextG: string, nextB: string) {
    const rVal = parseIntInRange(nextR, 0, 255);
    const gVal = parseIntInRange(nextG, 0, 255);
    const bVal = parseIntInRange(nextB, 0, 255);
    const rangeError = '0-255';
    setErrors({
      r: nextR.trim() !== '' && rVal === null ? rangeError : undefined,
      g: nextG.trim() !== '' && gVal === null ? rangeError : undefined,
      b: nextB.trim() !== '' && bVal === null ? rangeError : undefined,
    });
    if (rVal !== null && gVal !== null && bVal !== null) {
      onChange({ r: rVal, g: gVal, b: bVal });
    }
  }

  return (
    <FormatCard title="RGB" copyValue={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="R"
          value={r}
          error={errors.r}
          onChange={(v) => {
            setR(v);
            commit(v, g, b);
          }}
        />
        <NumberField
          label="G"
          value={g}
          error={errors.g}
          onChange={(v) => {
            setG(v);
            commit(r, v, b);
          }}
        />
        <NumberField
          label="B"
          value={b}
          error={errors.b}
          onChange={(v) => {
            setB(v);
            commit(r, g, v);
          }}
        />
      </div>
    </FormatCard>
  );
}

function HslPanel({ rgb, onChange }: { rgb: RgbColor; onChange: (rgb: RgbColor) => void }) {
  const canonical = rgbToHsl(rgb);
  const [h, setH] = useState(String(Math.round(canonical.h)));
  const [s, setS] = useState(String(Math.round(canonical.s)));
  const [l, setL] = useState(String(Math.round(canonical.l)));
  const [errors, setErrors] = useState<{ h?: string; s?: string; l?: string }>({});

  useEffect(() => {
    setH(String(Math.round(canonical.h)));
    setS(String(Math.round(canonical.s)));
    setL(String(Math.round(canonical.l)));
    setErrors({});
    // canonical is a fresh object every render; compare by rgb instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rgb]);

  function commit(nextH: string, nextS: string, nextL: string) {
    const hVal = parseIntInRange(nextH, 0, 360);
    const sVal = parseIntInRange(nextS, 0, 100);
    const lVal = parseIntInRange(nextL, 0, 100);
    setErrors({
      h: nextH.trim() !== '' && hVal === null ? '0-360' : undefined,
      s: nextS.trim() !== '' && sVal === null ? '0-100' : undefined,
      l: nextL.trim() !== '' && lVal === null ? '0-100' : undefined,
    });
    if (hVal !== null && sVal !== null && lVal !== null) {
      onChange(hslToRgb({ h: hVal, s: sVal, l: lVal }));
    }
  }

  return (
    <FormatCard title="HSL" copyValue={`hsl(${Math.round(canonical.h)}, ${Math.round(canonical.s)}%, ${Math.round(canonical.l)}%)`}>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="H"
          value={h}
          error={errors.h}
          onChange={(v) => {
            setH(v);
            commit(v, s, l);
          }}
        />
        <NumberField
          label="S %"
          value={s}
          error={errors.s}
          onChange={(v) => {
            setS(v);
            commit(h, v, l);
          }}
        />
        <NumberField
          label="L %"
          value={l}
          error={errors.l}
          onChange={(v) => {
            setL(v);
            commit(h, s, v);
          }}
        />
      </div>
    </FormatCard>
  );
}

function CmykPanel({ rgb, onChange }: { rgb: RgbColor; onChange: (rgb: RgbColor) => void }) {
  const canonical: CmykColor = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const [c, setC] = useState(String(Math.round(canonical.c)));
  const [m, setM] = useState(String(Math.round(canonical.m)));
  const [y, setY] = useState(String(Math.round(canonical.y)));
  const [k, setK] = useState(String(Math.round(canonical.k)));
  const [errors, setErrors] = useState<{ c?: string; m?: string; y?: string; k?: string }>({});

  useEffect(() => {
    setC(String(Math.round(canonical.c)));
    setM(String(Math.round(canonical.m)));
    setY(String(Math.round(canonical.y)));
    setK(String(Math.round(canonical.k)));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rgb]);

  function commit(nextC: string, nextM: string, nextY: string, nextK: string) {
    const cVal = parseIntInRange(nextC, 0, 100);
    const mVal = parseIntInRange(nextM, 0, 100);
    const yVal = parseIntInRange(nextY, 0, 100);
    const kVal = parseIntInRange(nextK, 0, 100);
    setErrors({
      c: nextC.trim() !== '' && cVal === null ? '0-100' : undefined,
      m: nextM.trim() !== '' && mVal === null ? '0-100' : undefined,
      y: nextY.trim() !== '' && yVal === null ? '0-100' : undefined,
      k: nextK.trim() !== '' && kVal === null ? '0-100' : undefined,
    });
    if (cVal !== null && mVal !== null && yVal !== null && kVal !== null) {
      onChange(cmykToRgb(cVal, mVal, yVal, kVal));
    }
  }

  return (
    <FormatCard
      title="CMYK"
      copyValue={`cmyk(${Math.round(canonical.c)}%, ${Math.round(canonical.m)}%, ${Math.round(canonical.y)}%, ${Math.round(canonical.k)}%)`}
    >
      <div className="grid grid-cols-4 gap-2">
        <NumberField
          label="C %"
          value={c}
          error={errors.c}
          onChange={(v) => {
            setC(v);
            commit(v, m, y, k);
          }}
        />
        <NumberField
          label="M %"
          value={m}
          error={errors.m}
          onChange={(v) => {
            setM(v);
            commit(c, v, y, k);
          }}
        />
        <NumberField
          label="Y %"
          value={y}
          error={errors.y}
          onChange={(v) => {
            setY(v);
            commit(c, m, v, k);
          }}
        />
        <NumberField
          label="K %"
          value={k}
          error={errors.k}
          onChange={(v) => {
            setK(v);
            commit(c, m, y, v);
          }}
        />
      </div>
    </FormatCard>
  );
}

export function ColorConverter() {
  const [rgb, setRgb] = useState<RgbColor>(DEFAULT_RGB);
  const [history, setHistory] = useState<string[]>([]);

  // Records a settled color to history once edits pause for a moment,
  // rather than on every keystroke — typing "255" into a field would
  // otherwise spam three separate intermediate entries ("2", "25", "255").
  useEffect(() => {
    const hex = rgbToHex(rgb);
    const timeout = setTimeout(() => {
      setHistory((prev) => (prev[0] === hex ? prev : [hex, ...prev.filter((h) => h !== hex)].slice(0, HISTORY_LIMIT)));
    }, HISTORY_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [rgb]);

  function handleRandom() {
    setRgb(randomRgb());
  }

  const hex = rgbToHex(rgb);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-lg border border-ink/10 dark:border-paper/10"
          style={{ backgroundColor: hex }}
          aria-label={`Color preview: ${hex}`}
        />
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/70">
            <input
              type="color"
              value={hex}
              onChange={(event) => {
                const parsed = hexToRgb(event.target.value);
                if (parsed) setRgb(parsed);
              }}
              aria-label="Color picker"
              className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
            />
            Pick a color
          </label>
          <Button variant="secondary" size="sm" onClick={handleRandom} className="self-start">
            Random color
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HexPanel rgb={rgb} onChange={setRgb} />
        <RgbPanel rgb={rgb} onChange={setRgb} />
        <HslPanel rgb={rgb} onChange={setRgb} />
        <CmykPanel rgb={rgb} onChange={setRgb} />
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Recently viewed this session</span>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  const parsed = hexToRgb(h);
                  if (parsed) setRgb(parsed);
                }}
                title={h}
                aria-label={`Restore color ${h}`}
                className="h-8 w-8 rounded border border-ink/10 dark:border-paper/10"
                style={{ backgroundColor: h }}
              />
            ))}
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored.
      </span>
    </div>
  );
}
