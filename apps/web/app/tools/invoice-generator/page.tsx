import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { InvoiceGenerator } from './InvoiceGenerator';

const TITLE = 'Free Invoice Generator - Create & Download PDF Invoices | Aakasa Toolbox';
const DESCRIPTION =
  'Create a professional invoice and download it as a PDF — free, no signup, entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/invoice-generator';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL_URL,
    siteName: 'Aakasa Toolbox',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function InvoiceGeneratorPage() {
  return (
    <ToolShell
      title="Invoice Generator"
      description="Create a professional invoice and download it as a PDF — free, no signup, entirely in your browser."
      category="calculators"
      tier="free"
      relatedTools={['unit-converter', 'percentage-calculator', 'qr-code-generator']}
      faq={[
        {
          question: 'What does this tool include?',
          answer:
            'Your business and client details, an editable invoice number and dates, a repeatable line-item table (description, quantity, unit price), a configurable tax rate, an optional flat or percentage discount, notes/payment terms, and a live preview that matches the downloaded PDF exactly. You can also print directly from the browser, or download the PDF.',
        },
        {
          question: 'Is my invoice data saved anywhere?',
          answer:
            "No — and this cuts both ways. Nothing you type is uploaded, logged, or stored, which is exactly the point for a document with real client names and amounts on it. But it also means there's no autosave: closing or reloading the tab loses everything you've entered, so it's worth downloading the PDF before you navigate away from a filled-in invoice.",
        },
        {
          question: 'Is this legally sufficient for tax or accounting purposes?',
          answer:
            "It produces a standard, itemized invoice document, but it isn't a substitute for proper accounting software. If you're invoicing regularly, you'll likely want something that keeps recurring invoices, saved client records, payment tracking, and a permanent history — this tool intentionally doesn't do any of that. For a one-off or occasional invoice, though, it covers what a normal invoice needs.",
        },
        {
          question: 'What makes an invoice valid?',
          answer:
            'Conventions vary by jurisdiction, but most invoices need: a unique invoice number, an issue date and due date, your business\'s name and contact details, the client\'s name and details, an itemized list of charges, and a clear total (with tax and any discount broken out separately). This tool covers all of that as standard fields.',
        },
      ]}
    >
      <InvoiceGenerator />
    </ToolShell>
  );
}
