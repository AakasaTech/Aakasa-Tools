import { createElement, type ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import type { InvoiceData } from './invoiceTypes';

/**
 * Generates the invoice PDF entirely in the browser and resolves to a
 * Blob — no network request of any kind. @react-pdf/renderer and the
 * document layout are both dynamically imported here (never at module
 * top-level) because @react-pdf/renderer touches browser-only APIs at
 * import time; importing it eagerly would break this file being pulled
 * into a server-rendered component tree. Deferring the import to the
 * moment a PDF is actually requested also keeps its ~1MB+ bundle out of
 * this tool's initial page load.
 *
 * Kept as plain TypeScript (no JSX) via `createElement` — see
 * InvoiceDocument.tsx for the actual react-pdf layout, which needs .tsx.
 */
export async function generateInvoicePdf(invoiceData: InvoiceData): Promise<Blob> {
  const [{ pdf }, { InvoiceDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./InvoiceDocument'),
  ]);

  // InvoiceDocument's own props (`{ data }`) aren't the <Document> element
  // it renders, so TS can't structurally verify this element matches
  // pdf()'s expected `ReactElement<DocumentProps>` — it does at runtime
  // (InvoiceDocument's only job is rendering exactly one <Document>), so
  // this is a narrow, deliberate assertion rather than a type-safety gap.
  const documentElement = createElement(InvoiceDocument, { data: invoiceData }) as unknown as ReactElement<DocumentProps>;
  const instance = pdf(documentElement);
  return instance.toBlob();
}
