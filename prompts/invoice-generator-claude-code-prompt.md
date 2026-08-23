# Claude Code Prompt — Build Tool #10: Invoice Generator

Run this after tool-shell and tools #1-9 all exist and work. This is your
first tool with a direct product funnel — it should feel genuinely useful
standalone, but its natural "next step" (recurring invoices, saved clients,
payment tracking) is exactly what BillCraft AI already does. Build it as a
real, complete free tool first; the funnel is a soft mention, not a bait-
and-switch.

---

```
Build the Invoice Generator tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/invoice-generator/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, FileDropzone, and other primitives
  from tools #1-9 — check what exists before writing anything new.
- 100% client-side, including PDF generation. Use a client-side PDF library
  — check if the environment already has one available (this project has
  previously used @react-pdf/renderer for a related product; prefer that
  for consistency if it renders cleanly client-side in this stack, otherwise
  jsPDF + jspdf-autotable is a solid lighter-weight alternative). No server
  round-trip for PDF generation under any circumstances — invoices routinely
  contain real client names, addresses, and amounts, so this tool's "nothing
  leaves your browser" promise matters more here than almost anywhere else
  in the toolbox.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. The invoice PREVIEW itself should
  look like a real, clean invoice document — NOT styled with the toolbox's
  own font-mono/dev-tool aesthetic. Use font-body (Inter) or a clean serif
  for the actual invoice document preview, since this output is meant to be
  sent to the user's clients and should look professional and generic, not
  branded as an Aakasa Toolbox artifact.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'invoice-generator', title: 'Invoice Generator',
    shortDescription: 'Create and download professional invoices as PDF, free.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Free Invoice Generator - Create & Download PDF Invoices |
  Aakasa Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Invoice Generator"
    description="Create a professional invoice and download it as a PDF — free, no signup, entirely in your browser."
    category="calculators"
    tier="free"
    relatedTools={['unit-converter', 'percentage-calculator', 'qr-code-generator']}
    faq={[...]}
  >
    <InvoiceGenerator />
  </ToolShell>
  Note: check TOOL_REGISTRY first — drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what this tool includes (line items, tax, totals, PDF export),
  whether invoice data is saved anywhere (explicitly no — closing the tab
  loses the data, state this plainly as both a privacy feature AND a
  limitation, so users aren't surprised), whether it's legally sufficient
  for tax/accounting purposes (be honest and modest here — say it produces
  a standard invoice document but isn't a substitute for proper accounting
  software if they're invoicing regularly or need recurring invoices,
  saved client records, or payment tracking), and basic guidance on what
  makes an invoice valid (invoice number, dates, itemized charges, totals).

STEP 3 — InvoiceGenerator.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI. Split into a
FORM (left/top, the toolbox's normal UI styling) and a LIVE PREVIEW
(right/bottom, styled as an actual invoice document, updating in real time
as the form is filled in):

  FORM FIELDS:
  - From (your business): name, address, email, phone — optional logo
    upload (FileDropzone, image only, rendered into the PDF)
  - Bill To (client): name, address, email
  - Invoice metadata: invoice number (auto-suggest a simple incrementing
    placeholder like "INV-001", fully editable), issue date (default today),
    due date (default +30 days, but editable, with a couple of quick presets:
    Due on receipt / Net 15 / Net 30 / Net 60)
  - Line items (repeatable rows): description, quantity, unit price, and an
    auto-calculated line total. Add/remove row buttons. Drag-to-reorder is a
    nice-to-have, not required.
  - Currency selector (a short common list — USD, EUR, GBP, LKR, INR, AUD,
    CAD is a reasonable starting set given this is for Aakasa Digital;
    affects only the symbol/formatting shown, no live exchange rate
    conversion needed, this isn't a currency converter)
  - Tax: a single configurable tax rate (%) applied to the subtotal, clearly
    labeled (e.g. "Tax (VAT/GST/Sales Tax) %") since tax terminology varies
    by region — don't assume US sales tax conventions
  - Discount: optional flat amount or percentage off the subtotal
  - Notes/payment terms: free-text area for things like bank details or
    "Thank you for your business"
  - Auto-calculated: subtotal, tax amount, discount amount, grand total —
    shown in both the form (as a running summary) and the preview

  LIVE PREVIEW:
  - Renders as an actual clean invoice layout: header with from/to info,
    invoice number/dates, itemized table, totals block, notes footer.
  - This is what gets exported to PDF — the preview should be a true WYSIWYG
    representation, not an approximation.

  ACTIONS:
  - "Download PDF" button — generates and downloads the invoice as a PDF
    client-side.
  - "Print" button — triggers browser print dialog on the preview (useful
    fallback, and print-to-PDF is itself a valid path for some users).
  - Clear/reset button (with a confirmation, since this tool holds no
    autosave — losing a filled-in invoice by accident would be genuinely
    frustrating, this is the one tool in the toolbox so far where a
    confirm-before-clear dialog is actually warranted).

  SOFT FUNNEL (subtle, not pushy):
  - A small, quiet note near the bottom of the form (not a popup, not a
    banner interrupting the flow) along the lines of: "Invoicing clients
    regularly? BillCraft AI adds recurring invoices, saved clients, and
    payment tracking." with a text link to billcraft's marketing page.
    This should read like a genuinely relevant suggestion, not an ad — one
    line, easy to ignore, never blocking the free tool's functionality.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/invoice-generator/utils/:
  - invoiceCalculations.ts — pure functions: calculateLineTotal(quantity,
    unitPrice), calculateSubtotal(lineItems), calculateTax(subtotal, rate),
    calculateDiscount(subtotal, discount), calculateGrandTotal(...). Simple
    but keep them pure and typed (no `any`) so rounding behavior is
    consistent and testable (watch for floating-point rounding errors on
    money math — round consistently to 2 decimal places at the right point
    in the calculation chain, not ad-hoc per display).
  - generateInvoicePdf.ts — generateInvoicePdf(invoiceData: InvoiceData):
    Promise<Blob>, wrapping whichever PDF library is used, kept separate
    from the UI component so the PDF generation logic could later be reused
    (e.g. if BillCraft AI itself wants a similar client-side quick-export
    path, though that's out of scope for this build).

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry, and confirm the downloaded PDF actually matches the live
preview (test with at least one multi-line-item invoice including tax and a
discount, not just a single-line-item happy path).

After building, tell me:
1. Which PDF library was used and why, and confirm the PDF is generated
   fully client-side with no network request.
2. Confirm money math (subtotal/tax/discount/total) is rounded consistently
   and doesn't produce floating-point artifacts like $10.999999999998 in the
   output — state the approach taken (e.g. rounding to cents at each step
   vs. only at final display).
3. Flag whether generateInvoicePdf.ts's approach is something that could
   realistically be referenced later if BillCraft AI wants a similar
   client-side export path, or whether it's too tightly coupled to this
   tool's specific data shape to be useful as a reference.
```

