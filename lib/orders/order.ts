import type {
  CartEntry,
  CheckoutDetails,
  Order,
  OrderLine,
} from "@/types/cart";
import type { AppliedCoupon } from "./coupon";
import { describeBatOptions } from "@/data/bat-options";

/** Same unambiguous alphabet as the repair reference: no 0/O, no 1/I/L, because this
 *  gets read down a phone line. `KWB-2026-7K4Q`. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function createOrderId(now: Date = new Date()): string {
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]).join("");
  return `KWB-${now.getFullYear()}-${code}`;
}

/* Prices are recomputed here from the server's own product data — never taken from the
 * request. The client sends slugs and quantities and nothing else that touches money,
 * so a tampered payload can change *what* is ordered but not what it costs. That is
 * the same rule `buildRepairRequest` follows for status and quote. */
export function buildOrder(
  entries: CartEntry[],
  customer: CheckoutDetails,
  coupon: AppliedCoupon | null,
  engraving: string | null,
  orderId: string,
  now: Date = new Date(),
): Order {
  const lines: OrderLine[] = entries.map((e) => ({
    slug: e.product.slug,
    name: e.product.name,
    brandName: e.product.brandName ?? null,
    unitPrice: e.product.price,
    qty: e.qty,
    lineTotal: e.product.price * e.qty,
    // Labels, not ids. The order is read by a person in a workshop, and "srt" is not
    // a spec anybody can build from.
    options: describeBatOptions(e.options),
    engraving: e.engraving ?? null,
  }));

  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  // Recomputed from the server's own subtotal, not carried over from the client.
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;

  return {
    orderId,
    createdAt: now.toISOString(),
    status: "received",
    lines,
    itemCount,
    subtotal,
    coupon,
    engraving,
    discount,
    total: Math.max(0, subtotal - discount),
    customer,
  };
}

/* ── The storage seam ──
 * One function, and it is the only thing a real backend has to replace. Today it
 * writes a structured line to the server log and nothing more — said plainly rather
 * than dressed up, because the honest description of this flow is that the *order* is
 * delivered by the WhatsApp handoff on the confirmation screen, and this record exists
 * so there is something to reconcile against when a backend arrives.
 *
 * No name, phone, email or address in the log line. Order contents are operational;
 * the customer's contact details are not, and a server log is the wrong place to keep
 * them. */
export async function persistOrder(order: Order): Promise<void> {
  console.info("[orders] order received", {
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt,
    itemCount: order.itemCount,
    subtotal: order.subtotal,
    coupon: order.coupon?.code ?? null,
    hasEngraving: order.engraving !== null,
    discount: order.discount,
    total: order.total,
    slugs: order.lines.map((l) => `${l.slug}x${l.qty}`),
  });
}
