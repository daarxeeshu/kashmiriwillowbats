import type { Product } from "@/types/commerce";

/* ── Development placeholder inventory ───────────────────────────────────────────
 *
 * Forty-eight stand-ins — six per equipment category — so the eight equipment
 * catalogues can be built, navigated, filtered, sorted and reviewed before real stock
 * exists. Every name and every price here was supplied as a development placeholder.
 * None of it is real inventory and none of it is a real commercial price.
 *
 * ── Why this file is separate from `data/products.ts` ──
 * Because it is temporary and that file is not. The handover is "delete this file, drop
 * `public/products/placeholders/`, remove one import" — a change you can verify by
 * reading three lines, rather than a diff that picks 48 objects back out of a list of
 * 65. Every consumer reads the merged `products` array, so nothing downstream knows or
 * cares that the split exists.
 *
 * ── Why a table and not 48 objects ──
 * The only things that vary across the 48 are the name, the price and the category. The
 * id, slug, image path and placeholder flag are all derivable from those, so writing
 * them out 48 times would be 48 chances to typo a slug into a 404. The table below is
 * the entire dataset; `build()` is the only code.
 *
 * ── What is deliberately absent ──
 * No `mrp`, so no strike-through and no "% off": a discount off an invented price would
 * be an invented saving, which is the one thing worse than an invented price. No brand,
 * no rating, no review count, no `badge`, no stock claim — same discipline as the Hard
 * Tennis Bat and English Willow ranges in `data/products.ts`. Not `featured` and not
 * `flagship`, which keeps all 48 off the homepage: the homepage's product rows read
 * those two flags, so no placeholder artwork loads there.
 *
 * The one thing every entry does carry is `isPlaceholder: true`, which is what puts a
 * visible "Placeholder" marker on the card and a notice on the product page. A shopper
 * should never have to guess which of these is real.
 */

/** Name and price, in the order supplied. The price is a development figure. */
type Entry = readonly [name: string, price: number];

const CATALOGUE: ReadonlyArray<readonly [categorySlug: string, entries: readonly Entry[]]> = [
  [
    "cricket-bags",
    [
      ["Pro Cricket Kit Bag", 2499],
      ["Elite Wheelie Bag", 3499],
      ["Match Carry Bag", 4999],
      ["Power Cricket Duffle", 2999],
      ["Club Kit Bag", 1999],
      ["Xtreme Cricket Bag", 5499],
    ],
  ],
  [
    "cricket-shoes",
    [
      ["Pro Pace Cricket Shoes", 2999],
      ["Elite Strike Shoes", 3499],
      ["Match Runner Shoes", 4999],
      ["Power Drive Cricket Shoes", 5499],
      ["Club Pro Shoes", 2499],
      ["Xtreme Pace Shoes", 6999],
    ],
  ],
  [
    "cricket-balls",
    [
      ["Match Red Cricket Ball", 399],
      ["Pro Leather Cricket Ball", 499],
      ["Club Match Ball", 699],
      ["Elite Test Ball", 899],
      ["Training Red Ball", 1199],
      ["Premium Cricket Ball", 1499],
    ],
  ],
  [
    "helmets",
    [
      ["Pro Shield Helmet", 2999],
      ["Elite Cricket Helmet", 3999],
      ["Match Guard Helmet", 4499],
      ["Power Protection Helmet", 5499],
      ["Club Shield Helmet", 6499],
      ["Xtreme Safety Helmet", 7999],
    ],
  ],
  [
    "thigh-guards",
    [
      ["Pro Thigh Guard", 699],
      ["Elite Thigh Protection", 899],
      ["Match Shield Guard", 999],
      ["Power Guard", 1199],
      ["Club Thigh Protector", 1499],
      ["Xtreme Thigh Guard", 1799],
    ],
  ],
  [
    "batting-pads",
    [
      ["Pro Batting Pads", 1999],
      ["Elite Leg Guards", 2499],
      ["Match Shield Pads", 2999],
      ["Power Protection Pads", 3499],
      ["Club Batting Pads", 4499],
      ["Xtreme Leg Guards", 5499],
    ],
  ],
  [
    "batting-gloves",
    [
      ["Pro Grip Batting Gloves", 1499],
      ["Elite Shield Gloves", 1999],
      ["Power Grip 500", 2499],
      ["Match Pro Batting Gloves", 2999],
      ["Xtreme Grip Gloves", 1799],
      ["Club Master Gloves", 3499],
    ],
  ],
  [
    "accessories",
    [
      ["Pro Bat Grip", 299],
      ["Premium Bat Tape", 399],
      ["Cricket Grip Pack", 499],
      ["Bat Protection Kit", 699],
      ["Match Accessories Pack", 899],
      ["Cricket Care Kit", 1199],
    ],
  ],
];

/** The same transform `scripts/generate-product-placeholders.mjs` applies, so a name
 *  resolves to the artwork the script wrote for it. Kept trivial on purpose: the 48
 *  names are plain ASCII words and digits, and a cleverer slugifier would be a second
 *  thing to keep in step with the generator. */

/* ── Replacing a placeholder with a real photograph ──────────────────────────────
 *
 * The generated path below ends in .svg because that is what the generator script
 * writes. It is the one place in this project where an extension is assembled in
 * code, and this map is the escape hatch so it never becomes a constraint.
 *
 * A real photograph is any supported format — .jpg, .jpeg, .png or .webp — and is
 * adopted by adding one line here with the actual filename. Nothing has to be
 * renamed, converted, or matched to the generated name:
 *
 *   "club-kit-bag": "/products/club-kit-bag.webp",
 *
 * The record then carries the real path and the rest of the app simply renders it —
 * see lib/images.ts. When a whole range is photographed, move those entries into
 * `stockedProducts` in data/products.ts and drop them from here. */
const IMAGE_OVERRIDES: Record<string, string> = {
  // slug: "/products/real-photo.webp",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function build(): Product[] {
  return CATALOGUE.flatMap(([categorySlug, entries]) =>
    entries.map(([name, price]): Product => {
      const slug = slugify(name);
      return {
        id: slug,
        slug,
        name,
        // Its own directory, so the disposable artwork never has to be told apart from
        // the real photography in `public/products/` by reading it.
        // The data carries the path; the renderer never appends an extension.
        image: IMAGE_OVERRIDES[slug] ?? `/products/placeholders/${slug}.svg`,
        price,
        categorySlug,
        isPlaceholder: true,
      };
    }),
  );
}

export const placeholderProducts: Product[] = build();
