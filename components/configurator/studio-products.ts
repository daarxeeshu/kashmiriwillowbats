/* ── Which bats the studio can build ─────────────────────────────────────────────
 *
 * Three, and only three: Phantom and The Elite on Kashmir willow, Signature on
 * English. They are declared in `data/studio-bats.ts` and exist nowhere else in the
 * shop — the studio does not offer the browsable catalogue, because a bat from the
 * shelf is bought as it is and these are shaped to order.
 *
 * Prices come from the product record and never from here. `POST /api/orders`
 * recomputes every line from `data/products.ts` and ignores anything the client says
 * about money, so a price of the studio's own would be a figure shown and then
 * quietly replaced at checkout.
 */
import { getProductBySlug } from "@/data/products";
import { studioBatDetail, studioBats } from "@/data/studio-bats";

export type Willow = "kashmir" | "english";

export interface StudioProduct {
  slug: string;
  name: string;
  price: number;
  willow: Willow;
  /** What the studio prints as the lead time. English willow is imported and worked
   *  differently, which is the whole reason the two differ. */
  leadLabel: string;
  blurb: string;
  categorySlug: string;
}

/** In the order the range is presented: the two Kashmir bats, then the English one. */
export const studioProducts: StudioProduct[] = studioBats.map((bat) => {
  // Resolved through the same lookup the cart and the server use, so the figure on
  // screen is provably the figure that will be charged rather than a copy of it.
  const product = getProductBySlug(bat.slug) ?? bat;
  const detail = studioBatDetail[bat.slug];
  return {
    slug: bat.slug,
    name: product.name,
    price: product.price,
    willow: detail.willow,
    leadLabel: detail.leadLabel,
    blurb: detail.blurb,
    categorySlug: product.categorySlug,
  };
});

export function studioProductBySlug(slug: string): StudioProduct | undefined {
  return studioProducts.find((p) => p.slug === slug);
}

/** The bat the studio opens on: the entry bat, so the first price a customer sees is
 *  the lowest of the three rather than the highest. */
export const DEFAULT_STUDIO_SLUG = studioProducts[0]?.slug ?? "";
