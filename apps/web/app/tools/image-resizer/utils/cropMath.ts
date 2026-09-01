/**
 * Pure geometry for the interactive crop box — no DOM, no React. Kept
 * separate from cropImage.ts (which does the actual Canvas export) so the
 * drag/resize math can be tested and reasoned about on its own.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HandleName = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface Bounds {
  width: number;
  height: number;
}

const MIN_SIZE = 10;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamps `value` into [MIN_SIZE, max] — every size clamp below needs both
 * a floor (a fast inward drag can otherwise go negative) and a ceiling
 * (bounds-fitting), so this is used everywhere a width/height gets sized. */
function clampSize(value: number, max: number): number {
  return Math.max(MIN_SIZE, Math.min(value, max));
}

/** Repositions the rect by (deltaX, deltaY), clamped so it never leaves
 * the image bounds. Size never changes. */
export function moveRect(startRect: CropRect, deltaX: number, deltaY: number, bounds: Bounds): CropRect {
  const x = Math.max(0, Math.min(bounds.width - startRect.width, startRect.x + deltaX));
  const y = Math.max(0, Math.min(bounds.height - startRect.height, startRect.y + deltaY));
  return { x, y, width: startRect.width, height: startRect.height };
}

/**
 * Resizes the rect by dragging `handle`, optionally constrained to
 * `aspectRatio` (width / height).
 *
 * Bounds-fitting happens by clamping the SIZE against how much room the
 * relevant anchor has, before deriving final edges — not by clamping each
 * edge independently afterward. That distinction matters once an aspect
 * ratio is locked: independently clamping, say, `newLeft` to 0 after the
 * ratio had already been applied would shrink the width without shrinking
 * height to match, silently breaking the ratio right at the image
 * boundary. Confirmed this was a real bug (not just a theoretical one) via
 * a self-test before wiring this up to any UI — a 16:9-locked 's' (bottom
 * edge) drag near the top of the image reproduced it directly.
 */
export function resizeRect(startRect: CropRect, handle: HandleName, deltaX: number, deltaY: number, aspectRatio: number | null, bounds: Bounds): CropRect {
  const left = startRect.x;
  const top = startRect.y;
  const right = startRect.x + startRect.width;
  const bottom = startRect.y + startRect.height;

  let newLeft = left;
  let newTop = top;
  let newRight = right;
  let newBottom = bottom;

  if (handle.includes('w')) newLeft = left + deltaX;
  if (handle.includes('e')) newRight = right + deltaX;
  if (handle.includes('n')) newTop = top + deltaY;
  if (handle.includes('s')) newBottom = bottom + deltaY;

  let width = newRight - newLeft;
  let height = newBottom - newTop;

  if (aspectRatio) {
    if (handle === 'n' || handle === 's') {
      width = height * aspectRatio;
    } else if (handle === 'e' || handle === 'w') {
      height = width / aspectRatio;
    } else {
      const widthChange = Math.abs(width - startRect.width);
      const heightChange = Math.abs(height - startRect.height);
      if (widthChange >= heightChange) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    }
  }

  const isCenteredEdge = aspectRatio !== null && (handle === 'n' || handle === 's' || handle === 'e' || handle === 'w');

  if (isCenteredEdge) {
    if (handle === 'n' || handle === 's') {
      // Width is centered on the rect's original horizontal center (a
      // pure top/bottom drag has no natural left/right anchor); height is
      // anchored at the fixed top ('s' drags down from a fixed top) or
      // fixed bottom ('n' drags up from a fixed bottom).
      const centerX = (left + right) / 2;
      const maxWidthFromCenter = 2 * Math.min(centerX, bounds.width - centerX);
      const maxHeightFromAnchor = handle === 's' ? bounds.height - top : bottom;
      const maxWidthAllowed = Math.min(maxWidthFromCenter, maxHeightFromAnchor * aspectRatio);
      width = clampSize(width, maxWidthAllowed);
      height = width / aspectRatio;
      newLeft = centerX - width / 2;
      newRight = centerX + width / 2;
      newTop = handle === 's' ? top : bottom - height;
      newBottom = handle === 's' ? top + height : bottom;
    } else {
      const centerY = (top + bottom) / 2;
      const maxHeightFromCenter = 2 * Math.min(centerY, bounds.height - centerY);
      const maxWidthFromAnchor = handle === 'e' ? bounds.width - left : right;
      const maxHeightAllowed = Math.min(maxHeightFromCenter, maxWidthFromAnchor / aspectRatio);
      height = clampSize(height, maxHeightAllowed);
      width = height * aspectRatio;
      newTop = centerY - height / 2;
      newBottom = centerY + height / 2;
      newLeft = handle === 'e' ? left : right - width;
      newRight = handle === 'e' ? left + width : right;
    }
  } else {
    // Corner handles (ratio-locked or not) and non-ratio edge handles all
    // have one fixed anchor corner/edge — clamp width/height against the
    // room available from that anchor, then derive edges directly.
    const anchorLeft = handle.includes('w') ? right : left;
    const anchorTop = handle.includes('n') ? bottom : top;
    const maxWidth = handle.includes('w') ? anchorLeft : bounds.width - anchorLeft;
    const maxHeight = handle.includes('n') ? anchorTop : bounds.height - anchorTop;

    if (aspectRatio) {
      const maxWidthAllowed = Math.min(maxWidth, maxHeight * aspectRatio);
      width = clampSize(width, maxWidthAllowed);
      height = width / aspectRatio;
    } else {
      width = clampSize(width, maxWidth);
      height = clampSize(height, maxHeight);
    }

    newLeft = handle.includes('w') ? anchorLeft - width : anchorLeft;
    newRight = newLeft + width;
    newTop = handle.includes('n') ? anchorTop - height : anchorTop;
    newBottom = newTop + height;
  }

  return {
    x: round2(newLeft),
    y: round2(newTop),
    width: round2(newRight - newLeft),
    height: round2(newBottom - newTop),
  };
}

/** A crop rect covering the whole image at the given (optionally
 * ratio-constrained) starting shape, centered. */
export function initialCropRect(bounds: Bounds, aspectRatio: number | null): CropRect {
  if (!aspectRatio) {
    return { x: 0, y: 0, width: bounds.width, height: bounds.height };
  }
  const boundsRatio = bounds.width / bounds.height;
  let width: number;
  let height: number;
  if (boundsRatio > aspectRatio) {
    height = bounds.height;
    width = height * aspectRatio;
  } else {
    width = bounds.width;
    height = width / aspectRatio;
  }
  return { x: (bounds.width - width) / 2, y: (bounds.height - height) / 2, width, height };
}
