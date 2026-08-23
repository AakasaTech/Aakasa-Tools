'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, FileDropzone } from '@aakasa/ui';
import { InvoicePreview } from './InvoicePreview';
import { calculateInvoiceTotals } from './utils/invoiceCalculations';
import { CURRENCIES, formatCurrency } from './utils/currencies';
import { generateInvoicePdf } from './utils/generateInvoicePdf';
import type { DiscountType, InvoiceData, LineItem } from './utils/invoiceTypes';

const DUE_DATE_PRESETS = [
  { label: 'Due on receipt', days: 0 },
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 60', days: 60 },
];

function todayIso(): string {
  // Read the LOCAL calendar date (what the user's wall clock says today
  // is) rather than `new Date().toISOString()`, which converts to UTC
  // first — in any positive-UTC-offset timezone that's wrong for part of
  // the day (e.g. it would report "yesterday" between local midnight and
  // the UTC offset's hour).
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, days: number): string {
  const parts = iso.split('-').map(Number);
  const [year, month, day] = parts;
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n)) || year === undefined || month === undefined || day === undefined) {
    return iso;
  }
  // Built and manipulated entirely via UTC methods so calendar-date
  // arithmetic never gets perturbed by the local timezone's offset — this
  // function only ever deals in calendar dates, never a time of day.
  // (Mixing a local-midnight `new Date(iso + 'T00:00:00')` with
  // `.toISOString()` silently rolls the result back a day in any
  // positive-UTC-offset timezone, e.g. Aug 22 + 30 days coming out as
  // Sep 20 instead of Sep 21 — caught by testing this in IST, UTC+5:30.)
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createEmptyLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 };
}

function createDefaultInvoiceData(): InvoiceData {
  const issueDate = todayIso();
  return {
    fromName: '',
    fromAddress: '',
    fromEmail: '',
    fromPhone: '',
    logoDataUrl: null,
    billToName: '',
    billToAddress: '',
    billToEmail: '',
    invoiceNumber: 'INV-001',
    issueDate,
    dueDate: addDays(issueDate, 30),
    currency: 'USD',
    lineItems: [createEmptyLineItem()],
    taxRatePercent: 0,
    discountType: 'percent',
    discountValue: 0,
    notes: '',
  };
}

