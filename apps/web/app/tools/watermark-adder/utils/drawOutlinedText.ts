export interface OutlinedTextStyle {
  fillColor: string;
  /** Omit or pass 0 width for no stroke. */
  strokeColor?: string;
  strokeWidth?: number;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

/**
 * Draws `text` at (x, y) in the context's *current* font (callers set
 * `ctx.font` beforehand), stroking before filling so the stroke sits behind
 * the fill rather than on top of it — the classic "outlined text" look used
 * by both watermarks and meme captions to stay legible over any
 * background. Only touches fill/stroke/alignment state; callers that also
 * translate/rotate/set alpha around this call are expected to
 * save/restore the context themselves.
 */
export function drawOutlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: OutlinedTextStyle): void {
  ctx.textAlign = style.textAlign ?? 'center';
  ctx.textBaseline = style.textBaseline ?? 'middle';

  if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
    ctx.lineWidth = style.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = style.strokeColor;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = style.fillColor;
  ctx.fillText(text, x, y);
}
