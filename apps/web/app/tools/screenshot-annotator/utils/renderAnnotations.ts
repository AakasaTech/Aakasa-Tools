import { getAnnotationBounds, type Annotation, type BlurAnnotation } from './annotationModel';

function drawArrow(ctx: CanvasRenderingContext2D, a: import('./annotationModel').ArrowAnnotation) {
  ctx.strokeStyle = a.color;
  ctx.fillStyle = a.color;
  ctx.lineWidth = a.strokeWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x1, a.y1);
  ctx.lineTo(a.x2, a.y2);
  ctx.stroke();

  const angle = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
  const headLength = Math.max(10, a.strokeWidth * 3.5);
  const spread = Math.PI / 7;
  ctx.beginPath();
  ctx.moveTo(a.x2, a.y2);
  ctx.lineTo(a.x2 - headLength * Math.cos(angle - spread), a.y2 - headLength * Math.sin(angle - spread));
  ctx.lineTo(a.x2 - headLength * Math.cos(angle + spread), a.y2 - headLength * Math.sin(angle + spread));
  ctx.closePath();
  ctx.fill();
}

function drawRectangle(ctx: CanvasRenderingContext2D, a: import('./annotationModel').RectangleAnnotation) {
  const bounds = getAnnotationBounds(a);
  ctx.strokeStyle = a.color;
  ctx.lineWidth = a.strokeWidth;
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

function drawEllipse(ctx: CanvasRenderingContext2D, a: import('./annotationModel').EllipseAnnotation) {
  const bounds = getAnnotationBounds(a);
  ctx.strokeStyle = a.color;
  ctx.lineWidth = a.strokeWidth;
  ctx.beginPath();
  ctx.ellipse(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, Math.abs(bounds.width) / 2, Math.abs(bounds.height) / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFreehand(ctx: CanvasRenderingContext2D, a: import('./annotationModel').FreehandAnnotation) {
  if (a.points.length === 0) return;
  ctx.strokeStyle = a.color;
  ctx.fillStyle = a.color;
  ctx.lineWidth = a.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (a.points.length === 1) {
    const [p] = a.points;
    if (!p) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, a.strokeWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Quadratic-through-midpoints smoothing: noticeably less jagged than
  // raw point-to-point lineTo segments from pointermove sampling, with no
  // added dependency — evaluated against pulling in `perfect-freehand` for
  // this, but the visual difference for typical mouse/trackpad sampling
  // rates didn't justify a new library for this tool.
  ctx.beginPath();
  ctx.moveTo(a.points[0]!.x, a.points[0]!.y);
  for (let i = 1; i < a.points.length - 1; i += 1) {
    const current = a.points[i]!;
    const next = a.points[i + 1]!;
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }
  const last = a.points[a.points.length - 1]!;
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, a: import('./annotationModel').TextAnnotation) {
  if (!a.text) return;
  ctx.font = `${a.fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = a.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(a.text, a.x, a.y);
}

function drawHighlight(ctx: CanvasRenderingContext2D, a: import('./annotationModel').HighlightAnnotation) {
  const bounds = getAnnotationBounds(a);
  ctx.save();
  ctx.globalAlpha = a.opacity;
  ctx.fillStyle = a.color;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawStepMarker(ctx: CanvasRenderingContext2D, a: import('./annotationModel').StepMarkerAnnotation) {
  ctx.save();
  ctx.fillStyle = a.color;
  ctx.beginPath();
  ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(a.radius * 1.1)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(a.number), a.x, a.y + a.radius * 0.05);
  ctx.restore();
}

/**
 * Applies a blur/pixelate effect limited to exactly `annotation`'s
 * rectangle. `ctx.filter` (or CSS `filter`) applies to an entire canvas
 * context, not a sub-region — so a naive `ctx.filter = 'blur(Npx)'` right
 * before drawing would blur everything drawn after it, not just this box.
 * Instead: crop the region (padded, so the blur has real neighboring
 * pixels to sample rather than fading into transparent offscreen edges)
 * out of `sourceCanvas` — which already has the base image and every
 * annotation drawn below this one composited onto it — onto a small
 * offscreen canvas with the filter active, then composite that back onto
 * `ctx` through a clip path matching the *unpadded* rectangle exactly, so
 * nothing outside the selected area is ever touched regardless of the
 * padding used internally.
 */
function drawBlurRegion(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, a: BlurAnnotation) {
  const bounds = getAnnotationBounds(a);
  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);
  if (width <= 0 || height <= 0) return;
  const x = Math.round(bounds.x);
  const y = Math.round(bounds.y);

  if (a.mode === 'pixelate') {
    const blockSize = Math.max(2, Math.round(a.intensity));
    const smallWidth = Math.max(1, Math.round(width / blockSize));
    const smallHeight = Math.max(1, Math.round(height / blockSize));
    const small = document.createElement('canvas');
    small.width = smallWidth;
    small.height = smallHeight;
    const smallCtx = small.getContext('2d');
    if (!smallCtx) return;
    smallCtx.drawImage(sourceCanvas, x, y, width, height, 0, 0, smallWidth, smallHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, smallWidth, smallHeight, x, y, width, height);
    ctx.restore();
    return;
  }

  const pad = Math.ceil(a.intensity * 2);
  const sx = Math.max(0, x - pad);
  const sy = Math.max(0, y - pad);
  const ex = Math.min(sourceCanvas.width, x + width + pad);
  const ey = Math.min(sourceCanvas.height, y + height + pad);
  const paddedWidth = ex - sx;
  const paddedHeight = ey - sy;
  if (paddedWidth <= 0 || paddedHeight <= 0) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = paddedWidth;
  offscreen.height = paddedHeight;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;
  offCtx.filter = `blur(${a.intensity}px)`;
  offCtx.drawImage(sourceCanvas, sx, sy, paddedWidth, paddedHeight, 0, 0, paddedWidth, paddedHeight);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(offscreen, sx, sy);
  ctx.restore();
}

/**
 * Flattens `baseImage` plus every annotation (in order — later entries
 * draw on top) onto `canvas`. Sized to the base image's native resolution
 * regardless of the on-screen editor's current zoom, so exports are always
 * full quality. This is the exact function both the live editor preview
 * and the final "flatten and download" export call — the editor also
 * layers a selection-handle overlay on top afterward, but that overlay is
 * never part of this function or the exported image.
 */
export function renderAnnotationsToCanvas(canvas: HTMLCanvasElement, baseImage: ImageBitmap, annotations: Annotation[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0);

  for (const annotation of annotations) {
    switch (annotation.type) {
      case 'arrow':
        drawArrow(ctx, annotation);
        break;
      case 'rectangle':
        drawRectangle(ctx, annotation);
        break;
      case 'ellipse':
        drawEllipse(ctx, annotation);
        break;
      case 'freehand':
        drawFreehand(ctx, annotation);
        break;
      case 'text':
        drawText(ctx, annotation);
        break;
      case 'highlight':
        drawHighlight(ctx, annotation);
        break;
      case 'step':
        drawStepMarker(ctx, annotation);
        break;
      case 'blur':
        drawBlurRegion(ctx, canvas, annotation);
        break;
    }
  }
}