export function InvoiceGenerator() {
  const [data, setData] = useState<InvoiceData>(createDefaultInvoiceData);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const totals = useMemo(
    () => calculateInvoiceTotals(data.lineItems, data.discountType, data.discountValue, data.taxRatePercent),
    [data.lineItems, data.discountType, data.discountValue, data.taxRatePercent]
  );

  function updateField<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function updateLineItem(id: string, patch: Partial<Omit<LineItem, 'id'>>) {
    setData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function addLineItem() {
    setData((prev) => ({ ...prev, lineItems: [...prev.lineItems, createEmptyLineItem()] }));
  }

  function removeLineItem(id: string) {
    setData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.length > 1 ? prev.lineItems.filter((item) => item.id !== id) : prev.lineItems,
    }));
  }

  function handleLogoSelected(file: File) {
    const reader = new FileReader();
    reader.onload = () => updateField('logoDataUrl', reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleIssueDateChange(value: string) {
    // Shifting the issue date shifts the due date with it, so a due-date
    // preset picked earlier (e.g. "Net 30") stays 30 days out rather than
    // silently going stale relative to the new issue date.
    const previousGapDays = Math.round(
      (new Date(`${data.dueDate}T00:00:00`).getTime() - new Date(`${data.issueDate}T00:00:00`).getTime()) / 86_400_000
    );
    setData((prev) => ({
      ...prev,
      issueDate: value,
      dueDate: Number.isFinite(previousGapDays) ? addDays(value, previousGapDays) : prev.dueDate,
    }));
  }

  async function handleDownloadPdf() {
    setPdfError(null);
    setIsGeneratingPdf(true);
    try {
      const blob = await generateInvoicePdf(data);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.invoiceNumber || 'invoice'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Could not generate the PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleReset() {
    if (window.confirm('Clear this invoice? Nothing here is saved, so this cannot be undone.')) {
      setData(createDefaultInvoiceData());
      setPdfError(null);
    }
  }

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6 print:hidden">
          <FormSection title="From (your business)">
            <Field label="Business name">
              <TextInput value={data.fromName} onChange={(v) => updateField('fromName', v)} placeholder="Acme Studio" />
            </Field>
            <Field label="Address">
              <TextArea value={data.fromAddress} onChange={(v) => updateField('fromAddress', v)} rows={2} placeholder={'123 Market St\nSan Francisco, CA 94103'} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <TextInput type="email" value={data.fromEmail} onChange={(v) => updateField('fromEmail', v)} placeholder="hello@acme.co" />
              </Field>
              <Field label="Phone">
                <TextInput type="tel" value={data.fromPhone} onChange={(v) => updateField('fromPhone', v)} placeholder="+1 555 010 1234" />
              </Field>
            </div>
            <Field label="Logo (optional)">
              {data.logoDataUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.logoDataUrl} alt="Uploaded logo" className="h-12 max-w-[120px] rounded border border-ink/10 object-contain dark:border-paper/10" />
                  <Button variant="ghost" size="sm" onClick={() => updateField('logoDataUrl', null)}>
                    Remove logo
                  </Button>
                </div>
              ) : (
                <FileDropzone onFileSelected={handleLogoSelected} accept="image/*" hint="PNG or JPG — embedded directly into the PDF, never uploaded anywhere." />
              )}
            </Field>
          </FormSection>

          <FormSection title="Bill to (client)">
            <Field label="Client name">
              <TextInput value={data.billToName} onChange={(v) => updateField('billToName', v)} placeholder="Client Company Inc." />
            </Field>
            <Field label="Address">
              <TextArea value={data.billToAddress} onChange={(v) => updateField('billToAddress', v)} rows={2} placeholder={'456 Client Ave\nAustin, TX 78701'} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={data.billToEmail} onChange={(v) => updateField('billToEmail', v)} placeholder="billing@client.co" />
            </Field>
          </FormSection>

          <FormSection title="Invoice details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice number">
                <TextInput value={data.invoiceNumber} onChange={(v) => updateField('invoiceNumber', v)} placeholder="INV-001" />
              </Field>
              <Field label="Currency">
                <select
                  value={data.currency}
                  onChange={(event) => updateField('currency', event.target.value)}
                  className={selectClasses}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                      {currency.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Issue date">
                <input type="date" value={data.issueDate} onChange={(event) => handleIssueDateChange(event.target.value)} className={inputClasses} />
              </Field>
              <Field label="Due date">
                <input type="date" value={data.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} className={inputClasses} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DUE_DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateField('dueDate', addDays(data.issueDate, preset.days))}
                  className="rounded-full border border-ink/10 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-accent hover:text-accent dark:border-paper/10 dark:text-paper/60"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Line items">
            <div className="flex flex-col gap-2">
              {data.lineItems.map((item) => (
                <div key={item.id} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(event) => updateLineItem(item.id, { description: event.target.value })}
                    placeholder="Description"
                    className={`${inputClasses} min-w-[140px] flex-1`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updateLineItem(item.id, { quantity: Math.max(0, Number(event.target.value) || 0) })}
                    aria-label="Quantity"
                    className={`${inputClasses} w-16`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => updateLineItem(item.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })}
                    aria-label="Unit price"
                    className={`${inputClasses} w-24`}
                  />
                  <span className="flex h-9 w-24 shrink-0 items-center justify-end font-mono text-sm text-ink/70 dark:text-paper/70">
                    {formatCurrency(item.quantity * item.unitPrice, data.currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                    disabled={data.lineItems.length <= 1}
                    aria-label="Remove line item"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={addLineItem} className="self-start">
              + Add line item
            </Button>
          </FormSection>

          <FormSection title="Tax & discount">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tax (VAT/GST/Sales Tax) %">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.taxRatePercent}
                  onChange={(event) => updateField('taxRatePercent', Math.max(0, Number(event.target.value) || 0))}
                  className={inputClasses}
                />
              </Field>
              <Field label="Discount">
                <div className="flex gap-1.5">
                  <select
                    value={data.discountType}
                    onChange={(event) => updateField('discountType', event.target.value as DiscountType)}
                    className={`${selectClasses} w-20`}
                  >
                    <option value="percent" className="bg-paper text-ink dark:bg-ink dark:text-paper">%</option>
                    <option value="flat" className="bg-paper text-ink dark:bg-ink dark:text-paper">Flat</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.discountValue}
                    onChange={(event) => updateField('discountValue', Math.max(0, Number(event.target.value) || 0))}
                    className={`${inputClasses} flex-1`}
                  />
                </div>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Notes / payment terms">
            <TextArea
              value={data.notes}
              onChange={(v) => updateField('notes', v)}
              rows={3}
              placeholder="Bank details, payment instructions, or a thank-you note…"
            />
          </FormSection>

          <div className="rounded-md border border-ink/10 bg-ink/5 p-4 text-sm dark:border-paper/10 dark:bg-paper/5">
            <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal, data.currency)} />
            {totals.discountAmount > 0 && (
              <SummaryRow label="Discount" value={`-${formatCurrency(totals.discountAmount, data.currency)}`} />
            )}
            {totals.taxAmount > 0 && <SummaryRow label="Tax" value={formatCurrency(totals.taxAmount, data.currency)} />}
            <div className="mt-1 flex justify-between border-t border-ink/10 pt-1.5 font-semibold text-ink dark:border-paper/10 dark:text-paper">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(totals.grandTotal, data.currency)}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleReset} className="self-start text-danger">
            Clear invoice
          </Button>

          <p className="text-xs text-ink/40 dark:text-paper/40">
            Invoicing clients regularly?{' '}
            <a href="#" className="text-accent hover:underline">
              BillCraft AI
            </a>{' '}
            adds recurring invoices, saved clients, and payment tracking.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button onClick={() => void handleDownloadPdf()} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              Print
            </Button>
          </div>

          {pdfError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger print:hidden">
              {pdfError}
            </p>
          )}

          <div id="invoice-print-area" className="overflow-auto rounded-md border border-ink/10 dark:border-paper/10">
            <InvoicePreview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClasses =
  'h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper';
const selectClasses = inputClasses;

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-ink/70 dark:text-paper/70">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={inputClasses}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="resize-y rounded-md border border-ink/10 bg-transparent px-2 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-ink/70 dark:text-paper/70">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
