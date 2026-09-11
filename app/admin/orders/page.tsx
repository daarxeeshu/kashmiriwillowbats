import type { Metadata } from "next";
import Link from "next/link";
import { orderStore } from "@/lib/orders/store";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge, formatWhen } from "@/components/admin/OrderStatusBadge";

export const metadata: Metadata = {
  title: "Orders",
  // Belt and braces alongside the middleware and app/admin/layout.tsx: nothing here
  // should ever reach an index.
  robots: { index: false, follow: false },
};

/* Never prerendered and never cached: an order placed a second ago has to be on this
 * list, and a cached copy of a page listing customer addresses is a copy sitting
 * somewhere it was not meant to be. */
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await orderStore.list();
  const waiting = orders.filter((o) => o.status === "new");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} total
          {waiting.length > 0 && (
            <>
              {" · "}
              <span className="font-medium text-amber-500">
                {waiting.length} never reached WhatsApp
              </span>
            </>
          )}
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-lg border border-border bg-surface-elevated p-6 text-sm text-muted-foreground">
          No orders yet. One appears here the moment a customer completes checkout or
          the Order on WhatsApp form — before they send anything, which is the point.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {orders.map((order) => (
            <li key={order.orderId}>
              <Link
                href={`/admin/orders/${order.orderId}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-surface-elevated px-4 py-3.5 transition-colors hover:bg-surface-card"
              >
                <span className="font-mono text-sm font-medium">{order.orderId}</span>
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-muted-foreground">
                  {order.customer.fullName}
                </span>
                <span className="ml-auto text-sm font-medium">
                  {formatPrice(order.total)}
                </span>
                <span className="w-full text-xs text-muted sm:w-auto">
                  {formatWhen(order.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs leading-relaxed text-muted">
        Orders are written to <code>.data/orders.json</code> on this machine. That file
        is git-ignored and is not a database — it does not survive deployment, and it
        is what the Supabase table replaces.
      </p>
    </div>
  );
}
