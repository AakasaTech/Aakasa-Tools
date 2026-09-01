export interface RasterOptions {
  width: number;
  height: number;
  /** A canvas.toBlob mime type, e.g. 'image/png'. */
  format: string;
  backgroundColor?: string;
  quality?: number;
}

/** Ensures `svgMarkup`'s root has a `viewBox` before its width/height are
 * overridden — without one, forcing new width/height attributes just
 * enlarges the SVG's *viewport* while its content stays pinned at its
 * original coordinate size (a 24×24 icon given `width="1024"` renders as a
 * tiny 24px graphic in the corner of a 1024px canvas, not scaled up). A
 * `viewBox` is what makes width/height actually *scale* the content. If
 * one isn't already present, it's synthesized from the SVG's own original
 * width/height (falling back to the SVG spec's default 300×150 intrinsic
 * size when neither is given) before the target dimensions are applied,
 * so the original content's proportions are preserved as it scales. */
function withExplicitSize(svgMarkup: string, width: number, height: number): string {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  const svgEl = doc.documentElement;

  if (!svgEl.hasAttribute('viewBox')) {
    const originalWidth = parseFloat(svgEl.getAttribute('width') ?? '') || 300;
    const originalHeight = parseFloat(svgEl.getAttribute('height') ?? '') || 150;
    svgEl.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
  }
  svgEl.setAttribute('width', String(width));
  svgEl.setAttribute('height', String(height));

  return new XMLSerializer().serializeToString(doc);
}

function svgToDataUri(svgMarkup: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgMarkup)))}`;
}

/** Parses `svgMarkup` as XML without ever attaching it to the live
 * document — this alone can't execute embedded scripts or fire event
 * handlers, so it's safe to use purely for well-formedness validation. */
export function isWellFormedSvg(svgMarkup: string): boolean {
  if (!svgMarkup.trim()) return false;
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  return !doc.querySelector('parsererror') && doc.documentElement.nodeName.toLowerCase() === 'svg';
}

/**
 * Loads `svgMarkup` as an `<img>` element via a `data:image/svg+xml`
 * URI — this is the safe rendering path this whole tool relies on:
 * browsers do not execute `<script>` tags or `on*` event handler
 * attributes embedded in an SVG loaded through `<img src>` (unlike
 * `<object>`/`<embed>`, which load it as a live, scriptable document, or
 * `dangerouslySetInnerHTML`, which inserts it directly into the DOM).
 * Never used for anything other than an `<img>` src or a Canvas
 * `drawImage` source.
 */
export function loadSvgImage(svgMarkup: string): Promise<HTMLImageElement> {
  if (!isWellFormedSvg(svgMarkup)) {
    return Promise.reject(new Error("This doesn't look like valid SVG markup — check that it starts with an <svg> root element."));
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This SVG failed to render — it may use a feature this browser can\'t decode as an image.'));
    img.src = svgToDataUri(svgMarkup);
  });
}

/**
 * Converts `svgMarkup` to a raster image Blob at exactly
 * `options.width`×`options.height`. Rendered fresh from the vector source
 * at that exact target size (via `withExplicitSize`, so the SVG's own
 * width/height/viewBox are set to the target before it's even decoded)
 * rather than decoded once and scaled — each call genuinely re-rasterizes
 * from the vector, so calling this at 1x/2x/3x produces independently
 * sharp output at each size, not one bitmap stretched three ways.
 */
export async function convertSvgToRaster(svgMarkup: string, options: RasterOptions): Promise<Blob> {
  const sizedMarkup = withExplicitSize(svgMarkup, options.width, options.height);
  const img = await loadSvgImage(sizedMarkup);

  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, options.width, options.height);
  }
  ctx.drawImage(img, 0, 0, options.width, options.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), options.format, options.quality);
  });
}
