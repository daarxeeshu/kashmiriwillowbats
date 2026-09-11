import type { Metadata } from "next";
import Link from "next/link";

/* Every admin page carries customer names, phone numbers and addresses, so noindex is
 * set on the whole segment rather than remembered page by page. The real gate is
 * middleware.ts — a crawler never gets past the 401 — but a page that leaks into an
 * index because one route forgot a flag is not a mistake worth leaving available. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface-dark">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-5">
            <Link href="/admin/orders" className="text-sm font-semibold text-white">
              KW Admin
            </Link>
            {/* Flat list rather than a nav component: two destinations do not need
                one, and a bar that grows a third can grow the component then. */}
            <Link
              href="/admin/orders"
              className="text-xs text-white/50 transition-colors hover:text-white/80"
            >
              Orders
            </Link>
            <Link
              href="/admin/promo-tape"
              className="text-xs text-white/50 transition-colors hover:text-white/80"
            >
              Promo tape
            </Link>
          </div>
          <Link
            href="/"
            className="text-xs text-white/50 transition-colors hover:text-white/80"
          >
            Back to site
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
