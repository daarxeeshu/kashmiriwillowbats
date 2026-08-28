import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types/cart";

/* ── The order, as a message a person reads ──────────────────────────────────────
 *
 * This is the actual delivery path, not a formality: nothing in this project charges a
 * card, so the WhatsApp thread *is* the order system until a backend exists. The
 * message therefore has to carry everything someone needs to fulfil it without asking
 * a follow-up question — the reference, the lines, the total, and where it goes.
 *
 * Plain text with no markdown: WhatsApp renders `*bold*` but mangles anything more,
 * and this has to stay readable if it is pasted into a notebook or read down a phone. */
export function buildOrderMessage(order: Order): string {
  const lines = order.lines
    .map((l) => {
      const label = l.brandName ? `${l.brandName} ${l.name}` : l.name;
      const rows = [`• ${label} x${l.qty} — ${formatPrice(l.lineTotal)}`];
      // Indented under their line, so a multi-item order stays readable.
      for (const o of l.options) rows.push(`    ${o.label}: ${o.value}`);
      if (l.engraving) rows.push(`    Engraving: ${l.engraving}`);
      return rows.join("\n");
    })
    .join("\n");

  const address = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} ${order.customer.pin}`,
  ]
    .filter((part) => part && part.trim())
    .join("\n");

  const parts = [
    `Hi, I'd like to place this order.`,
    ``,
    `Order: ${order.orderId}`,
    ``,
    lines,
    ``,
    `Items: ${order.itemCount}`,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    ...(order.coupon
      ? [
          `Code ${order.coupon.code} (${order.coupon.label}): -${formatPrice(order.discount)}`,
          `Total: ${formatPrice(order.total)}`,
        ]
      : []),
    /* Quoted, and on its own line. The quotes are not decoration: they mark exactly
       where the text starts and ends, so a name with a trailing space or an initial
       is transcribed onto the bat as written rather than guessed at. */
    ...(order.engraving ? [``, `Name engraving: "${order.engraving}"`] : []),
    ``,
    `Name: ${order.customer.fullName}`,
    `Phone: ${order.customer.phone}`,
  ];

  if (order.customer.email.trim()) parts.push(`Email: ${order.customer.email}`);


  parts.push(``, `Deliver to:`, address);

  if (order.customer.notes.trim()) {
    parts.push(``, `Notes: ${order.customer.notes}`);
  }

  parts.push(
    ``,
    `Please confirm availability, engraving options and the final total including shipping.`,
  );

  return parts.join("\n");
}
