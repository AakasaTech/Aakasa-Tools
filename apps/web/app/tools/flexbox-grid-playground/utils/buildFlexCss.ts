/** Pure CSS-text generation for the Flexbox tab — no DOM, no React. The
 * live preview applies the exact same property values as real inline
 * React styles directly on real DOM nodes; this module only turns those
 * same values into the CSS text shown/copied to the user, so the two
 * can never drift apart. */

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type AlignSelf = 'auto' | 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';

export interface FlexContainerProps {
  flexDirection: FlexDirection;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  flexWrap: FlexWrap;
  gap: number;
}

export interface FlexItemProps {
  id: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  alignSelf: AlignSelf;
}

const DEFAULT_FLEX_SHRINK = 1;
const DEFAULT_FLEX_BASIS = 'auto';

/** Only rules that differ from the property's initial value are emitted
 * for an item's override block — an item left at every default produces
 * no override rule at all, keeping the generated CSS focused on what was
 * actually customized. */
export function buildFlexboxCss(containerProps: FlexContainerProps, items: FlexItemProps[]): string {
  const containerRule = [
    '.container {',
    '  display: flex;',
    `  flex-direction: ${containerProps.flexDirection};`,
    `  justify-content: ${containerProps.justifyContent};`,
    `  align-items: ${containerProps.alignItems};`,
    `  flex-wrap: ${containerProps.flexWrap};`,
    `  gap: ${containerProps.gap}px;`,
    '}',
  ].join('\n');

  const itemRules = items
    .map((item, index) => {
      const overrides: string[] = [];
      if (item.flexGrow !== 0) overrides.push(`  flex-grow: ${item.flexGrow};`);
      if (item.flexShrink !== DEFAULT_FLEX_SHRINK) overrides.push(`  flex-shrink: ${item.flexShrink};`);
      if (item.flexBasis.trim() !== DEFAULT_FLEX_BASIS) overrides.push(`  flex-basis: ${item.flexBasis};`);
      if (item.alignSelf !== 'auto') overrides.push(`  align-self: ${item.alignSelf};`);
      if (overrides.length === 0) return null;
      return [`.item:nth-child(${index + 1}) {`, ...overrides, '}'].join('\n');
    })
    .filter((rule): rule is string => rule !== null);

  return [containerRule, ...itemRules].join('\n\n');
}