---

## Notes

- **Money math correctness matters more here than in any prior tool** —
  floating-point arithmetic on currency (e.g. `0.1 + 0.2 !== 0.3` in JS) is a
  classic bug class, and an invoice showing `$1,240.9999999997` looks
  broken/untrustworthy in a way that undermines the whole tool. The prompt
  explicitly asks for the rounding approach to be stated back so this gets
  checked rather than assumed fine.
- **The "no autosave" tradeoff needs to be communicated honestly**, both in
  the FAQ and via a confirm-before-clear dialog — this is a case where the
  same privacy property that's a selling point everywhere else in the
  toolbox (nothing stored) becomes a real usability risk (lose your work by
  closing the tab). Don't let the messaging paper over that; state it
  plainly so users aren't caught off guard.
- **The BillCraft funnel must stay soft** — this needs to work as a genuinely
  complete, honest free tool on its own merits first. A heavy-handed upsell
  here would undermine trust across the whole toolbox, not just this one
  tool. One quiet text link, nothing more, and only reviewed for tone/
  placement, not expanded, once built.
- Consider later (out of scope for this build) whether to add a "save as
  template" using browser-only state (not persisted storage, since
  localStorage is off-limits per your artifact constraints elsewhere in this
  stack — though note apps/web is a real Next.js app, not a claude.ai
  artifact, so actual localStorage/IndexedDB is technically fine here if you
  want optional draft-persistence in a future iteration; just make sure any
  such addition is opt-in and clearly disclosed, not silent).
