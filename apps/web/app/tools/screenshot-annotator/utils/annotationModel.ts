export type ToolType = 'arrow' | 'rectangle' | 'ellipse' | 'freehand' | 'text' | 'blur' | 'highlight' | 'step';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BaseAnnotation {
  id: string;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur';
  x: number;
  y: number;
  width: number;
  height: number;
  mode: 'blur' | 'pixelate';
  intensity: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface StepMarkerAnnotation extends BaseAnnotation {
  type: 'step';
  x: number;
  y: number;
  number: number;
  color: string;
  radius: number;
}

export type Annotation =
  | ArrowAnnotation
  | RectangleAnnotation
  | EllipseAnnotation
  | FreehandAnnotation
  | TextAnnotation
  | BlurAnnotation
  | HighlightAnnotation
  | StepMarkerAnnotation;

/** Annotation types whose bounding box can be dragged by a corner handle to
 * resize — matches the spec's "movable (drag), resizable (for shapes/text
 * boxes)": arrow and freehand stay move-only, since resizing a freehand
 * stroke or an arrow by its bounding box doesn't map onto a meaningful
 * gesture the way it does for an axis-aligned rectangle. */
export type ResizableAnnotation = RectangleAnnotation | EllipseAnnotation | BlurAnnotation | HighlightAnnotation | TextAnnotation;

export function isResizable(annotation: Annotation): annotation is ResizableAnnotation {
  return annotation.type === 'rectangle' || annotation.type === 'ellipse' || annotation.type === 'blur' || annotation.type === 'highlight' || annotation.type === 'text';
}

const DEFAULT_TEXT_WIDTH_PER_CHAR = 0.6;

/** Axis-aligned bounding box for any annotation, in canvas-pixel space —
 * the single shared geometry every hit-test, drag, resize, and selection
 * handle computation is built on, so all of those stay consistent with
 * each other by construction. `measureText`, when given, produces an
 * exact text width; without it (moving/hit-testing don't need exactness)
 * a monospace-ish estimate is used instead. */
export function getAnnotationBounds(annotation: Annotation, measureText?: (text: string, fontSize: number) => number): Rect {
  switch (annotation.type) {
    case 'arrow': {
      const x = Math.min(annotation.x1, annotation.x2);
      const y = Math.min(annotation.y1, annotation.y2);
      return { x, y, width: Math.abs(annotation.x2 - annotation.x1), height: Math.abs(annotation.y2 - annotation.y1) };
    }
    case 'rectangle':
    case 'ellipse':
    case 'blur':
    case 'highlight': {
      const x = annotation.width >= 0 ? annotation.x : annotation.x + annotation.width;
      const y = annotation.height >= 0 ? annotation.y : annotation.y + annotation.height;
      return { x, y, width: Math.abs(annotation.width), height: Math.abs(annotation.height) };
    }
    case 'freehand': {
      if (annotation.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of annotation.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case 'text': {
      const width = measureText ? measureText(annotation.text, annotation.fontSize) : annotation.text.length * annotation.fontSize * DEFAULT_TEXT_WIDTH_PER_CHAR;
      return { x: annotation.x, y: annotation.y, width: Math.max(width, 4), height: annotation.fontSize * 1.3 };
    }
    case 'step':
      return { x: annotation.x - annotation.radius, y: annotation.y - annotation.radius, width: annotation.radius * 2, height: annotation.radius * 2 };
  }
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/** Whether `point` counts as a click on `annotation`, for select-tool
 * hit-testing — line-ish shapes (arrow, freehand) test distance-to-stroke
 * within a tolerance; filled/boxed shapes test point-in-bounding-box
 * (generous — anywhere inside a rectangle's outline selects it, not just
 * the border pixels, matching how most editors behave). */
export function hitTestAnnotation(annotation: Annotation, point: Point, tolerance: number, measureText?: (text: string, fontSize: number) => number): boolean {
  switch (annotation.type) {
    case 'arrow':
      return distanceToSegment(point, { x: annotation.x1, y: annotation.y1 }, { x: annotation.x2, y: annotation.y2 }) <= tolerance + annotation.strokeWidth / 2;
    case 'freehand': {
      for (let i = 0; i < annotation.points.length - 1; i += 1) {
        const a = annotation.points[i];
        const b = annotation.points[i + 1];
        if (a && b && distanceToSegment(point, a, b) <= tolerance + annotation.strokeWidth / 2) return true;
      }
      return annotation.points.length === 1 && !!annotation.points[0] && Math.hypot(point.x - annotation.points[0].x, point.y - annotation.points[0].y) <= tolerance;
    }
    case 'step':
      return Math.hypot(point.x - annotation.x, point.y - annotation.y) <= annotation.radius + tolerance;
    default: {
      const bounds = getAnnotationBounds(annotation, measureText);
      return point.x >= bounds.x - tolerance && point.x <= bounds.x + bounds.width + tolerance && point.y >= bounds.y - tolerance && point.y <= bounds.y + bounds.height + tolerance;
    }
  }
}

/** Pure translation — returns a new annotation, never mutates. */
export function moveAnnotation(annotation: Annotation, dx: number, dy: number): Annotation {
  switch (annotation.type) {
    case 'arrow':
      return { ...annotation, x1: annotation.x1 + dx, y1: annotation.y1 + dy, x2: annotation.x2 + dx, y2: annotation.y2 + dy };
    case 'rectangle':
    case 'ellipse':
    case 'blur':
    case 'highlight':
    case 'text':
      return { ...annotation, x: annotation.x + dx, y: annotation.y + dy };
    case 'freehand':
      return { ...annotation, points: annotation.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case 'step':
      return { ...annotation, x: annotation.x + dx, y: annotation.y + dy };
  }
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

/** Resizes a `ResizableAnnotation` by dragging one corner handle, given the
 * annotation's bounds *at drag start* and the pointer's current canvas
 * position — always recomputed from the original bounds rather than
 * incrementally from the previous frame, so drags stay numerically exact
 * over long gestures. */
export function resizeAnnotation(annotation: ResizableAnnotation, handle: ResizeHandle, startBounds: Rect, pointer: Point): ResizableAnnotation {
  let { x, y, width, height } = startBounds;
  const right = startBounds.x + startBounds.width;
  const bottom = startBounds.y + startBounds.height;

  if (handle === 'nw') {
    x = pointer.x;
    y = pointer.y;
    width = right - pointer.x;
    height = bottom - pointer.y;
  } else if (handle === 'ne') {
    y = pointer.y;
    width = pointer.x - startBounds.x;
    height = bottom - pointer.y;
  } else if (handle === 'sw') {
    x = pointer.x;
    width = right - pointer.x;
    height = pointer.y - startBounds.y;
  } else {
    width = pointer.x - startBounds.x;
    height = pointer.y - startBounds.y;
  }

  if (annotation.type === 'text') {
    return { ...annotation, x, y, fontSize: Math.max(8, height / 1.3) };
  }
  return { ...annotation, x, y, width, height };
}
