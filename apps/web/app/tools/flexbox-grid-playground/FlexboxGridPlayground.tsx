'use client';

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  buildFlexboxCss,
  type AlignItems as FlexAlignItemsT,
  type AlignSelf,
  type FlexContainerProps,
  type FlexDirection,
  type FlexItemProps,
  type FlexWrap,
  type JustifyContent as FlexJustifyContentT,
} from './utils/buildFlexCss';
import {
  buildGridCss,
  type AlignContent,
  type AlignItems as GridAlignItemsT,
  type GridContainerProps,
  type GridItemProps,
  type JustifyContent as GridJustifyContentT,
  type JustifyItems,
} from './utils/buildGridCss';
import { FLEX_PRESETS, GRID_PRESETS } from './utils/presetLayouts';

type Tab = 'flexbox' | 'grid';

// Accent-family palette at different opacities, cycled by item index, so
// every box in the preview is visually distinguishable from its neighbors.
const ITEM_COLORS = ['bg-accent/85', 'bg-accent/65', 'bg-accent/50', 'bg-accent/35', 'bg-accent/75', 'bg-accent/55'];

const MIN_ITEMS = 1;
const MAX_ITEMS = 10;

function ControlLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
      {label}
      {children}
    </label>
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-9 rounded-md border border-ink/15 bg-paper px-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-paper text-ink dark:bg-ink dark:text-paper">
          {option}
        </option>
      ))}
    </select>
  );
}

function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <ControlLabel label={`${label}: ${value}px`}>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="accent-accent" />
    </ControlLabel>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <ControlLabel label={label}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="h-9 rounded-md border border-ink/15 bg-paper px-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
      />
    </ControlLabel>
  );
}

function ItemCountControl({ count, onChange }: { count: number; onChange: (count: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink/70 dark:text-paper/70">Items</span>
      <Button variant="ghost" size="sm" onClick={() => onChange(Math.max(MIN_ITEMS, count - 1))} disabled={count <= MIN_ITEMS} aria-label="Remove item">
        −
      </Button>
      <span className="w-6 text-center font-mono text-sm text-ink dark:text-paper">{count}</span>
      <Button variant="ghost" size="sm" onClick={() => onChange(Math.min(MAX_ITEMS, count + 1))} disabled={count >= MAX_ITEMS} aria-label="Add item">
        +
      </Button>
    </div>
  );
}

function ItemPicker({ count, selected, onSelect }: { count: number; selected: number; onSelect: (index: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <Button key={i} variant={selected === i ? 'primary' : 'secondary'} size="sm" onClick={() => onSelect(i)}>
          Item {i + 1}
        </Button>
      ))}
    </div>
  );
}

const FLEX_DIRECTIONS: FlexDirection[] = ['row', 'row-reverse', 'column', 'column-reverse'];
const FLEX_JUSTIFY_OPTIONS: FlexJustifyContentT[] = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
const FLEX_ALIGN_OPTIONS: FlexAlignItemsT[] = ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'];
const FLEX_WRAP_OPTIONS: FlexWrap[] = ['nowrap', 'wrap', 'wrap-reverse'];
const ALIGN_SELF_OPTIONS: AlignSelf[] = ['auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline'];

const GRID_JUSTIFY_ITEMS_OPTIONS: JustifyItems[] = ['stretch', 'start', 'center', 'end'];
const GRID_ALIGN_ITEMS_OPTIONS: GridAlignItemsT[] = ['stretch', 'start', 'center', 'end'];
const GRID_JUSTIFY_CONTENT_OPTIONS: GridJustifyContentT[] = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly', 'stretch'];
const GRID_ALIGN_CONTENT_OPTIONS: AlignContent[] = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly', 'stretch'];

const COLUMN_PRESETS: { label: string; value: string }[] = [
  { label: '2 equal', value: '1fr 1fr' },
  { label: '3 equal', value: '1fr 1fr 1fr' },
  { label: '4 equal', value: '1fr 1fr 1fr 1fr' },
  { label: '12-col', value: 'repeat(12, 1fr)' },
];

