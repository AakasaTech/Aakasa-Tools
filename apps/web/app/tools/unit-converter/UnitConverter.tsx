'use client';

import { useState } from 'react';
import { Button, Combobox, CopyButton } from '@aakasa/ui';
import { convert, formatConverted } from './utils/convert';
import {
  CATEGORY_DEFINITIONS,
  CATEGORY_ORDER,
  QUICK_CONVERSIONS,
  type QuickConversion,
  type UnitCategory,
} from './utils/unitDefinitions';

const MIN_DECIMAL_PLACES = 0;
const MAX_DECIMAL_PLACES = 8;

function recompute(sourceText: string, fromUnit: string, toUnit: string, category: UnitCategory, decimalPlaces: number): string {
  const trimmed = sourceText.trim();
  if (trimmed === '') {
    return '';
  }
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) {
    return '';
  }
  try {
    return formatConverted(convert(parsed, fromUnit, toUnit, category), decimalPlaces);
  } catch {
    return '';
  }
}

const INITIAL_CATEGORY: UnitCategory = 'length';
const initialDef = CATEGORY_DEFINITIONS[INITIAL_CATEGORY];
const INITIAL_FROM_UNIT = initialDef.units[0]!.id;
const INITIAL_TO_UNIT = initialDef.units[1]?.id ?? INITIAL_FROM_UNIT;

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>(INITIAL_CATEGORY);
  const [fromUnit, setFromUnit] = useState(INITIAL_FROM_UNIT);
  const [toUnit, setToUnit] = useState(INITIAL_TO_UNIT);
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState(() =>
    recompute('1', INITIAL_FROM_UNIT, INITIAL_TO_UNIT, INITIAL_CATEGORY, initialDef.defaultDecimalPlaces)
  );
  const [decimalPlaces, setDecimalPlaces] = useState(initialDef.defaultDecimalPlaces);

  const definition = CATEGORY_DEFINITIONS[category];
  const unitOptions = definition.units.map((unit) => ({ value: unit.id, label: unit.label }));
  const quickConversions: QuickConversion[] = QUICK_CONVERSIONS[category];

  function handleCategoryChange(nextCategory: UnitCategory) {
    if (nextCategory === category) return;
    const def = CATEGORY_DEFINITIONS[nextCategory];
    const nextFrom = def.units[0]!.id;
    const nextTo = def.units[1]?.id ?? nextFrom;
    setCategory(nextCategory);
    setFromUnit(nextFrom);
    setToUnit(nextTo);
    setDecimalPlaces(def.defaultDecimalPlaces);
    setFromValue('1');
    setToValue(recompute('1', nextFrom, nextTo, nextCategory, def.defaultDecimalPlaces));
  }

  function handleFromValueChange(text: string) {
    setFromValue(text);
    setToValue(recompute(text, fromUnit, toUnit, category, decimalPlaces));
  }

  function handleToValueChange(text: string) {
    setToValue(text);
    setFromValue(recompute(text, toUnit, fromUnit, category, decimalPlaces));
  }

  function handleFromUnitChange(unit: string) {
    setFromUnit(unit);
    setToValue(recompute(fromValue, unit, toUnit, category, decimalPlaces));
  }

  function handleToUnitChange(unit: string) {
    setToUnit(unit);
    setToValue(recompute(fromValue, fromUnit, unit, category, decimalPlaces));
  }

  function handleDecimalPlacesChange(next: number) {
    const clamped = Math.min(MAX_DECIMAL_PLACES, Math.max(MIN_DECIMAL_PLACES, next));
    setDecimalPlaces(clamped);
    setToValue(recompute(fromValue, fromUnit, toUnit, category, clamped));
  }

  function handleSwap() {
    const nextFromUnit = toUnit;
    const nextToUnit = fromUnit;
    const nextFromValue = toValue;
    setFromUnit(nextFromUnit);
    setToUnit(nextToUnit);
    setFromValue(nextFromValue);
    setToValue(recompute(nextFromValue, nextFromUnit, nextToUnit, category, decimalPlaces));
  }

  function handleClear() {
    const nextFrom = definition.units[0]!.id;
    const nextTo = definition.units[1]?.id ?? nextFrom;
    setFromUnit(nextFrom);
    setToUnit(nextTo);
    setDecimalPlaces(definition.defaultDecimalPlaces);
    setFromValue('1');
    setToValue(recompute('1', nextFrom, nextTo, category, definition.defaultDecimalPlaces));
  }

  function handleQuickConversionClick(qc: QuickConversion) {
    setFromUnit(qc.fromUnit);
    setToUnit(qc.toUnit);
    const text = String(qc.fromValue);
    setFromValue(text);
    setToValue(recompute(text, qc.fromUnit, qc.toUnit, category, decimalPlaces));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            aria-pressed={category === cat}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-accent text-white'
                : 'bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-paper/10 dark:text-paper/70 dark:hover:bg-paper/20'
            }`}
          >
            {CATEGORY_DEFINITIONS[cat].label}
          </button>
        ))}
      </div>

      {definition.note && <p className="text-xs text-ink/50 dark:text-paper/50">{definition.note}</p>}

      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/70 dark:text-paper/70">From</span>
          <input
            type="text"
            inputMode="decimal"
            value={fromValue}
            onChange={(event) => handleFromValueChange(event.target.value)}
            spellCheck={false}
            aria-label="From value"
            className="h-10 w-full rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <Combobox options={unitOptions} value={fromUnit} onChange={handleFromUnitChange} ariaLabel="From unit" />
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleSwap}
          aria-label="Swap units"
          className="mb-1 justify-self-center text-lg"
        >
          ⇅
        </Button>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/70 dark:text-paper/70">To</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              value={toValue}
              onChange={(event) => handleToValueChange(event.target.value)}
              spellCheck={false}
              aria-label="To value"
              className="h-10 w-full rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
            <CopyButton value={toValue} disabled={!toValue} />
          </div>
          <Combobox options={unitOptions} value={toUnit} onChange={handleToUnitChange} ariaLabel="To unit" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-ink/70 dark:text-paper/70">Decimal places</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDecimalPlacesChange(decimalPlaces - 1)}
            disabled={decimalPlaces <= MIN_DECIMAL_PLACES}
            aria-label="Fewer decimal places"
          >
            −
          </Button>
          <span className="w-4 text-center font-mono text-sm text-ink dark:text-paper">{decimalPlaces}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDecimalPlacesChange(decimalPlaces + 1)}
            disabled={decimalPlaces >= MAX_DECIMAL_PLACES}
            aria-label="More decimal places"
          >
            +
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleClear}>
          Reset
        </Button>
      </div>

      {quickConversions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Common conversions</span>
          <div className="flex flex-wrap gap-1.5">
            {quickConversions.map((qc) => (
              <button
                key={qc.label}
                type="button"
                onClick={() => handleQuickConversionClick(qc)}
                className="rounded-full border border-ink/10 px-3 py-1 font-mono text-xs text-ink/70 transition-colors hover:border-accent hover:text-accent dark:border-paper/10 dark:text-paper/70"
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
