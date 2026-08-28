"use client";

import { useCart } from "./CartProvider";

/** The badge on the header's cart icon.
 *
 *  Renders nothing until `ready`, and nothing when the cart is empty. The first is what
 *  keeps this from flashing "0" on every page load before the stored cart is read; the
 *  second is why an empty cart has no badge at all rather than a zero. */
export function CartCount() {
  const { totals, ready } = useCart();
  if (!ready || totals.itemCount === 0) return null;

  return (
    <span
      // aria-hidden because the count is already in the link's own accessible name —
      // see Header. Announced here too it would read "Cart, 3, 3 items".
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-background"
    >
      {totals.itemCount > 99 ? "99+" : totals.itemCount}
    </span>
  );
}

/** The cart link's accessible name, kept in one place so the badge and the label
 *  cannot describe different carts. */
export function useCartLabel(): string {
  const { totals, ready } = useCart();
  if (!ready || totals.itemCount === 0) return "Cart";
  return `Cart, ${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}`;
}
