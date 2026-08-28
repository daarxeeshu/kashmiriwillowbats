import { getProductBySlug } from "@/data/products";
import { siteConfig } from "@/data/site-config";
import type { CartEntry, CartLine, CartTotals } from "@/types/cart";
import {
  isConfigurableBat,
  normaliseEngraving,
  sanitiseBatOptions,
} from "@/data/bat-options";

/** Hard ceiling per line. Not a stock claim — there is no inventory system — but a cart
 *  cannot be allowed to reach a quantity nobody would type on purpose, because that
 *  figure ends up in a WhatsApp message a human has to read. */
export const MAX_QTY = 20;

export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(MAX_QTY, Math.floor(qty)));
}

/** Join stored references to live products, dropping any that no longer exist.
 *
 *  Silent removal is the right behaviour here: a slug that resolves to nothing is a
 *  product that has been renamed or withdrawn, and the only alternatives are showing a
 *  blank row or a "this item is gone" notice for something the customer may have added
 *  months ago. It cannot cost anyone money — nothing is charged in this flow. */
/** The stable identity of a configured line. Sorted, so two records with the same
 *  spec in a different key order are the same line rather than two. */
function rawLineKey(line: CartLine): string {
  const spec = line.options
    ? Object.keys(line.options)
        .sort()
        .map((k) => `${k}:${line.options![k]}`)
        .join(",")
    : "";
  return `${line.slug}|${spec}|${normaliseEngraving(line.engraving ?? "")}`;
}

/* ── The key a line resolves to ──────────────────────────────────────────────────
 *
 * The one function allowed to answer "which line is this?", and everything - the cart
 * view, the steppers, remove, and add's merge check - must go through it.
 *
 * It exists because the raw stored line and the resolved entry did not agree. A bat
 * added from a product card is stored with no options at all, while `resolveCart`
 * fills in the defaults before building its key, so the same line had two different
 * identities: `slug||` in the provider and `slug|handle:round,...|` in the view. The
 * view passed its key to `remove`, nothing matched, and the button did nothing.
 *
 * Sanitising here rather than at add time is deliberate: carts already in browsers
 * were written before options existed, and this resolves them correctly on read
 * without a migration. */
export function resolvedLineKey(line: CartLine): string {
  const product = getProductBySlug(line.slug);
  const options =
    product && isConfigurableBat(product.categorySlug)
      ? sanitiseBatOptions(line.options, product.categorySlug)
      : undefined;
  return rawLineKey({
    ...line,
    options,
    engraving: normaliseEngraving(line.engraving ?? ""),
  });
}

export function resolveCart(lines: CartLine[]): CartEntry[] {
  return lines.flatMap((line) => {
    const product = getProductBySlug(line.slug);
    if (!product) return [];
    const qty = clampQty(line.qty);
    // Re-sanitised on read, not trusted from storage: a spec edited by hand in
    // localStorage, or left over from a version with different option ids, resolves
    // back to valid values instead of reaching the order.
    const options = isConfigurableBat(product.categorySlug)
      ? sanitiseBatOptions(line.options, product.categorySlug)
      : undefined;
    const engraving = normaliseEngraving(line.engraving ?? "");
    return [
      {
        key: resolvedLineKey(line),
        product,
        qty,
        lineTotal: product.price * qty,
        options,
        engraving: engraving || undefined,
      },
    ];
  });
}

export function cartTotals(entries: CartEntry[]): CartTotals {
  const subtotal = entries.reduce((sum, e) => sum + e.lineTotal, 0);
  return {
    itemCount: entries.reduce((sum, e) => sum + e.qty, 0),
    subtotal,
    engravingFree: subtotal >= siteConfig.engraving.freeThreshold,
  };
}
