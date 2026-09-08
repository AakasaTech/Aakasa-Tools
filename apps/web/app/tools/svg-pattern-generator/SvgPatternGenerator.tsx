'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { hexToRgb } from '@aakasa/color-utils';
import { Button, CopyButton } from '@aakasa/ui';
import {
  generateDotsPattern,
  generateStripesPattern,
  generateGridPattern,
  generateCheckerboardPattern,
  generateWavesPattern,
  generateTrianglesPattern,
  generateHexagonPattern,
  tileToFlatSvg,
  tileToPatternSvg,
  type StripeOrientation,
  type TriangleDiagonal,
  type GeneratedPattern,
} from './utils/patternGenerators';
import { buildCssBackgroundSnippet, rasterizeTiledPng } from './utils/exportFormats';

type PatternType = 'dots' | 'stripes' | 'grid' | 'checkerboard' | 'waves' | 'triangles' | 'hexagons';

const PATTERN_LABELS: Record<PatternType, string> = {
  dots: 'Dots',
  stripes: 'Stripes',
  grid: 'Grid',
  checkerboard: 'Checkerboard',
  waves: 'Waves',
  triangles: 'Triangles',
  hexagons: 'Hexagons',
};

function withOpacity(hex: string, opacityPercent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(opacityPercent / 100).toFixed(2)})`;
}

function randomHex(): string {
  const value = Math.floor(Math.random() * 0xffffff);
  return `#${value.toString(16).padStart(6, '0')}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
      {label}
      {children}
    </label>
  );
}

