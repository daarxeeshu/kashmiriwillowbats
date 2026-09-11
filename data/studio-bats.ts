import type { Product } from "@/types/commerce";

/* ── The three made-to-order bats ────────────────────────────────────────────────
 *
 * Only these three can be built in "Customise Your Bat 3D", and they exist nowhere
 * else in the shop.
 *
 * ── Why they are `Product` records at all ──
 * They have to be. `POST /api/orders` calls `resolveCart`, which looks every line up
 * with `getProductBySlug` and *drops* anything it cannot find — so a studio bat that
 * was not a product would not merely show the wrong price, it would vanish from the
 * order and the customer would be told their cart was empty. Price is recomputed
 * server-side from this file for the same reason every other price is: a tampered
 * payload must not be able to invent one.
 *
 * ── Why they are not in the willow categories ──
 * `categorySlug` is their own, and `data/products.ts` keeps them out of every
 * list-shaped query. A made-to-order bat has no shelf to sit on: it is not stock, it
 * has no photograph of the finished article, and putting it in the Kashmir Willow
 * listing beside bats that can be bought as they are would misrepresent both. The
 * studio is the only way in, which is exactly what the section is for.
 *
 * The slug is what an order records, so renaming a bat is a `name` edit here and
 * nothing else — the three were "The Classic", "Powerhouse" and "Strokemaker" before
 * they were Phantom, The Elite and Signature, and no slug moved with them.
 */

/** The category these three share. Registered in `CONFIGURABLE_CATEGORIES` so
 *  `sanitiseBatOptions` validates their spec instead of discarding it — without that
 *  the whole 3D configuration would be stripped on the way to the workshop. */
export const STUDIO_CATEGORY = "custom-3d-bats";

/* The studio's own render, not a photograph.
 *
 * There is no stock image of a bat that does not exist until it is ordered, and
 * dressing one of these in another model's product shot would be a claim about a bat
 * nobody has built — `/hero/bat.png` was tried and is wrong for exactly that reason:
 * it carries a MASTER PRO sticker, so a Phantom line in the cart would show another
 * bat's name.
 *
 * So this is a capture of the configurator itself with the burn switched off: willow,
 * the KIS shield, a grip, and no model name anywhere — the shield's wordmark was
 * cropped away in `prep-assets.mjs`, which is what makes one image honest for all
 * three. The real preview is still the studio, which renders the customer's own spec.
 * Regenerate it from the studio (see the `bat-studio-inspection` note) if the mesh or
 * the finish changes. */
const STUDIO_IMAGE = "/configurator/studio-bat.webp";

export const studioBats: Product[] = [
  {
    id: "custom-phantom",
    slug: "kis-phantom",
    name: "Phantom",
    brandSlug: "kis",
    brandName: "KIS",
    image: STUDIO_IMAGE,
    price: 8000,
    categorySlug: STUDIO_CATEGORY,
  },
  {
    id: "custom-the-elite",
    slug: "kis-the-elite",
    name: "The Elite",
    brandSlug: "kis",
    brandName: "KIS",
    image: STUDIO_IMAGE,
    price: 10000,
    categorySlug: STUDIO_CATEGORY,
  },
  {
    id: "custom-signature",
    slug: "kis-signature",
    name: "Signature",
    brandSlug: "kis",
    brandName: "KIS",
    image: STUDIO_IMAGE,
    price: 20000,
    categorySlug: STUDIO_CATEGORY,
  },
];

/** Willow, lead time and the blurb the studio shows. Kept beside the products rather
 *  than inside them because `Product` is the shop's shape and none of this belongs on
 *  a helmet: willow is a property of the cleft, and the lead time is what the workshop
 *  quoted — 3–4 days for Kashmir, about a week for English, which is imported and
 *  worked differently. */
export interface StudioBatDetail {
  willow: "kashmir" | "english";
  leadLabel: string;
  blurb: string;
}

export const studioBatDetail: Record<string, StudioBatDetail> = {
  "kis-phantom": {
    willow: "kashmir",
    leadLabel: "3–4 days",
    blurb: "Hand-picked Kashmir willow cleft, shaped to order.",
  },
  "kis-the-elite": {
    willow: "kashmir",
    leadLabel: "3–4 days",
    blurb: "Bigger edges and a fuller spine, on Kashmir willow.",
  },
  "kis-signature": {
    willow: "english",
    leadLabel: "about a week",
    blurb: "Imported English willow — lighter pickup, more ping.",
  },
};

export const studioBatSlugs = studioBats.map((bat) => bat.slug);
