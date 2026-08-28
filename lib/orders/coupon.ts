import { offers } from "@/data/offers";
import type { CartEntry } from "@/types/cart";

/* ── Coupons ─────────────────────────────────────────────────────────────────────
 *
 * One module, used by the checkout form and by the route handler. The form calls it so
 * the customer sees the discount before submitting; the server calls it again on the
 * payload it receives, and the server's answer is the one recorded.
 *
 * That double call is the whole design. A discount the client computes is a discount
 * the client chooses, and this endpoint creates an order record that a human then
 * fulfils - so a fabricated 90% off would arrive on WhatsApp looking exactly like a
 * real one. The client never sends an amount, only a code. */

export interface AppliedCoupon {
  code: string;
  /** The words for the receipt: "10% off" or "Free shipping". */
  label: string;
  percentOff: number;
  freeShipping: boolean;
  /** Rupees off the subtotal. Rounded to whole rupees - a paisa in a WhatsApp message
   *  is noise, and nothing here is a real settlement figure. */
  discount: number;
}

export type CouponResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; reason: string };

/** Codes are matched case- and space-insensitively: people type them off a phone
 *  screen, and rejecting "kisfirstorder " is a support message, not a security win. */
function normalise(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

export function applyCoupon(
  rawCode: string,
  entries: CartEntry[],
  subtotal: number,
): CouponResult {
  const code = normalise(rawCode);
  if (!code) return { ok: false, reason: "Enter a code to apply." };

  const offer = offers.find((o) => o.code && normalise(o.code) === code);
  if (!offer) return { ok: false, reason: "That code isn't valid." };

  const itemCount = entries.reduce((sum, e) => sum + e.qty, 0);
  if (offer.minItems && itemCount < offer.minItems) {
    // Say what is missing rather than just refusing - this is the one rejection the
    // customer can actually act on, and it sells another bat.
    const short = offer.minItems - itemCount;
    return {
      ok: false,
      reason: `${offer.code} needs ${offer.minItems} items. Add ${short} more.`,
    };
  }

  const percentOff = offer.percentOff ?? 0;
  const freeShipping = offer.freeShipping ?? false;
  const discount = Math.round((subtotal * percentOff) / 100);

  const label = percentOff > 0 ? `${percentOff}% off` : "Free shipping";

  return {
    ok: true,
    coupon: { code: offer.code!, label, percentOff, freeShipping, discount },
  };
}