function ColorOpacityField({
  label,
  color,
  opacity,
  onColorChange,
  onOpacityChange,
}: {
  label: string;
  color: string;
  opacity: number;
  onColorChange: (hex: string) => void;
  onOpacityChange: (opacity: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-ink/10 bg-transparent p-0.5 dark:border-paper/10"
        />
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="w-10 text-right font-mono text-xs">{opacity}%</span>
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <ControlGroup label={`${label}: ${value}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-accent"
      />
    </ControlGroup>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink/70 dark:text-paper/70">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// --- Per-pattern-type option state ---

interface DotsState {
  color: string;
  colorOpacity: number;
  backgroundColor: string;
  radius: number;
  spacing: number;
}
interface StripesState {
  color: string;
  colorOpacity: number;
  backgroundColor: string;
  stripeWidth: number;
  orientation: StripeOrientation;
}
interface GridState {
  color: string;
  colorOpacity: number;
  backgroundColor: string;
  spacing: number;
  lineWidth: number;
}
interface CheckerboardState {
  colorA: string;
  colorB: string;
  squareSize: number;
}
interface WavesState {
  color: string;
  colorOpacity: number;
  backgroundColor: string;
  amplitude: number;
  wavelength: number;
  rowSpacing: number;
  strokeWidth: number;
}
interface TrianglesState {
  colorA: string;
  colorB: string;
  size: number;
  diagonal: TriangleDiagonal;
}
interface HexagonsState {
  color: string;
  colorOpacity: number;
  backgroundColor: string;
  size: number;
  strokeWidth: number;
}

const STRIPE_ORIENTATIONS: { value: StripeOrientation; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'diagonal-right', label: 'Diagonal ↗' },
  { value: 'diagonal-left', label: 'Diagonal ↖' },
];

const TRIANGLE_DIAGONALS: { value: TriangleDiagonal; label: string }[] = [
  { value: 'tl-br', label: '↘ Top-left to bottom-right' },
  { value: 'tr-bl', label: '↙ Top-right to bottom-left' },
];

const PNG_PIXELS_PER_TILE = 128;
const PNG_TILE_COUNT = 4;

export function SvgPatternGenerator() {
  const [patternType, setPatternType] = useState<PatternType>('hexagons');

  const [dots, setDots] = useState<DotsState>({ color: '#5B6EF5', colorOpacity: 100, backgroundColor: '#F5F5F7', radius: 6, spacing: 24 });
  const [stripes, setStripes] = useState<StripesState>({
    color: '#5B6EF5',
    colorOpacity: 100,
    backgroundColor: '#F5F5F7',
    stripeWidth: 10,
    orientation: 'diagonal-right',
  });
  const [grid, setGrid] = useState<GridState>({ color: '#5B6EF5', colorOpacity: 60, backgroundColor: '#F5F5F7', spacing: 24, lineWidth: 1 });
  const [checkerboard, setCheckerboard] = useState<CheckerboardState>({ colorA: '#5B6EF5', colorB: '#F5F5F7', squareSize: 24 });
  const [waves, setWaves] = useState<WavesState>({
    color: '#5B6EF5',
    colorOpacity: 100,
    backgroundColor: '#F5F5F7',
    amplitude: 8,
    wavelength: 40,
    rowSpacing: 24,
    strokeWidth: 2,
  });
  const [triangles, setTriangles] = useState<TrianglesState>({ colorA: '#5B6EF5', colorB: '#F5F5F7', size: 32, diagonal: 'tl-br' });
  const [hexagons, setHexagons] = useState<HexagonsState>({
    color: '#5B6EF5',
    colorOpacity: 100,
    backgroundColor: '#F5F5F7',
    size: 20,
    strokeWidth: 1,
  });

  const pattern: GeneratedPattern = useMemo(() => {
    switch (patternType) {
      case 'dots':
        return generateDotsPattern({ color: withOpacity(dots.color, dots.colorOpacity), backgroundColor: dots.backgroundColor, radius: dots.radius, spacing: dots.spacing });
      case 'stripes':
        return generateStripesPattern({
          color: withOpacity(stripes.color, stripes.colorOpacity),
          backgroundColor: stripes.backgroundColor,
          stripeWidth: stripes.stripeWidth,
          orientation: stripes.orientation,
        });
      case 'grid':
        return generateGridPattern({ color: withOpacity(grid.color, grid.colorOpacity), backgroundColor: grid.backgroundColor, spacing: grid.spacing, lineWidth: grid.lineWidth });
      case 'checkerboard':
        return generateCheckerboardPattern({ colorA: checkerboard.colorA, colorB: checkerboard.colorB, squareSize: checkerboard.squareSize });
      case 'waves':
        return generateWavesPattern({
          color: withOpacity(waves.color, waves.colorOpacity),
          backgroundColor: waves.backgroundColor,
          amplitude: waves.amplitude,
          wavelength: waves.wavelength,
          rowSpacing: waves.rowSpacing,
          strokeWidth: waves.strokeWidth,
        });
      case 'triangles':
        return generateTrianglesPattern({ colorA: triangles.colorA, colorB: triangles.colorB, size: triangles.size, diagonal: triangles.diagonal });
      case 'hexagons':
        return generateHexagonPattern({
          color: withOpacity(hexagons.color, hexagons.colorOpacity),
          backgroundColor: hexagons.backgroundColor,
          size: hexagons.size,
          strokeWidth: hexagons.strokeWidth,
        });
    }
  }, [patternType, dots, stripes, grid, checkerboard, waves, triangles, hexagons]);

  const flatSvg = useMemo(() => tileToFlatSvg(pattern), [pattern]);
  const cssSnippet = useMemo(
    () => buildCssBackgroundSnippet(flatSvg, pattern.tileSize.width, pattern.tileSize.height),
    [flatSvg, pattern]
  );

  // Some tile sizes (hexagons' √3 factor in particular) produce long
  // floating-point coordinates whose string form isn't guaranteed
  // byte-identical between Node's SSR pass and the browser's own JS
  // engine — enough of a divergence in this very long data-URI string to
  // trip a React hydration mismatch. Rendering the background-image only
  // after mount (identical, empty markup on both the server pass and the
  // first client render) sidesteps that entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  function handleRandomize() {
    switch (patternType) {
      case 'dots':
        setDots((prev) => ({ ...prev, color: randomHex(), radius: 3 + Math.floor(Math.random() * 10), spacing: 16 + Math.floor(Math.random() * 30) }));
        break;
      case 'stripes':
        setStripes((prev) => ({ ...prev, color: randomHex(), stripeWidth: 4 + Math.floor(Math.random() * 16) }));
        break;
      case 'grid':
        setGrid((prev) => ({ ...prev, color: randomHex(), spacing: 12 + Math.floor(Math.random() * 30) }));
        break;
      case 'checkerboard':
        setCheckerboard((prev) => ({ ...prev, colorA: randomHex(), colorB: randomHex(), squareSize: 12 + Math.floor(Math.random() * 24) }));
        break;
      case 'waves':
        setWaves((prev) => ({
          ...prev,
          color: randomHex(),
          amplitude: 4 + Math.floor(Math.random() * 10),
          wavelength: 24 + Math.floor(Math.random() * 30),
        }));
        break;
      case 'triangles':
        setTriangles((prev) => ({ ...prev, colorA: randomHex(), colorB: randomHex(), size: 16 + Math.floor(Math.random() * 30) }));
        break;
      case 'hexagons':
        setHexagons((prev) => ({ ...prev, color: randomHex(), size: 12 + Math.floor(Math.random() * 20) }));
        break;
    }
  }

  function handleDownloadSvg() {
    const svg = tileToPatternSvg(pattern);
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${patternType}-pattern.svg`);
  }

  async function handleDownloadPng() {
    const blob = await rasterizeTiledPng(flatSvg, pattern.tileSize.width, pattern.tileSize.height, PNG_PIXELS_PER_TILE, PNG_TILE_COUNT, PNG_TILE_COUNT);
    downloadBlob(blob, `${patternType}-pattern.png`);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(PATTERN_LABELS) as PatternType[]).map((type) => (
          <Button key={type} variant={patternType === type ? 'primary' : 'secondary'} size="sm" onClick={() => setPatternType(type)}>
            {PATTERN_LABELS[type]}
          </Button>
        ))}
      </div>

      <div
        className="h-72 w-full rounded-lg border-2 border-dashed border-ink/15 dark:border-paper/15"
        style={mounted ? { backgroundImage: `url("data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(flatSvg)))}")`, backgroundRepeat: 'repeat' } : undefined}
        role="img"
        aria-label={`Tiled preview of the ${PATTERN_LABELS[patternType]} pattern`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleRandomize}>
          Randomize
        </Button>
        <span className="text-xs text-ink/40 dark:text-paper/40">
          {mounted ? `Tile size: ${Math.round(pattern.tileSize.width)}×${Math.round(pattern.tileSize.height)}px` : 'Tile size: —'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10 sm:grid-cols-2 lg:grid-cols-3">
        {patternType === 'dots' && (
          <>
            <ColorOpacityField label="Dot color" color={dots.color} opacity={dots.colorOpacity} onColorChange={(c) => setDots((p) => ({ ...p, color: c }))} onOpacityChange={(o) => setDots((p) => ({ ...p, colorOpacity: o }))} />
            <ColorOpacityField label="Background" color={dots.backgroundColor} opacity={100} onColorChange={(c) => setDots((p) => ({ ...p, backgroundColor: c }))} onOpacityChange={() => {}} />
            <RangeField label="Dot radius" value={dots.radius} min={1} max={20} onChange={(v) => setDots((p) => ({ ...p, radius: v }))} />
            <RangeField label="Spacing" value={dots.spacing} min={8} max={80} onChange={(v) => setDots((p) => ({ ...p, spacing: Math.max(v, p.radius * 2 + 2) }))} />
          </>
        )}

        {patternType === 'stripes' && (
          <>
            <ColorOpacityField label="Stripe color" color={stripes.color} opacity={stripes.colorOpacity} onColorChange={(c) => setStripes((p) => ({ ...p, color: c }))} onOpacityChange={(o) => setStripes((p) => ({ ...p, colorOpacity: o }))} />
            <ColorOpacityField label="Background" color={stripes.backgroundColor} opacity={100} onColorChange={(c) => setStripes((p) => ({ ...p, backgroundColor: c }))} onOpacityChange={() => {}} />
            <RangeField label="Stripe width" value={stripes.stripeWidth} min={2} max={40} onChange={(v) => setStripes((p) => ({ ...p, stripeWidth: v }))} />
            <SegmentedControl label="Orientation" value={stripes.orientation} options={STRIPE_ORIENTATIONS} onChange={(v) => setStripes((p) => ({ ...p, orientation: v }))} />
          </>
        )}

        {patternType === 'grid' && (
          <>
            <ColorOpacityField label="Line color" color={grid.color} opacity={grid.colorOpacity} onColorChange={(c) => setGrid((p) => ({ ...p, color: c }))} onOpacityChange={(o) => setGrid((p) => ({ ...p, colorOpacity: o }))} />
            <ColorOpacityField label="Background" color={grid.backgroundColor} opacity={100} onColorChange={(c) => setGrid((p) => ({ ...p, backgroundColor: c }))} onOpacityChange={() => {}} />
            <RangeField label="Spacing" value={grid.spacing} min={8} max={80} onChange={(v) => setGrid((p) => ({ ...p, spacing: v }))} />
            <RangeField label="Line width" value={grid.lineWidth} min={1} max={6} onChange={(v) => setGrid((p) => ({ ...p, lineWidth: v }))} />
          </>
        )}

        {patternType === 'checkerboard' && (
          <>
            <ColorOpacityField label="Color A" color={checkerboard.colorA} opacity={100} onColorChange={(c) => setCheckerboard((p) => ({ ...p, colorA: c }))} onOpacityChange={() => {}} />
            <ColorOpacityField label="Color B" color={checkerboard.colorB} opacity={100} onColorChange={(c) => setCheckerboard((p) => ({ ...p, colorB: c }))} onOpacityChange={() => {}} />
            <RangeField label="Square size" value={checkerboard.squareSize} min={6} max={60} onChange={(v) => setCheckerboard((p) => ({ ...p, squareSize: v }))} />
          </>
        )}

        {patternType === 'waves' && (
          <>
            <ColorOpacityField label="Wave color" color={waves.color} opacity={waves.colorOpacity} onColorChange={(c) => setWaves((p) => ({ ...p, color: c }))} onOpacityChange={(o) => setWaves((p) => ({ ...p, colorOpacity: o }))} />
            <ColorOpacityField label="Background" color={waves.backgroundColor} opacity={100} onColorChange={(c) => setWaves((p) => ({ ...p, backgroundColor: c }))} onOpacityChange={() => {}} />
            <RangeField label="Amplitude" value={waves.amplitude} min={2} max={24} onChange={(v) => setWaves((p) => ({ ...p, amplitude: v }))} />
            <RangeField label="Wavelength" value={waves.wavelength} min={16} max={100} onChange={(v) => setWaves((p) => ({ ...p, wavelength: v }))} />
            <RangeField label="Row spacing" value={waves.rowSpacing} min={12} max={80} onChange={(v) => setWaves((p) => ({ ...p, rowSpacing: v }))} />
            <RangeField label="Stroke width" value={waves.strokeWidth} min={1} max={8} onChange={(v) => setWaves((p) => ({ ...p, strokeWidth: v }))} />
          </>
        )}

        {patternType === 'triangles' && (
          <>
            <ColorOpacityField label="Color A" color={triangles.colorA} opacity={100} onColorChange={(c) => setTriangles((p) => ({ ...p, colorA: c }))} onOpacityChange={() => {}} />
            <ColorOpacityField label="Color B" color={triangles.colorB} opacity={100} onColorChange={(c) => setTriangles((p) => ({ ...p, colorB: c }))} onOpacityChange={() => {}} />
            <RangeField label="Size" value={triangles.size} min={10} max={60} onChange={(v) => setTriangles((p) => ({ ...p, size: v }))} />
            <SegmentedControl label="Diagonal" value={triangles.diagonal} options={TRIANGLE_DIAGONALS} onChange={(v) => setTriangles((p) => ({ ...p, diagonal: v }))} />
          </>
        )}

        {patternType === 'hexagons' && (
          <>
            <ColorOpacityField label="Hex color" color={hexagons.color} opacity={hexagons.colorOpacity} onColorChange={(c) => setHexagons((p) => ({ ...p, color: c }))} onOpacityChange={(o) => setHexagons((p) => ({ ...p, colorOpacity: o }))} />
            <ColorOpacityField label="Background / gap" color={hexagons.backgroundColor} opacity={100} onColorChange={(c) => setHexagons((p) => ({ ...p, backgroundColor: c }))} onOpacityChange={() => {}} />
            <RangeField label="Size" value={hexagons.size} min={8} max={40} onChange={(v) => setHexagons((p) => ({ ...p, size: v }))} />
            <RangeField label="Gap width" value={hexagons.strokeWidth} min={0} max={6} onChange={(v) => setHexagons((p) => ({ ...p, strokeWidth: v }))} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink dark:text-paper">Copy as CSS</span>
          <CopyButton value={mounted ? cssSnippet : ''} size="sm" disabled={!mounted} />
        </div>
        <pre className="overflow-x-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {mounted ? cssSnippet : 'Generating…'}
        </pre>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleDownloadSvg}>
          Download SVG
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void handleDownloadPng()}>
          Download PNG ({PNG_TILE_COUNT}×{PNG_TILE_COUNT} tiles, {PNG_PIXELS_PER_TILE}px/tile)
        </Button>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
