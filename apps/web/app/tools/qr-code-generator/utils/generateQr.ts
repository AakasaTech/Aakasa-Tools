import QRCode from 'qrcode';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrOptions {
  /** Output width/height in pixels — QR codes are always square. */
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  /** Quiet-zone width in modules. Defaults to 2. */
  margin?: number;
  /** Data URL of a logo image to overlay, centered, on top of the code. */
  logoDataUrl?: string;
  /** Fraction of `size` the logo's bounding box occupies. Defaults to 0.22. */
  logoScale?: number;
}

const DEFAULT_MARGIN = 2;
const DEFAULT_LOGO_SCALE = 0.22;

/**
 * Canonical QR generation wrapper around the `qrcode` package — this is the
 * function every tool that needs a QR code (this one, and anything else in
 * the toolbox later) should import, rather than each keeping its own copy.
 */
export async function generateQrDataUrl(payload: string, options: QrOptions): Promise<string> {
  const baseDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin ?? DEFAULT_MARGIN,
    width: options.size,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor,
    },
  });

  if (!options.logoDataUrl) {
    return baseDataUrl;
  }

  return compositeLogoOntoDataUrl(baseDataUrl, options.logoDataUrl, options.size, options.logoScale ?? DEFAULT_LOGO_SCALE);
}

export async function generateQrSvg(payload: string, options: QrOptions): Promise<string> {
  const svg = await QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin ?? DEFAULT_MARGIN,
    width: options.size,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor,
    },
  });

  if (!options.logoDataUrl) {
    return svg;
  }

  return embedLogoInSvg(svg, options.logoDataUrl, options.size, options.logoScale ?? DEFAULT_LOGO_SCALE);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image.'));
    image.src = src;
  });
}

/**
 * Draws the base QR code and the logo onto an offscreen canvas, with a
 * small white backdrop behind the logo so it stays legible against
 * whatever dark modules would otherwise sit underneath it.
 */
async function compositeLogoOntoDataUrl(
  baseDataUrl: string,
  logoDataUrl: string,
  size: number,
  logoScale: number,
): Promise<string> {
  const [qrImage, logoImage] = await Promise.all([loadImage(baseDataUrl), loadImage(logoDataUrl)]);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return baseDataUrl;
  }

  ctx.drawImage(qrImage, 0, 0, size, size);

  const logoSize = size * logoScale;
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;
  const padding = logoSize * 0.1;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2);
  ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

  return canvas.toDataURL('image/png');
}

/** Injects a white backdrop + `<image>` element into the SVG markup, just before the closing tag so it renders on top. */
function embedLogoInSvg(svg: string, logoDataUrl: string, size: number, logoScale: number): string {
  const logoSize = size * logoScale;
  const offset = (size - logoSize) / 2;
  const padding = logoSize * 0.1;

  const withXlinkNamespace = svg.includes('xmlns:xlink')
    ? svg
    : svg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');

  const overlay =
    `<rect x="${offset - padding}" y="${offset - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="#ffffff" />` +
    `<image href="${logoDataUrl}" xlink:href="${logoDataUrl}" x="${offset}" y="${offset}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" />`;

  return withXlinkNamespace.replace('</svg>', `${overlay}</svg>`);
}
