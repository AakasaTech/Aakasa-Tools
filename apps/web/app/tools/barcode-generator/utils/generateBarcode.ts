import JsBarcode from 'jsbarcode';

/**
 * The exact format strings JsBarcode 3.12.3 registers (verified in its
 * own source — `src/barcodes/index.js` — rather than assumed from its
 * docs): CODE39, CODE128(/A/B/C), EAN13, EAN8, EAN5, EAN2, UPC, UPCE,
 * ITF14, ITF, MSI(+variants), pharmacode, codabar, CODE93(+FullASCII).
 * This tool exposes the subset the spec asked for, using JsBarcode's own
 * names (e.g. `UPC`, not `UPC-A`) rather than the more familiar retail
 * names, which are used only for display.
 */
export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14';

export interface FormatInfo {
  /** Familiar retail name shown in the UI — JsBarcode's own format string differs for EAN-13/UPC-A. */
  label: string;
  sample: string;
  guidance: string;
}

/**
 * Guidance text here is written to match JsBarcode's *actual* check-digit
 * behavior, verified directly in its source (EAN13.js, EAN8.js, UPC.js,
 * ITF14.js): each of these formats auto-computes and appends the check
 * digit when given the input *without* it (12/7/11/13 digits
 * respectively); given the full length instead, the supplied check digit
 * is used as-is and must be correct, or generation fails.
 */
export const FORMAT_INFO: Record<BarcodeFormat, FormatInfo> = {
  CODE128: {
    label: 'CODE128',
    sample: 'HELLO-123',
    guidance: 'Any length, almost any character (letters, digits, punctuation) — no check digit.',
  },
  CODE39: {
    label: 'CODE39',
    sample: 'CODE-39',
    guidance: 'Any length, but only uppercase A–Z, digits, and - . space $ / + % — no check digit.',
  },
  EAN13: {
    label: 'EAN-13',
    sample: '590123412345',
    guidance: 'Enter 12 digits and the check digit is computed and added for you — or enter all 13 yourself, with a correct check digit as the 13th.',
  },
  EAN8: {
    label: 'EAN-8',
    sample: '9638507',
    guidance: 'Enter 7 digits and the check digit is computed and added for you — or enter all 8 yourself, with a correct check digit as the 8th.',
  },
  UPC: {
    label: 'UPC-A',
    sample: '03600029145',
    guidance: 'Enter 11 digits and the check digit is computed and added for you — or enter all 12 yourself, with a correct check digit as the 12th.',
  },
  ITF14: {
    label: 'ITF-14',
    sample: '1540014128876',
    guidance: 'Enter 13 digits and the check digit is computed and added for you — or enter all 14 yourself, with a correct check digit as the 14th.',
  },
};

export interface BarcodeRenderOptions {
  displayValue: boolean;
  width: number;
  height: number;
  margin: number;
  background?: string;
  lineColor?: string;
}

/** JsBarcode's default (no custom `valid` callback) error path throws the
 * exception's `.message` as a bare *string*, not an Error instance — this
 * normalizes either shape into a plain message. */
function errorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return 'Could not generate a barcode for this value.';
}

export function generateBarcodeDataUrl(value: string, format: BarcodeFormat, options: BarcodeRenderOptions): { dataUrl: string; error?: string } {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, { format, ...options });
    return { dataUrl: canvas.toDataURL('image/png') };
  } catch (err) {
    return { dataUrl: '', error: errorMessage(err) };
  }
}

export function generateBarcodeSvg(value: string, format: BarcodeFormat, options: BarcodeRenderOptions): { svg: string; error?: string } {
  try {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgEl, value, { format, ...options });
    return { svg: new XMLSerializer().serializeToString(svgEl) };
  } catch (err) {
    return { svg: '', error: errorMessage(err) };
  }
}

/** Blob variant of `generateBarcodeDataUrl`, for batch ZIP export. */
export function generateBarcodeBlob(value: string, format: BarcodeFormat, options: BarcodeRenderOptions): Promise<{ blob: Blob | null; error?: string }> {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, { format, ...options });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve({ blob }), 'image/png');
    });
  } catch (err) {
    return Promise.resolve({ blob: null, error: errorMessage(err) });
  }
}