const DEFAULT_FLEX_CONTAINER: FlexContainerProps = {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  flexWrap: 'nowrap',
  gap: 8,
};
const DEFAULT_FLEX_ITEM: Omit<FlexItemProps, 'id'> = { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' };

const DEFAULT_GRID_CONTAINER: GridContainerProps = {
  gridTemplateColumns: '1fr 1fr 1fr',
  gridTemplateRows: 'auto',
  gap: 8,
  justifyItems: 'stretch',
  alignItems: 'stretch',
  justifyContent: 'start',
  alignContent: 'start',
};
const DEFAULT_GRID_ITEM: Omit<GridItemProps, 'id'> = { gridColumn: 'auto', gridRow: 'auto' };

function makeFlexItems(nextId: { current: number }, count: number, overrides?: Omit<FlexItemProps, 'id'>[]): FlexItemProps[] {
  return Array.from({ length: count }, (_, i) => ({ id: nextId.current++, ...(overrides?.[i] ?? DEFAULT_FLEX_ITEM) }));
}
function makeGridItems(nextId: { current: number }, count: number, overrides?: Omit<GridItemProps, 'id'>[]): GridItemProps[] {
  return Array.from({ length: count }, (_, i) => ({ id: nextId.current++, ...(overrides?.[i] ?? DEFAULT_GRID_ITEM) }));
}

export function FlexboxGridPlayground() {
  const [tab, setTab] = useState<Tab>('flexbox');
  const nextItemId = useRef(1);

  const [flexContainer, setFlexContainer] = useState<FlexContainerProps>(DEFAULT_FLEX_CONTAINER);
  const [flexItems, setFlexItems] = useState<FlexItemProps[]>(() => makeFlexItems(nextItemId, 3));
  const [selectedFlexIndex, setSelectedFlexIndex] = useState(0);

  const [gridContainer, setGridContainer] = useState<GridContainerProps>(DEFAULT_GRID_CONTAINER);
  const [gridItemsState, setGridItemsState] = useState<GridItemProps[]>(() => makeGridItems(nextItemId, 6));
  const [selectedGridIndex, setSelectedGridIndex] = useState(0);

  const flexCss = useMemo(() => buildFlexboxCss(flexContainer, flexItems), [flexContainer, flexItems]);
  const gridCss = useMemo(() => buildGridCss(gridContainer, gridItemsState), [gridContainer, gridItemsState]);

  function updateFlexItem(index: number, patch: Partial<FlexItemProps>) {
    setFlexItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function setFlexItemCount(count: number) {
    setFlexItems((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => ({ id: nextItemId.current++, ...DEFAULT_FLEX_ITEM }))];
      }
      return prev.slice(0, count);
    });
    setSelectedFlexIndex((i) => Math.min(i, count - 1));
  }

  function updateGridItem(index: number, patch: Partial<GridItemProps>) {
    setGridItemsState((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function setGridItemCount(count: number) {
    setGridItemsState((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => ({ id: nextItemId.current++, ...DEFAULT_GRID_ITEM }))];
      }
      return prev.slice(0, count);
    });
    setSelectedGridIndex((i) => Math.min(i, count - 1));
  }

  function loadFlexPreset(presetIndex: number) {
    const preset = FLEX_PRESETS[presetIndex]!;
    setFlexContainer(preset.container);
    setFlexItems(preset.items.map((item) => ({ id: nextItemId.current++, ...item })));
    setSelectedFlexIndex(0);
  }
  function loadGridPreset(presetIndex: number) {
    const preset = GRID_PRESETS[presetIndex]!;
    setGridContainer(preset.container);
    setGridItemsState(preset.items.map((item) => ({ id: nextItemId.current++, ...item })));
    setSelectedGridIndex(0);
  }

  function resetFlex() {
    setFlexContainer(DEFAULT_FLEX_CONTAINER);
    setFlexItems(makeFlexItems(nextItemId, 3));
    setSelectedFlexIndex(0);
  }
  function resetGrid() {
    setGridContainer(DEFAULT_GRID_CONTAINER);
    setGridItemsState(makeGridItems(nextItemId, 6));
    setSelectedGridIndex(0);
  }

  const flexContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: flexContainer.flexDirection,
    justifyContent: flexContainer.justifyContent,
    alignItems: flexContainer.alignItems,
    flexWrap: flexContainer.flexWrap,
    gap: `${flexContainer.gap}px`,
  };

  const gridContainerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gridContainer.gridTemplateColumns,
    gridTemplateRows: gridContainer.gridTemplateRows,
    gap: `${gridContainer.gap}px`,
    justifyItems: gridContainer.justifyItems,
    alignItems: gridContainer.alignItems,
    justifyContent: gridContainer.justifyContent,
    alignContent: gridContainer.alignContent,
  };

  const selectedFlexItem = flexItems[selectedFlexIndex];
  const selectedGridItem = gridItemsState[selectedGridIndex];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5">
        <Button variant={tab === 'flexbox' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('flexbox')}>
          Flexbox
        </Button>
        <Button variant={tab === 'grid' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('grid')}>
          Grid
        </Button>
      </div>

      {tab === 'flexbox' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {FLEX_PRESETS.map((preset, i) => (
              <Button key={preset.name} variant="secondary" size="sm" onClick={() => loadFlexPreset(i)}>
                {preset.name}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={resetFlex}>
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10 sm:grid-cols-3 lg:grid-cols-5">
            <ControlLabel label="flex-direction">
              <Select value={flexContainer.flexDirection} options={FLEX_DIRECTIONS} onChange={(v) => setFlexContainer((p) => ({ ...p, flexDirection: v }))} />
            </ControlLabel>
            <ControlLabel label="justify-content">
              <Select value={flexContainer.justifyContent} options={FLEX_JUSTIFY_OPTIONS} onChange={(v) => setFlexContainer((p) => ({ ...p, justifyContent: v }))} />
            </ControlLabel>
            <ControlLabel label="align-items">
              <Select value={flexContainer.alignItems} options={FLEX_ALIGN_OPTIONS} onChange={(v) => setFlexContainer((p) => ({ ...p, alignItems: v }))} />
            </ControlLabel>
            <ControlLabel label="flex-wrap">
              <Select value={flexContainer.flexWrap} options={FLEX_WRAP_OPTIONS} onChange={(v) => setFlexContainer((p) => ({ ...p, flexWrap: v }))} />
            </ControlLabel>
            <RangeField label="gap" value={flexContainer.gap} min={0} max={48} onChange={(v) => setFlexContainer((p) => ({ ...p, gap: v }))} />
          </div>

          <div
            className="flex min-h-[16rem] w-full flex-col gap-3 rounded-lg border-2 border-dashed border-ink/15 p-4 dark:border-paper/15"
          >
            <ItemCountControl count={flexItems.length} onChange={setFlexItemCount} />
            <div style={flexContainerStyle} className="min-h-[10rem] flex-1 rounded-md bg-ink/[0.03] p-2 dark:bg-paper/[0.03]">
              {flexItems.map((item, i) => (
                <div
                  key={item.id}
                  style={{ flexGrow: item.flexGrow, flexShrink: item.flexShrink, flexBasis: item.flexBasis, alignSelf: item.alignSelf }}
                  className={`flex h-16 w-16 items-center justify-center rounded-md text-sm font-semibold text-white ${ITEM_COLORS[i % ITEM_COLORS.length]} ${
                    selectedFlexIndex === i ? 'ring-2 ring-offset-2 ring-offset-paper dark:ring-offset-ink' : ''
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {selectedFlexItem && (
            <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink dark:text-paper">Selected item</span>
                <ItemPicker count={flexItems.length} selected={selectedFlexIndex} onSelect={setSelectedFlexIndex} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ControlLabel label="flex-grow">
                  <input
                    type="number"
                    min={0}
                    value={selectedFlexItem.flexGrow}
                    onChange={(event) => updateFlexItem(selectedFlexIndex, { flexGrow: Number(event.target.value) || 0 })}
                    className="h-9 rounded-md border border-ink/15 bg-paper px-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                  />
                </ControlLabel>
                <ControlLabel label="flex-shrink">
                  <input
                    type="number"
                    min={0}
                    value={selectedFlexItem.flexShrink}
                    onChange={(event) => updateFlexItem(selectedFlexIndex, { flexShrink: Number(event.target.value) || 0 })}
                    className="h-9 rounded-md border border-ink/15 bg-paper px-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                  />
                </ControlLabel>
                <TextField label="flex-basis" value={selectedFlexItem.flexBasis} onChange={(v) => updateFlexItem(selectedFlexIndex, { flexBasis: v })} placeholder="auto" />
                <ControlLabel label="align-self">
                  <Select value={selectedFlexItem.alignSelf} options={ALIGN_SELF_OPTIONS} onChange={(v) => updateFlexItem(selectedFlexIndex, { alignSelf: v })} />
                </ControlLabel>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink dark:text-paper">Generated CSS</span>
              <CopyButton value={flexCss} size="sm" />
            </div>
            <pre className="overflow-x-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">{flexCss}</pre>
          </div>
        </div>
      )}

      {tab === 'grid' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {GRID_PRESETS.map((preset, i) => (
              <Button key={preset.name} variant="secondary" size="sm" onClick={() => loadGridPreset(i)}>
                {preset.name}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={resetGrid}>
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10 sm:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <TextField
                label="grid-template-columns"
                value={gridContainer.gridTemplateColumns}
                onChange={(v) => setGridContainer((p) => ({ ...p, gridTemplateColumns: v }))}
                placeholder="1fr 1fr 1fr"
              />
              <div className="flex flex-wrap gap-1.5">
                {COLUMN_PRESETS.map((preset) => (
                  <Button key={preset.label} variant="ghost" size="sm" onClick={() => setGridContainer((p) => ({ ...p, gridTemplateColumns: preset.value }))}>
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <TextField
              label="grid-template-rows"
              value={gridContainer.gridTemplateRows}
              onChange={(v) => setGridContainer((p) => ({ ...p, gridTemplateRows: v }))}
              placeholder="auto"
            />
            <RangeField label="gap" value={gridContainer.gap} min={0} max={48} onChange={(v) => setGridContainer((p) => ({ ...p, gap: v }))} />
            <ControlLabel label="justify-items">
              <Select value={gridContainer.justifyItems} options={GRID_JUSTIFY_ITEMS_OPTIONS} onChange={(v) => setGridContainer((p) => ({ ...p, justifyItems: v }))} />
            </ControlLabel>
            <ControlLabel label="align-items">
              <Select value={gridContainer.alignItems} options={GRID_ALIGN_ITEMS_OPTIONS} onChange={(v) => setGridContainer((p) => ({ ...p, alignItems: v }))} />
            </ControlLabel>
            <ControlLabel label="justify-content">
              <Select value={gridContainer.justifyContent} options={GRID_JUSTIFY_CONTENT_OPTIONS} onChange={(v) => setGridContainer((p) => ({ ...p, justifyContent: v }))} />
            </ControlLabel>
            <ControlLabel label="align-content">
              <Select value={gridContainer.alignContent} options={GRID_ALIGN_CONTENT_OPTIONS} onChange={(v) => setGridContainer((p) => ({ ...p, alignContent: v }))} />
            </ControlLabel>
          </div>

          <div className="flex min-h-[16rem] w-full flex-col gap-3 rounded-lg border-2 border-dashed border-ink/15 p-4 dark:border-paper/15">
            <ItemCountControl count={gridItemsState.length} onChange={setGridItemCount} />
            <div style={gridContainerStyle} className="min-h-[10rem] flex-1 rounded-md bg-ink/[0.03] p-2 dark:bg-paper/[0.03]">
              {gridItemsState.map((item, i) => (
                <div
                  key={item.id}
                  style={{ gridColumn: item.gridColumn, gridRow: item.gridRow }}
                  className={`flex min-h-[3rem] items-center justify-center rounded-md text-sm font-semibold text-white ${ITEM_COLORS[i % ITEM_COLORS.length]} ${
                    selectedGridIndex === i ? 'ring-2 ring-offset-2 ring-offset-paper dark:ring-offset-ink' : ''
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {selectedGridItem && (
            <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink dark:text-paper">Selected item</span>
                <ItemPicker count={gridItemsState.length} selected={selectedGridIndex} onSelect={setSelectedGridIndex} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="grid-column" value={selectedGridItem.gridColumn} onChange={(v) => updateGridItem(selectedGridIndex, { gridColumn: v })} placeholder="auto / span 2 / 1 / 3" />
                <TextField label="grid-row" value={selectedGridItem.gridRow} onChange={(v) => updateGridItem(selectedGridIndex, { gridRow: v })} placeholder="auto / span 2 / 1 / 3" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => updateGridItem(selectedGridIndex, { gridColumn: 'span 2' })}>
                  Column: span 2
                </Button>
                <Button variant="ghost" size="sm" onClick={() => updateGridItem(selectedGridIndex, { gridColumn: 'span 3' })}>
                  Column: span 3
                </Button>
                <Button variant="ghost" size="sm" onClick={() => updateGridItem(selectedGridIndex, { gridColumn: 'auto', gridRow: 'auto' })}>
                  Reset placement
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink dark:text-paper">Generated CSS</span>
              <CopyButton value={gridCss} size="sm" />
            </div>
            <pre className="overflow-x-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">{gridCss}</pre>
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
