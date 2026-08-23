/**
 * Pure money math — no DOM, no React. Every intermediate amount is rounded
 * to the cent (2 decimal places) as soon as it's produced, not just at
 * final display. Rounding only at the end would let floating-point residue
 * (0.1 + 0.2 = 0.30000000000000004) leak into a displayed subtotal that
 * silently doesn't match the sum of the displayed line totals — rounding
 * at each step keeps every number on screen internally consistent with the
 * ones it was built from.
 */

import type { DiscountType, LineItem } from './invoiceTypes';

/** Rounds to the nearest cent, avoiding float artifacts like 10.999999999998. */
export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return roundToCents(quantity * unitPrice);
}

export function calculateSubtotal(lineItems: LineItem[]): number {
  const total = lineItems.reduce((sum, item) => sum + calculateLineTotal(item.quantity, item.unitPrice), 0);
  return roundToCents(total);
}

/**
 * Discount amount taken off the subtotal. A flat discount is clamped to the
 * subtotal so it can never push the pre-tax amount negative; a percentage
 * discount is clamped the same way as a safety net against a >100% input.
 */
export function calculateDiscount(subtotal: number, discountType: DiscountType, discountValue: number): number {
  if (subtotal <= 0 || discountValue <= 0) {
    return 0;
  }
  const raw = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue;
  return roundToCents(Math.min(Math.max(raw, 0), subtotal));
}

/**
 * Tax on `taxableAmount` — the caller is expected to pass the subtotal
 * AFTER discount, not the raw subtotal. Standard invoicing practice
 * (VAT/GST/sales tax) taxes what the customer actually owes before tax,
 * not the pre-discount list price — taxing the raw subtotal would overtax
 * every discounted invoice.
 */
export function calculateTax(taxableAmount: number, ratePercent: number): number {
  if (taxableAmount <= 0 || ratePercent <= 0) {
    return 0;
  }
  return roundToCents(taxableAmount * (ratePercent / 100));
}

export function calculateGrandTotal(subtotal: number, discountAmount: number, taxAmount: number): number {
  return roundToCents(subtotal - discountAmount + taxAmount);
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

/** Convenience aggregator over the individual pure functions above, for callers that just want the full breakdown. */
export function calculateInvoiceTotals(
  lineItems: LineItem[],
  discountType: DiscountType,
  discountValue: number,
  taxRatePercent: number
): InvoiceTotals {
  const subtotal = calculateSubtotal(lineItems);
  const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
  const taxableAmount = roundToCents(subtotal - discountAmount);
  const taxAmount = calculateTax(taxableAmount, taxRatePercent);
  const grandTotal = calculateGrandTotal(subtotal, discountAmount, taxAmount);
  return { subtotal, discountAmount, taxableAmount, taxAmount, grandTotal };
}
