/**
 * The actual PDF layout, built from @react-pdf/renderer's own primitives
 * (Document/Page/View/Text/Image — NOT regular HTML/DOM). This deliberately
 * mirrors InvoicePreview.tsx's on-screen layout section-by-section (same
 * header/bill-to/table/totals/notes structure, same field order) so the
 * downloaded PDF matches what the user saw, even though the two can't
 * literally share JSX — react-pdf renders to PDF drawing instructions, not
 * HTML. Kept in its own .tsx file (rather than inline in generateInvoicePdf.ts)
 * so that file can stay plain TypeScript and dynamically import both the
 * library and this document only when a PDF is actually requested.
 */

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { calculateInvoiceTotals } from './invoiceCalculations';
import { formatCurrency } from './currencies';
import type { InvoiceData } from './invoiceTypes';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logo: {
    width: 90,
    maxHeight: 60,
    objectFit: 'contain',
  },
  fromBlock: {
    maxWidth: 260,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: '#5B6EF5',
  },
  metaLine: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaLabel: {
    color: '#666666',
    marginRight: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 8,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  billToName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 2,
  },
  muted: {
    color: '#444444',
    marginBottom: 1,
  },
  table: {
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    paddingVertical: 6,
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnitPrice: { flex: 1.3, textAlign: 'right' },
  colTotal: { flex: 1.3, textAlign: 'right' },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  totalsBlock: {
    marginTop: 16,
    alignSelf: 'flex-end',
    width: 220,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    marginTop: 4,
    paddingTop: 6,
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  grandTotalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#5B6EF5',
  },
  notes: {
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#dddddd',
    color: '#444444',
    lineHeight: 1.4,
  },
});

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface InvoiceDocumentProps {
  data: InvoiceData;
}

export function InvoiceDocument({ data }: InvoiceDocumentProps) {
  const totals = calculateInvoiceTotals(data.lineItems, data.discountType, data.discountValue, data.taxRatePercent);
  const money = (value: number) => formatCurrency(value, data.currency);

  return (
    <Document title={`Invoice ${data.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.fromBlock}>
            {data.logoDataUrl && (
              // react-pdf's Image draws directly into the PDF canvas — it has no
              // `alt`/accessible-text concept for eslint-plugin-jsx-a11y to satisfy.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logoDataUrl} style={styles.logo} />
            )}
            <Text style={styles.businessName}>{data.fromName || 'Your Business Name'}</Text>
            {data.fromAddress
              .split('\n')
              .filter(Boolean)
              .map((line, index) => (
                <Text key={index} style={styles.muted}>
                  {line}
                </Text>
              ))}
            {data.fromEmail && <Text style={styles.muted}>{data.fromEmail}</Text>}
            {data.fromPhone && <Text style={styles.muted}>{data.fromPhone}</Text>}
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Invoice #</Text>
              <Text>{data.invoiceNumber || '—'}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Issued</Text>
              <Text>{formatDisplayDate(data.issueDate)}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Due</Text>
              <Text>{formatDisplayDate(data.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.billToName}>{data.billToName || 'Client Name'}</Text>
          {data.billToAddress
            .split('\n')
            .filter(Boolean)
            .map((line, index) => (
              <Text key={index} style={styles.muted}>
                {line}
              </Text>
            ))}
          {data.billToEmail && <Text style={styles.muted}>{data.billToEmail}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colUnitPrice, styles.tableHeaderText]}>Unit Price</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>Total</Text>
          </View>
          {data.lineItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description || '—'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{money(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{money(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{money(totals.subtotal)}</Text>
          </View>
          {totals.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text>
                Discount{data.discountType === 'percent' ? ` (${data.discountValue}%)` : ''}
              </Text>
              <Text>-{money(totals.discountAmount)}</Text>
            </View>
          )}
          {totals.taxAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text>Tax ({data.taxRatePercent}%)</Text>
              <Text>{money(totals.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{money(totals.grandTotal)}</Text>
          </View>
        </View>

        {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
      </Page>
    </Document>
  );
}
