import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aakasa Toolbox',
  description: '100 free browser-based tools. Nothing you enter ever leaves your browser.',
};

// Sibling products under the Aakasa Digital umbrella — cross-linked from
// every page's footer so Aakasa Toolbox visitors can discover them. Domains
// confirmed from each product's own `metadataBase`/canonical URL, not guessed.
// MeetingCraft has no `href` yet — its own .env still points at localhost
// with no production domain configured, so it isn't live. Its intended
// domain (meetingcraft.aakasa.dev) is confirmed; add the href once it ships.
const AAKASA_PRODUCTS: { label: string; description: string; href: string | null }[] = [
  { label: 'BillCraft AI', description: 'AI-powered invoicing & billing', href: 'https://billcraft.aakasa.dev' },
  { label: 'SupportCraft AI', description: 'AI help desk & support tickets', href: 'https://supportcraft.aakasa.dev' },
  { label: 'TaskCraft AI', description: 'Task, project & time tracking', href: 'https://taskcraft.aakasa.dev' },
  { label: 'PDFCraft', description: 'Merge PDFs online', href: 'https://pdfcraft.aakasa.dev' },
  { label: 'MeetingCraft', description: 'Coming soon', href: null },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-paper font-body text-ink dark:bg-ink dark:text-paper">
        <header className="border-b border-ink/10 dark:border-paper/10">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-display text-lg font-semibold">
              Aakasa Toolbox
            </Link>
            <Link href="/tools" className="text-sm hover:text-accent">
              Tools
            </Link>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-ink/10 dark:border-paper/10">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="font-display text-sm font-semibold text-ink dark:text-paper">Aakasa Toolbox</div>
                <p className="mt-1 max-w-sm text-sm text-ink/60 dark:text-paper/60">
                  Everything runs in your browser. Nothing you enter is uploaded or stored.
                </p>
                <a
                  href="https://www.aakasa.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-ink/60 hover:text-accent dark:text-paper/60"
                >
                  aakasa.dev &rarr;
                </a>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-ink/40 dark:text-paper/40">
                  More from Aakasa Digital
                </div>
                <ul className="mt-2 flex flex-col gap-2">
                  {AAKASA_PRODUCTS.map((product) =>
                    product.href ? (
                      <li key={product.label}>
                        <a
                          href={product.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-baseline gap-1.5 text-sm text-ink/70 hover:text-accent dark:text-paper/70"
                        >
                          <span className="font-medium">{product.label}</span>
                          <span className="text-ink/40 group-hover:text-accent/70 dark:text-paper/40">
                            {product.description}
                          </span>
                        </a>
                      </li>
                    ) : (
                      <li key={product.label} className="flex items-baseline gap-1.5 text-sm text-ink/40 dark:text-paper/40">
                        <span className="font-medium">{product.label}</span>
                        <span className="text-ink/30 dark:text-paper/30">{product.description}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-ink/10 pt-4 text-sm text-ink/50 dark:border-paper/10 dark:text-paper/50">
              &copy; {new Date().getFullYear()} Aakasa Toolbox, by Aakasa Digital.
            </div>
          </div>
        </footer>

        {/* Buy Me a Coffee — the static button embed, not the floating
            widget script: the widget always renders as a fixed-position
            corner button regardless of where its script tag sits in the
            DOM, which isn't placeable inline. This is a plain image link,
            so it sits in normal document flow right where it's put. */}
        <div className="border-t border-ink/10 py-6 text-center dark:border-paper/10">
          <a href="https://www.buymeacoffee.com/aakasatools" target="_blank" rel="noopener noreferrer" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size external badge image, not a page asset Next's image optimizer needs to process */}
            <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" width={174} height={49} />
          </a>
        </div>
      </body>
    </html>
  );
}
