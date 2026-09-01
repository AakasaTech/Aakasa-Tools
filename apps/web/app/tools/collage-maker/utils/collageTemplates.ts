/** A cell's position/size as a fraction (0–1) of the overall canvas —
 * templates are defined this way so they scale cleanly to any chosen
 * output dimensions rather than being pinned to one pixel size. */
export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollageTemplate {
  id: string;
  label: string;
  photoCount: number;
  cells: CellRect[];
}

const THIRD = 1 / 3;

export const COLLAGE_TEMPLATES: CollageTemplate[] = [
  {
    id: '2-side-by-side',
    label: '2 · side by side',
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: '2-stacked',
    label: '2 · stacked',
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: '3-left-large',
    label: '3 · large left',
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: 0.5 },
      { x: 0.6, y: 0.5, width: 0.4, height: 0.5 },
    ],
  },
  {
    id: '3-top-large',
    label: '3 · large top',
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.6 },
      { x: 0, y: 0.6, width: 0.5, height: 0.4 },
      { x: 0.5, y: 0.6, width: 0.5, height: 0.4 },
    ],
  },
  {
    id: '3-columns',
    label: '3 · columns',
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: THIRD, height: 1 },
      { x: THIRD, y: 0, width: THIRD, height: 1 },
      { x: 2 * THIRD, y: 0, width: THIRD, height: 1 },
    ],
  },
  {
    id: '4-grid',
    label: '4 · grid',
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: '4-left-large',
    label: '4 · large left',
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: THIRD },
      { x: 0.6, y: THIRD, width: 0.4, height: THIRD },
      { x: 0.6, y: 2 * THIRD, width: 0.4, height: THIRD },
    ],
  },
  {
    id: '4-columns',
    label: '4 · columns',
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 1 },
      { x: 0.25, y: 0, width: 0.25, height: 1 },
      { x: 0.5, y: 0, width: 0.25, height: 1 },
      { x: 0.75, y: 0, width: 0.25, height: 1 },
    ],
  },
  {
    id: '4-rows',
    label: '4 · rows',
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.25 },
      { x: 0, y: 0.25, width: 1, height: 0.25 },
      { x: 0, y: 0.5, width: 1, height: 0.25 },
      { x: 0, y: 0.75, width: 1, height: 0.25 },
    ],
  },
  {
    id: '5-mixed',
    label: '5 · mixed',
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: THIRD, height: 0.5 },
      { x: THIRD, y: 0.5, width: THIRD, height: 0.5 },
      { x: 2 * THIRD, y: 0.5, width: THIRD, height: 0.5 },
    ],
  },
  {
    id: '5-left-large',
    label: '5 · large left',
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.25, height: 0.5 },
      { x: 0.75, y: 0, width: 0.25, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.25, height: 0.5 },
      { x: 0.75, y: 0.5, width: 0.25, height: 0.5 },
    ],
  },
  {
    id: '6-grid',
    label: '6 · grid',
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: THIRD, height: 0.5 },
      { x: THIRD, y: 0, width: THIRD, height: 0.5 },
      { x: 2 * THIRD, y: 0, width: THIRD, height: 0.5 },
      { x: 0, y: 0.5, width: THIRD, height: 0.5 },
      { x: THIRD, y: 0.5, width: THIRD, height: 0.5 },
      { x: 2 * THIRD, y: 0.5, width: THIRD, height: 0.5 },
    ],
  },
];
