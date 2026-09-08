/** Typed preset configurations for the quick-load buttons — worked
 * examples of genuinely common layout patterns, not just a blank slate.
 * Each preset supplies a full container config plus one entry per item it
 * expects; loading a preset also sets the item count to match. */

import type { AlignItems as FlexAlignItems, AlignSelf, FlexContainerProps, FlexWrap, JustifyContent as FlexJustifyContent } from './buildFlexCss';
import type {
  AlignContent,
  AlignItems as GridAlignItems,
  GridContainerProps,
  JustifyContent as GridJustifyContent,
  JustifyItems,
} from './buildGridCss';

export interface FlexItemOverride {
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  alignSelf: AlignSelf;
}

export interface FlexPreset {
  name: string;
  container: FlexContainerProps;
  items: FlexItemOverride[];
}

export interface GridItemOverride {
  gridColumn: string;
  gridRow: string;
}

export interface GridPreset {
  name: string;
  container: GridContainerProps;
  items: GridItemOverride[];
}

const DEFAULT_FLEX_ITEM: FlexItemOverride = { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' };
const DEFAULT_GRID_ITEM: GridItemOverride = { gridColumn: 'auto', gridRow: 'auto' };

function flexItems(count: number, overrides: Partial<Record<number, Partial<FlexItemOverride>>> = {}): FlexItemOverride[] {
  return Array.from({ length: count }, (_, i) => ({ ...DEFAULT_FLEX_ITEM, ...(overrides[i] ?? {}) }));
}

function gridItems(count: number, overrides: Partial<Record<number, Partial<GridItemOverride>>> = {}): GridItemOverride[] {
  return Array.from({ length: count }, (_, i) => ({ ...DEFAULT_GRID_ITEM, ...(overrides[i] ?? {}) }));
}

const FLEX_JUSTIFY: FlexJustifyContent = 'space-between';
const FLEX_ALIGN: FlexAlignItems = 'center';
const FLEX_WRAP: FlexWrap = 'nowrap';

export const FLEX_PRESETS: FlexPreset[] = [
  {
    name: 'Navbar (space-between)',
    container: { flexDirection: 'row', justifyContent: FLEX_JUSTIFY, alignItems: FLEX_ALIGN, flexWrap: FLEX_WRAP, gap: 12 },
    items: flexItems(3),
  },
  {
    name: 'Centered content',
    container: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap', gap: 12 },
    items: flexItems(1),
  },
  {
    name: 'Sidebar layout',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', gap: 12 },
    items: flexItems(2, {
      0: { flexGrow: 0, flexShrink: 0, flexBasis: '160px', alignSelf: 'auto' },
      1: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' },
    }),
  },
];

export const GRID_PRESETS: GridPreset[] = [
  {
    name: '12-column grid',
    container: {
      gridTemplateColumns: 'repeat(12, 1fr)',
      gridTemplateRows: 'auto',
      gap: 8,
      justifyItems: 'stretch' as JustifyItems,
      alignItems: 'stretch' as GridAlignItems,
      justifyContent: 'stretch' as GridJustifyContent,
      alignContent: 'stretch' as AlignContent,
    },
    items: gridItems(3, {
      0: { gridColumn: 'span 4', gridRow: 'auto' },
      1: { gridColumn: 'span 4', gridRow: 'auto' },
      2: { gridColumn: 'span 4', gridRow: 'auto' },
    }),
  },
  {
    name: 'Holy grail layout',
    container: {
      gridTemplateColumns: '160px 1fr 160px',
      gridTemplateRows: 'auto 1fr auto',
      gap: 8,
      justifyItems: 'stretch' as JustifyItems,
      alignItems: 'stretch' as GridAlignItems,
      justifyContent: 'stretch' as GridJustifyContent,
      alignContent: 'stretch' as AlignContent,
    },
    items: gridItems(5, {
      0: { gridColumn: '1 / 4', gridRow: '1' }, // header
      1: { gridColumn: '1', gridRow: '2' }, // left sidebar
      2: { gridColumn: '2', gridRow: '2' }, // main content
      3: { gridColumn: '3', gridRow: '2' }, // right sidebar
      4: { gridColumn: '1 / 4', gridRow: '3' }, // footer
    }),
  },
  {
    name: 'Card grid (auto-fill)',
    container: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gridTemplateRows: 'auto',
      gap: 12,
      justifyItems: 'stretch' as JustifyItems,
      alignItems: 'stretch' as GridAlignItems,
      justifyContent: 'start' as GridJustifyContent,
      alignContent: 'start' as AlignContent,
    },
    items: gridItems(6),
  },
];
