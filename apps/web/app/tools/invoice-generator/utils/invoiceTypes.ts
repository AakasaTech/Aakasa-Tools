export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type DiscountType = 'flat' | 'percent';

export interface InvoiceData {
  fromName: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  /** Base64 data URI (or null if no logo uploaded) — embeddable directly by both the HTML preview and the PDF. */
  logoDataUrl: string | null;

  billToName: string;
  billToAddress: string;
  billToEmail: string;

  invoiceNumber: string;
  /** ISO yyyy-mm-dd */
  issueDate: string;
  /** ISO yyyy-mm-dd */
  dueDate: string;

  currency: string;

  lineItems: LineItem[];

  taxRatePercent: number;
  discountType: DiscountType;
  discountValue: number;

  notes: string;
}
