import { calculateInvoiceTotals } from './utils/invoiceCalculations';
import { formatCurrency } from './utils/currencies';
import type { InvoiceData } from './utils/invoiceTypes';

/**
 * The on-screen, true-to-output invoice document. Deliberately NOT styled
 * with the toolbox's own font-mono/dev-tool aesthetic — this is a document
 * meant to be sent to someone else's client, so it renders as a plain white
 * page with a clean sans-serif, unaffected by the site's dark mode (the
 * printed/exported invoice is always white paper, so the preview shouldn't
 * pretend otherwise). Mirrors utils/InvoiceDocument.tsx's PDF layout
 * section-by-section — see that file for why they can't literally share
 * JSX.
 */
export function InvoicePreview({ data }: { data: InvoiceData }) {
  const totals = calculateInvoiceTotals(data.lineItems, data.discountType, data.discountValue, data.taxRatePercent);
  const money = (value: number) => formatCurrency(value, data.currency);

  return (
    <div className="w-full bg-white p-8 font-body text-sm text-neutral-900 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-200 pb-6">
        <div className="max-w-xs">
          {data.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoDataUrl} alt="Business logo" className="mb-3 max-h-16 max-w-[160px] object-contain" />
          )}
          <p className="text-base font-semibold text-neutral-900">{data.fromName || 'Your Business Name'}</p>
          {data.fromAddress
            .split('\n')
            .filter(Boolean)
            .map((line, index) => (
              <p key={index} className="text-neutral-600">
                {line}
              </p>
            ))}
          {data.fromEmail && <p className="text-neutral-600">{data.fromEmail}</p>}
          {data.fromPhone && <p className="text-neutral-600">{data.fromPhone}</p>}
        </div>

        <div className="text-right">
          <p className="mb-2 text-2xl font-bold tracking-tight text-accent">INVOICE</p>
          <div className="flex justify-end gap-2 text-neutral-600">
            <span>Invoice #</span>
            <span className="font-medium text-neutral-900">{data.invoiceNumber || '—'}</span>
          </div>
          <div className="flex justify-end gap-2 text-neutral-600">
            <span>Issued</span>
            <span className="font-medium text-neutral-900">{formatDisplayDate(data.issueDate)}</span>
          </div>
          <div className="flex justify-end gap-2 text-neutral-600">
            <span>Due</span>
            <span className="font-medium text-neutral-900">{formatDisplayDate(data.dueDate)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Bill To</p>
        <p className="font-semibold text-neutral-900">{data.billToName || 'Client Name'}</p>
        {data.billToAddress
          .split('\n')
          .filter(Boolean)
          .map((line, index) => (
            <p key={index} className="text-neutral-600">
              {line}
            </p>
          ))}
        {data.billToEmail && <p className="text-neutral-600">{data.billToEmail}</p>}
      </div>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-neutral-900 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="pb-2 font-semibold">Description</th>
            <th className="pb-2 text-right font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Unit Price</th>
            <th className="pb-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-neutral-200">
              <td className="py-2 pr-2">{item.description || '—'}</td>
              <td className="py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 text-right tabular-nums">{money(item.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{money(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[260px] text-sm">
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{money(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Discount{data.discountType === 'percent' ? ` (${data.discountValue}%)` : ''}</span>
              <span className="tabular-nums">-{money(totals.discountAmount)}</span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Tax ({data.taxRatePercent}%)</span>
              <span className="tabular-nums">{money(totals.taxAmount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-neutral-900 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums text-accent">{money(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {data.notes && (
        <div className="mt-8 whitespace-pre-line border-t border-neutral-200 pt-4 text-neutral-600">{data.notes}</div>
      )}
    </div>
  );
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
