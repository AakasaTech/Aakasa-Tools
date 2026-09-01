export type BackgroundMode = 'solid' | 'gradient' | 'pattern';
export type PatternType = 'diagonal-stripes' | 'checkerboard';
export type TextPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface PlaceholderOptions {
  width: number;
  height: number;
  backgroundMode: BackgroundMode;
  /** Solid fill color, or the gradient's/pattern's primary color. */
  backgroundColor: string;
  /** Gradient end color — only used when backgroundMode is 'gradient'. */
  backgroundColor2: string;
  pattern: PatternType;
  transparentBackground: boolean;
  text: string;
  autoFontSize: boolean;
  fontSize: number;
  textColor: string;
  textPosition: TextPosition;
}

function drawDiagonalStripes(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const stripeWidth = Math.max(8, Math.round(Math.min(width, height) * 0.04));
  const diagonal = Math.sqrt(width * width + height * height);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = color;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 4);
  for (let x = -diagonal; x < diagonal; x += stripeWidth * 2) {
    ctx.fillRect(x, -diagonal, stripeWidth, diagonal * 2);
  }
  ctx.restore();
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const cell = Math.max(10, Math.round(Math.min(width, height) * 0.06));
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = color;
  for (let y = 0; y * cell < height; y += 1) {
    for (let x = 0; x * cell < width; x += 1) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  ctx.restore();
}

function paintBackground(ctx: CanvasRenderingContext2D, options: PlaceholderOptions) {
  const { width, height } = options;

  if (options.backgroundMode === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, options.backgroundColor);
    gradient.addColorStop(1, options.backgroundColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (options.backgroundMode === 'pattern') {
    // Drawn as a translucent overlay on top of the flat fill, in a
    // slightly darker/contrasting shade derived by drawing black at low
    // alpha over the base color — simplest way to get a visible pattern
    // that still reads as "the same color family" rather than a jarring
    // second color.
    const overlayColor = '#000000';
    if (options.pattern === 'checkerboard') {
      drawCheckerboard(ctx, width, height, overlayColor);
    } else {
      drawDiagonalStripes(ctx, width, height, overlayColor);
    }
  }
}

function autoFontSizeFor(width: number, height: number): number {
  return Math.max(14, Math.round(Math.min(width, height) * 0.12));
}

function paintText(ctx: CanvasRenderingContext2D, options: PlaceholderOptions) {
  const text = options.text.trim();
  if (!text) return;

  const baseFontSize = options.autoFontSize ? autoFontSizeFor(options.width, options.height) : options.fontSize;
  const padding = Math.max(12, baseFontSize * 0.4);
  const maxTextWidth = Math.max(1, options.width - padding * 2);

  ctx.font = `600 ${baseFontSize}px system-ui, -apple-system, sans-serif`;
  const measured = ctx.measureText(text).width;
  const fontSize = measured > maxTextWidth ? Math.max(8, baseFontSize * (maxTextWidth / measured)) : baseFontSize;
  if (fontSize !== baseFontSize) {
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  }

  ctx.fillStyle = options.textColor;
  ctx.textBaseline = 'middle';

  let x = options.width / 2;
  let y = options.height / 2;
  let align: CanvasTextAlign = 'center';

  switch (options.textPosition) {
    case 'top-left':
      x = padding;
      y = padding + fontSize / 2;
      align = 'left';
      break;
    case 'top-right':
      x = options.width - padding;
      y = padding + fontSize / 2;
      align = 'right';
      break;
    case 'bottom-left':
      x = padding;
      y = options.height - padding - fontSize / 2;
      align = 'left';
      break;
    case 'bottom-right':
      x = options.width - padding;
      y = options.height - padding - fontSize / 2;
      align = 'right';
      break;
    default:
      break;
  }

  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

/** Renders a full placeholder image to `canvas` at its exact requested
 * pixel dimensions — the canvas's own width/height attributes are set here
 * to `options.width`/`options.height` directly, independent of whatever
 * CSS size it's displayed at, so the export always matches the requested
 * resolution regardless of preview scaling. */
export function renderPlaceholderToCanvas(canvas: HTMLCanvasElement, options: PlaceholderOptions): void {
  canvas.width = options.width;
  canvas.height = options.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, options.width, options.height);

  if (!options.transparentBackground) {
    paintBackground(ctx, options);
  }

  paintText(ctx, options);
}
