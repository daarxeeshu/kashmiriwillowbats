import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import { orderStore } from "@/lib/orders/store";
import { buildOrderMessage } from "@/lib/orders/message";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge, formatWhen } from "@/components/admin/OrderStatusBadge";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
}

/* Marking an order confirmed is a Server Action rather than an API route: it is only
 * ever invoked from this page, which middleware has already authenticated, so it
 * inherits that gate instead of needing a second one. It sets exactly one status and
 * takes no status argument — the same rule as the public endpoint, for the same
 * reason. */
async function confirmOrder(orderId: string) {
  "use server";
  await orderStore.setStatus(orderId, "confirmed", new Date().toISOString());
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export default async function AdminOrderPage({ params }: Props) {
  const { orderId } = await params;
  const order = await orderStore.get(orderId);
  if (!order) notFound();

  const c = order.customer;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All orders
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{order.orderId}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* The timeline, and the honest gap in it. */}
      <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Created</dt>
        <dd>{formatWhen(order.createdAt)}</dd>

        <dt className="text-muted-foreground">Opened WhatsApp</dt>
        <dd>
          {order.whatsappOpenedAt ? (
            formatWhen(order.whatsappOpenedAt)
          ) : (
            <span className="text-amber-500">
              Never — the customer placed this order and did not tap through
            </span>
          )}
        </dd>

        <dt className="text-muted-foreground">Confirmed</dt>
        <dd>
          {order.confirmedAt ? (
            formatWhen(order.confirmedAt)
          ) : (
            <span className="text-muted">Not yet</span>
          )}
        </dd>
      </dl>

      {/* ── Customer ── */}
      <section className="mt-8 rounded-lg border border-border bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold">Customer</h2>
        <div className="mt-3 space-y-1 text-sm">
          <p className="font-medium">{c.fullName}</p>
          <p>
            <a href={`tel:${c.phone}`} className="text-accent hover:underline">
              {c.phone}
            </a>
          </p>
          {c.email.trim() && (
            <p>
              <a href={`mailto:${c.email}`} className="text-accent hover:underline">
                {c.email}
              </a>
            </p>
          )}
          <p className="pt-2 text-muted-foreground">
            {c.addressLine1}
            {c.addressLine2 && (
              <>
                <br />
                {c.addressLine2}
              </>
            )}
            <br />
            {c.city}, {c.state} {c.pin}
          </p>
          {c.notes.trim() && (
            <p className="pt-2 text-muted-foreground">Notes: {c.notes}</p>
          )}
        </div>
      </section>

      {/* ── Items ── */}
      <section className="mt-6 rounded-lg border border-border bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold">
          {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
        </h2>
        <ul className="mt-3 space-y-4 text-sm">
          {order.lines.map((line, i) => (
            <li key={`${line.slug}-${i}`}>
              <div className="flex justify-between gap-4">
                <span className="font-medium">
                  {line.brandName ? `${line.brandName} ` : ""}
                  {line.name} × {line.qty}
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </div>
              {line.options.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {line.options.map((o) => (
                    <li key={o.label}>
                      {o.label}: {o.value}
                    </li>
                  ))}
                </ul>
              )}
              {line.engraving && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Engraving: {line.engraving}
                </p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.coupon && (
            <div className="flex justify-between text-success">
              <span>
                {order.coupon.code} ({order.coupon.label})
              </span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <p className="pt-1 text-xs text-muted">Shipping still to be agreed.</p>
        </div>

        {order.engraving && (
          <p className="mt-4 border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Name engraving:</span>{" "}
            &ldquo;{order.engraving}&rdquo;
          </p>
        )}
      </section>

      {/* ── Actions ── */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {/* Chasing an order that never reached WhatsApp is the main thing this
            dashboard is for, so the shop can open the same message the customer
            would have sent, already filled in. */}
        <a
          href={buildWhatsAppUrl(buildOrderMessage(order))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-border bg-surface-card px-4 py-2.5 text-center text-sm font-medium transition-colors hover:border-accent/50"
        >
          Open this order in WhatsApp
        </a>
        {order.status !== "confirmed" && (
          <ConfirmButton
            orderId={order.orderId}
            action={confirmOrder}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
