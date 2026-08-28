import type { Product } from "@/types/commerce";

/* ── Development placeholder inventory: the partner-brand bat ranges ─────────────
 *
 * Thirty-nine stand-ins so that every brand has a catalogue instead of one brand
 * having a catalogue. Before this, `getProductsByBrand` returned seven products for
 * KIS, one for JK and nothing at all for the other seven — so seven of the nine cards
 * on /brands led to a page with a header and an empty grid.
 *
 * ── None of this is real ──
 * Every model name and every price here was invented to fill the shape. They are not
 * KIS's names, they are not real Kashmir models, and no figure is a real commercial
 * price. Each entry carries `isPlaceholder: true`, which is what puts a visible marker
 * on the card and a notice on the product page: a shopper must never have to guess
 * which of these is real, and neither must whoever replaces them.
 *
 * ── Why this file is separate from `data/products.ts` ──
 * Same reason `placeholder-products.ts` is: it is temporary and that file is not. The
 * handover is "delete this file, delete its 39 SVGs, remove one import" — three lines
 * to verify — rather than a diff that has to pick 39 objects back out of a list of
 * 104. Replacing one brand at a time works too: drop that brand's block here and add
 * the real products to `stockedProducts`.
 *
 * ── Why a table and not 39 objects ──
 * Only the brand, the name and the price vary. The id, slug, image path, category and
 * placeholder flag are all derived, so writing them out 39 times would be 39 chances
 * to typo a slug into a 404. The table is the dataset; `build()` is the only code.
 *
 * ── What is deliberately absent ──
 * No `mrp`, so no strike-through and no "% off": a discount off an invented price is
 * an invented saving, which is worse than an invented price. No `badge`, no rating, no
 * review count, no stock claim. Not `featured` and not `flagship` — the homepage rows
 * read exactly those two flags, so none of this artwork reaches the home page and the
 * KIS range keeps it to itself.
 *
 * ── What is deliberately present ──
 * `brandSlug` and `brandName`, which the equipment placeholders omit. Those exist to
 * fill category pages and have no brand to claim; these exist *because* of their
 * brand, and the brand page filters on `brandSlug`. `categorySlug` is
 * `kashmir-willow-bats` throughout — these are Kashmir brands making Kashmir willow,
 * so they belong in that catalogue alongside the KIS range rather than in one of
 * their own.
 *
 * The model names below are duplicated in `scripts/generate-brand-bat-placeholders.mjs`,
 * which draws the artwork. The slug is the contract between the two files; if they
 * drift, the card requests an image that does not exist, which is visible immediately.
 */

/** Model name and development price, per brand. */
type Model = readonly [name: string, price: number];

const RANGES: ReadonlyArray<
  readonly [brandSlug: string, brandName: string, models: readonly Model[]]
> = [
  // Four, not five: JK already carries "Pro Willow" in `stockedProducts`.
  [
    "jk",
    "JK",
    [
      ["Thunder", 8499],
      ["Sixer", 6999],
      ["Warrior", 7499],
      ["Classic", 5499],
    ],
  ],
  [
    "valleywoods",
    "Valley Woods",
    [
      ["Legend", 9999],
      ["Pro", 8999],
      ["Elite", 7499],
      ["Striker", 6799],
      ["Classic", 5999],
    ],
  ],
  [
    "tramboo",
    "Tramboo",
    [
      ["Pro Series", 9499],
      ["Heritage", 8499],
      ["Power", 7299],
      ["Select", 5899],
      ["Club", 4999],
    ],
  ],
  [
    "woodford",
    "Woodford",
    [
      ["Premier", 9299],
      ["Player", 8199],
      ["Blaze", 7899],
      ["Classic", 6299],
      ["Academy", 4799],
    ],
  ],
  [
    "whiteduck",
    "Whiteduck",
    [
      ["Apex", 9599],
      ["Storm", 8799],
      ["Impact", 7599],
      ["Drive", 6499],
      ["Club", 5299],
    ],
  ],
  [
    "sls",
    "SLS",
    [
      ["Pro Elite", 10499],
      ["Titan", 9199],
      ["Velocity", 8299],
      ["Match", 6199],
      ["Academy", 4899],
    ],
  ],
  [
    "ib",
    "IB",
    [
      ["International", 9899],
      ["Supreme", 8999],
      ["Power Play", 7799],
      ["Ranger", 6899],
      ["Classic", 5599],
    ],
  ],
  [
    "a-star",
    "A Star",
    [
      ["Champion", 9299],
      ["Pro", 8399],
      ["Blaze", 7899],
      ["Rising", 6599],
      ["Club", 4699],
    ],
  ],
];


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
  return RANGES.flatMap(([brandSlug, brandName, models]) =>
    models.map(([name, price]): Product => {
      /* Brand-prefixed, because the model names are not unique across brands and the
         slug is a route. Three brands ship a "Classic" and three a "Club"; unprefixed
         they would collide into one product page and silently shadow each other. */
      const slug = `${brandSlug}-${slugify(name)}`;

      return {
        id: slug,
        slug,
        name,
        brandSlug,
        brandName,
        // Alongside the equipment placeholders, in the directory that exists so
        // disposable artwork never has to be told apart from real photography by
        // reading it.
        // The data carries the path; the renderer never appends an extension.
        image: IMAGE_OVERRIDES[slug] ?? `/products/placeholders/${slug}.svg`,
        price,
        categorySlug: "kashmir-willow-bats",
        isPlaceholder: true,
      };
    }),
  );
}

export const placeholderBrandBats: Product[] = build();
