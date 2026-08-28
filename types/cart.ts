import type { Product } from "@/types/commerce";
import type { AppliedCoupon } from "@/lib/orders/coupon";

/* ── What the cart actually stores ───────────────────────────────────────────────
 *
 * A slug and a quantity. Not a snapshot of the product.
 *
 * The alternative — copying name, price and image in at add-to-cart time — survives a
 * product being deleted, and pays for it by going stale: a price edited in
 * `data/products.ts` would not reach a cart somebody left open, and the figure the
 * customer sends us on WhatsApp would not be the figure on the product page. On a
 * catalogue whose prices are still development placeholders that is the worse failure.
 *
 * So the line is a reference, resolved against `products` on every render. A product
 * that disappears drops out of the cart instead of lingering as an unbuyable ghost —
 * see `resolveCart`. */
export interface CartLine {
  slug: string;
  qty: number;
  /** Made-to-order spec, for bats. Absent for everything else. */
  options?: Record<string, string>;
  /** Laser engraving name. Absent or empty means none. */
  engraving?: string;
}

/* ── Line identity ──
 * A cart used to be keyed by slug, because a product was a product. Once a bat is
 * configured that is wrong: the same bat in SH Round SRT and in Harrow Semi-Oval
 * Duckbill are two different things to make, and merging them on slug would silently
 * collapse one of the two specs. So the key is the slug plus the spec, and `lineKey`
 * is the only thing allowed to compute it. */
export type CartLineKey = string;

/** A resolved line: the stored reference joined to the live product record. */
export interface CartEntry {
  key: CartLineKey;
  product: Product;
  qty: number;
  lineTotal: number;
  options?: Record<string, string>;
  engraving?: string;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  /** Engraving is quoted on WhatsApp, not charged here — see `lib/cart/totals.ts`. */
  engravingFree: boolean;
}

/** Everything the customer types at checkout. Flat and all-strings, so one validator
 *  can read it and the API can coerce it without a schema library. */
export interface CheckoutDetails {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pin: string;
  notes: string;
  /** Optional. Validated by `applyCoupon`, not by `validateCheckout` - it is checked
   *  against the cart rather than against itself. */
  couponCode: string;
  /** Order-level name engraving. Empty means none — the toggle in the form is UI
   *  state, so the data has exactly one representation of "no engraving" instead of
   *  a boolean that can disagree with the text beside it. */
  engraving: string;
}

export type CheckoutField = keyof CheckoutDetails;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

/** One ordered line as it is recorded — this one *is* a snapshot, deliberately. Once
 *  an order exists it is a record of what was agreed, so a later price edit must not
 *  rewrite history. That is the opposite of `CartLine` above and the asymmetry is the
 *  point: a cart tracks the catalogue, an order does not. */
export interface OrderLine {
  slug: string;
  name: string;
  brandName: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  /** Readable pairs, resolved server-side from validated ids: what the workshop
   *  builds. Empty for anything that is not a made-to-order bat. */
  options: { label: string; value: string }[];
  engraving: string | null;
}

export interface Order {
  orderId: string;
  createdAt: string;
  status: "received";
  lines: OrderLine[];
  itemCount: number;
  subtotal: number;
  /** Null when no code was applied, or when the one supplied did not qualify. Always
   *  the server's own verdict - never what the client claimed. */
  coupon: AppliedCoupon | null;
  /** Rupees off. Zero without a coupon. */
  discount: number;
  /** subtotal - discount. Still not a final figure: shipping is agreed on WhatsApp. */
  total: number;
  /** Order-level engraving as recorded, or null. Distinct from a line’s own
   *  engraving: a bat configured on its product page carries its own text, and this
   *  is the instruction for the order as a whole. */
  engraving: string | null;
  customer: CheckoutDetails;
}

export interface OrderReceipt {
  orderId: string;
  status: Order["status"];
  createdAt: string;
}
