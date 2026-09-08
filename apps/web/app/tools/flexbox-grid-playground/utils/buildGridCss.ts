/** Pure CSS-text generation for the Grid tab — no DOM, no React. Same
 * principle as buildFlexCss.ts: this generates text from the exact same
 * state the live preview applies as real inline styles, so the two can
 * never disagree with each other. */

export type JustifyItems = 'stretch' | 'start' | 'center' | 'end';
export type AlignItems = 'stretch' | 'start' | 'center' | 'end';
export type JustifyContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';
export type AlignContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';

export interface GridContainerProps {
  /** Raw CSS track-list value, e.g. "1fr 1fr 1fr" or "repeat(3, 1fr)". */
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gap: number;
  justifyItems: JustifyItems;
  alignItems: AlignItems;
  justifyContent: JustifyContent;
  alignContent: AlignContent;
}

export interface GridItemProps {
  id: number;
  /** Raw CSS grid-column value, e.g. "auto", "span 2", "1 / 3". */
  gridColumn: string;
  gridRow: string;
}

export function buildGridCss(containerProps: GridContainerProps, items: GridItemProps[]): string {
  const containerRule = [
    '.container {',
    '  display: grid;',
    `  grid-template-columns: ${containerProps.gridTemplateColumns};`,
    `  grid-template-rows: ${containerProps.gridTemplateRows};`,
    `  gap: ${containerProps.gap}px;`,
    `  justify-items: ${containerProps.justifyItems};`,
    `  align-items: ${containerProps.alignItems};`,
    `  justify-content: ${containerProps.justifyContent};`,
    `  align-content: ${containerProps.alignContent};`,
    '}',
  ].join('\n');

  const itemRules = items
    .map((item, index) => {
      const overrides: string[] = [];
      if (item.gridColumn.trim() !== 'auto' && item.gridColumn.trim() !== '') overrides.push(`  grid-column: ${item.gridColumn};`);
      if (item.gridRow.trim() !== 'auto' && item.gridRow.trim() !== '') overrides.push(`  grid-row: ${item.gridRow};`);
      if (overrides.length === 0) return null;
      return [`.item:nth-child(${index + 1}) {`, ...overrides, '}'].join('\n');
    })
    .filter((rule): rule is string => rule !== null);

  return [containerRule, ...itemRules].join('\n\n');
}
