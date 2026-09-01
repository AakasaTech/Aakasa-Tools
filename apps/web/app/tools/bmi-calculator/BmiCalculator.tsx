'use client';

import { useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { calculateBmi, ftInToCm, getBmiCategory, lbToKg } from './utils/bmiCalculation';

type UnitSystem = 'metric' | 'imperial';

const SCALE_MIN = 15;
const SCALE_MAX = 40;
// Four shades of the same neutral tone (increasing opacity only) —
// deliberately not red/green/etc., since this is a factual classification
// scale, not a pass/fail gradient.
const BAND_SHADE_CLASSES = ['bg-ink/15 dark:bg-paper/15', 'bg-ink/25 dark:bg-paper/25', 'bg-ink/35 dark:bg-paper/35', 'bg-ink/45 dark:bg-paper/45'];
const SCALE_BANDS = [
  { label: 'Underweight', from: SCALE_MIN, to: 18.5 },
  { label: 'Normal', from: 18.5, to: 25 },
  { label: 'Overweight', from: 25, to: 30 },
  { label: 'Obese', from: 30, to: SCALE_MAX },
];

function parseInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function BmiCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [heightCm, setHeightCm] = useState('170');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('7');
  const [weightKg, setWeightKg] = useState('70');
  const [weightLb, setWeightLb] = useState('154');

  let resolvedHeightCm: number | null = null;
  let resolvedWeightKg: number | null = null;

  if (unitSystem === 'metric') {
    resolvedHeightCm = parseInput(heightCm);
    resolvedWeightKg = parseInput(weightKg);
  } else {
    const feet = parseInput(heightFt) ?? 0;
    const inches = parseInput(heightIn) ?? 0;
    resolvedHeightCm = feet > 0 || inches > 0 ? ftInToCm(feet, inches) : null;
    const lb = parseInput(weightLb);
    resolvedWeightKg = lb !== null ? lbToKg(lb) : null;
  }

  const bmi = resolvedHeightCm && resolvedWeightKg ? calculateBmi(resolvedWeightKg, resolvedHeightCm) : null;
  const category = bmi !== null ? getBmiCategory(bmi) : null;
  const markerPercent = bmi !== null ? clampPercent(((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5">
        <Button variant={unitSystem === 'metric' ? 'primary' : 'secondary'} size="sm" onClick={() => setUnitSystem('metric')}>
          Metric (kg, cm)
        </Button>
        <Button variant={unitSystem === 'imperial' ? 'primary' : 'secondary'} size="sm" onClick={() => setUnitSystem('imperial')}>
          Imperial (lb, ft/in)
        </Button>
      </div>

      {unitSystem === 'metric' ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Height (cm)
            <input
              type="text"
              inputMode="decimal"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Weight (kg)
            <input
              type="text"
              inputMode="decimal"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Height
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={heightFt}
                onChange={(event) => setHeightFt(event.target.value)}
                placeholder="ft"
                className="w-1/2 rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
              <input
                type="text"
                inputMode="decimal"
                value={heightIn}
                onChange={(event) => setHeightIn(event.target.value)}
                placeholder="in"
                className="w-1/2 rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Weight (lb)
            <input
              type="text"
              inputMode="decimal"
              value={weightLb}
              onChange={(event) => setWeightLb(event.target.value)}
              className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
          </label>
        </div>
      )}

      {bmi === null || category === null || markerPercent === null ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter your height and weight above to see your BMI.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <div>
              <p className="font-mono text-3xl font-semibold text-ink dark:text-paper">{bmi.toFixed(1)}</p>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {category.label} <span className="text-ink/40 dark:text-paper/40">({category.range})</span>
              </p>
            </div>
            <CopyButton value={`BMI ${bmi.toFixed(1)} — ${category.label}`} label="Copy" size="sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="relative flex h-3 overflow-hidden rounded-full">
              {SCALE_BANDS.map((band, index) => (
                <div
                  key={band.label}
                  className={`h-full ${BAND_SHADE_CLASSES[index]}`}
                  style={{ width: `${((band.to - band.from) / (SCALE_MAX - SCALE_MIN)) * 100}%` }}
                />
              ))}
              <div
                className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                style={{ left: `${markerPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink/40 dark:text-paper/40">
              {SCALE_BANDS.map((band) => (
                <span key={band.label}>{band.label}</span>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-ink/5 px-3 py-2.5 text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70">
            BMI is a simple screening calculation based on height and weight only — it doesn&apos;t directly measure body fat, doesn&apos;t
            account for muscle mass (it can misclassify very muscular people as overweight), and isn&apos;t equally accurate across every age
            or population. It&apos;s one data point, not a diagnosis — a healthcare provider can put this number in the context of your
            individual health.
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
