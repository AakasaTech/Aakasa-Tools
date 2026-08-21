import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aakasa Toolbox',
  description: '100 free browser-based tools. Nothing you enter ever leaves your browser.',
};

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
          <div className="mx-auto max-w-5xl px-6 py-6 text-sm opacity-70">
            &copy; {new Date().getFullYear()} Aakasa Toolbox. Everything runs in your browser.
          </div>
        </footer>
      </body>
    </html>
  );
}
