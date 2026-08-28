/* ── Fulfilment: the shape the order record will grow into ───────────────────────
 *
 * Types only. Nothing in the app writes these yet, and nothing pretends to: there is
 * no admin, no database and no file storage in this project, so a courier slip cannot
 * be uploaded and an order cannot be tracked. What exists here is the contract the
 * future backend fills, defined now so the tracking page and the order record are
 * built against one shape rather than two.
 *
 * ── On storing the slip ──
 * `courierSlipPath` is a reference into object storage (Supabase Storage or
 * equivalent), never the image itself. A scanned slip is hundreds of kilobytes of
 * binary; base64 in a row inflates it by a third, is fetched on every query that
 * touches the order, and cannot be served with a cache header or an expiring URL.
 * The database holds the path; storage holds the bytes.
 *
 * ── On who may read it ──
 * A slip carries the customer's name, address and phone. Writing one is an admin
 * action; reading one belongs to that order alone. Whichever backend arrives has to
 * enforce that server-side — a signed, expiring URL issued per request rather than a
 * public bucket path, and never an object key that can be guessed from an order id.
 */

export type ShippingStatus =
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/** Ordered, for rendering progress. `cancelled` is deliberately outside it — it is an
 *  exit from the sequence, not a step along it. */
export const SHIPPING_STEPS: Exclude<ShippingStatus, "cancelled">[] = [
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  confirmed: "Order confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** What an admin records when marking an order shipped. */
export interface ShipmentDetails {
  courierName: string;
  trackingNumber: string;
  /** The courier's own tracking page, when they have one. */
  trackingUrl?: string;
  /** Object-storage path, not a URL and not the image. Resolved to a short-lived
   *  signed URL at read time by whoever is allowed to see it. */
  courierSlipPath?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderShipping extends ShipmentDetails {
  status: ShippingStatus;
}

/** What the tracking page needs. A lookup is order id plus one detail only the
 *  customer would have — enough to stop an order id alone exposing an address. */
export interface TrackingLookup {
  orderId: string;
  /** Phone or email, matched against the order. */
  contact: string;
}
