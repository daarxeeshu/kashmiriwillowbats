import type { Product } from "@/types/commerce";
import { placeholderProducts } from "@/data/placeholder-products";
import { placeholderBrandBats } from "@/data/placeholder-brand-bats";

/**
 * Static product catalogue for homepage display.
 * Replace with PostgreSQL queries when commerce backend is ready.
 * Ratings/review counts omitted until real review data exists.
 */
const stockedProducts: Product[] = [
  {
    id: "kis-mh7000-plus",
    slug: "kis-mh7000-plus",
    name: "M&H7000+",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-mh7000-plus.jpg",
    mrp: 12999,
    price: 11499,
    badge: "Flagship",
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-mh7000",
    slug: "kis-mh7000",
    name: "M&H7000",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-mh7000.svg",
    mrp: 10999,
    price: 9799,
    badge: "Popular",
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-bazuka",
    slug: "kis-bazuka",
    name: "Bazuka",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-bazuka.svg",
    mrp: 8499,
    price: 7499,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-game-changer",
    slug: "kis-game-changer",
    name: "Game Changer",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-game-changer.svg",
    mrp: 7999,
    price: 6999,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-players-special",
    slug: "kis-players-special",
    name: "Players Special",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-players-special.svg",
    mrp: 9499,
    price: 8499,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-master-pro",
    slug: "kis-master-pro",
    name: "Master Pro",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-master-pro.svg",
    mrp: 6999,
    price: 6299,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "kis-finisher",
    slug: "kis-finisher",
    name: "Finisher",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-finisher.svg",
    mrp: 5999,
    price: 5499,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "jk-pro-willow",
    slug: "jk-pro-willow",
    name: "JK Pro Willow",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-pro-willow.svg",
    mrp: 5499,
    price: 4999,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },

  /* ── Hard Tennis Bat ───────────────────────────────────────────────────────────
   *
   * Names and prices as supplied. Nothing else is: no `mrp`, so no strike-through and
   * no "% off" — a discount needs a real list price, and inventing one to decorate the
   * card would be inventing a saving that does not exist. No `brandSlug`/`brandName`,
   * because none were given. No `badge`, no rating.
   *
   * Not `featured` either. That flag drives the "What players are buying" row, which
   * is a separate editorial decision from launching a category — these appear in their
   * own homepage section and their own catalogue, which is what was asked for.
   *
   * The images are the project's own studio placeholders, one per product, at the
   * paths the real photographs will take. Dropping a real file over each one — same
   * name, or a `.jpg` with the extension updated here — is the whole handover.
   *
   * Adding these four is also what switches both Hard Tennis Bat surfaces out of their
   * launch state: the homepage section and the catalogue page both read the category's
   * product list, so neither needed an edit. */
  {
    id: "scoop-cricket-bat",
    slug: "scoop-cricket-bat",
    name: "Scoop Cricket Bat",
    image: "/products/scoop-cricket-bat.svg",
    price: 1800,
    categorySlug: "hard-tennis-bats",
  },
  {
    id: "black-mamba",
    slug: "black-mamba",
    name: "Black Mamba",
    image: "/products/black-mamba.svg",
    price: 2000,
    categorySlug: "hard-tennis-bats",
  },
  {
    id: "regular-bat",
    slug: "regular-bat",
    name: "Regular Bat",
    image: "/products/regular-bat.svg",
    price: 1200,
    categorySlug: "hard-tennis-bats",
  },
  {
    id: "pro-tennis-bat",
    slug: "pro-tennis-bat",
    name: "Pro Tennis Bat",
    image: "/products/pro-tennis-bat.svg",
    price: 1500,
    categorySlug: "hard-tennis-bats",
  },

  /* ── English Willow ────────────────────────────────────────────────────────────
   *
   * The grade ladder, highest first. Same discipline as Hard Tennis Bat above: names
   * and prices as supplied, and nothing else. No `mrp`, so no strike-through and no
   * "% off" — that needs a real list price, and inventing one would be inventing a
   * saving. No `brandSlug`/`brandName`, no `badge`, no rating, no stock claim.
   *
   * Not `featured` or `flagship` either, even though ₹90,000 is the most expensive
   * product in the catalogue. Those flags drive the homepage's "What players are
   * buying" and flagship rows, which is an editorial placement decision, not a
   * consequence of price — and it was not part of what was asked for.
   *
   * The prices were supplied against the labels Grade 1 through Grade 5, which is one
   * position off this ladder: the range is Player Grade 1+ then Grade 1-4, both here
   * and in `data/categories.ts`, and there is no Grade 5. Confirmed as positional —
   * highest price to the top grade — so the names below are the ones originally
   * specified and the category's own copy still describes the range correctly.
   *
   * Images are this project's studio placeholders, one per grade, at the paths the
   * real photographs will take; each is drawn to its grade, so the Grade 1+ blade
   * carries nine straight grains and no blemish while Grade 4 carries five and a
   * butterfly stain. Dropping a real file over each — same name, or a `.jpg` with the
   * extension updated here — is the whole handover.
   *
   * Adding these five is also what fills the English Willow catalogue: the category
   * page and its homepage section both read the category's product list, so neither
   * needed an edit, and the category carries no `comingSoon` flag to clear. */
  {
    id: "english-willow-grade-1-plus",
    slug: "english-willow-grade-1-plus",
    name: "Grade 1+ (Player Grade)",
    image: "/products/english-willow-grade-1-plus.svg",
    price: 90000,
    categorySlug: "english-willow-bats",
  },
  {
    id: "english-willow-grade-1",
    slug: "english-willow-grade-1",
    name: "Grade 1",
    image: "/products/english-willow-grade-1.svg",
    price: 50000,
    categorySlug: "english-willow-bats",
  },
  {
    id: "english-willow-grade-2",
    slug: "english-willow-grade-2",
    name: "Grade 2",
    image: "/products/english-willow-grade-2.svg",
    price: 35000,
    categorySlug: "english-willow-bats",
  },
  {
    id: "english-willow-grade-3",
    slug: "english-willow-grade-3",
    name: "Grade 3",
    image: "/products/english-willow-grade-3.svg",
    price: 20000,
    categorySlug: "english-willow-bats",
  },
  {
    id: "english-willow-grade-4",
    slug: "english-willow-grade-4",
    name: "Grade 4",
    image: "/products/english-willow-grade-4.svg",
    price: 15000,
    categorySlug: "english-willow-bats",
  },
];

/* Real stock first, then the 48 development placeholders for the equipment categories.
 *
 * Merged here rather than at each call site so every selector below — and therefore
 * every page, every catalogue, every filter, sort and product route — sees one
 * catalogue and needs no knowledge of the split. That is the point: a placeholder has
 * to exercise exactly the paths real inventory will, or the catalogues are not actually
 * tested. The only thing that distinguishes them is `isPlaceholder`, and the only things
 * that read it are the card's badge and the product page's notice.
 *
 * Order matters for one reason: `getFeaturedProducts` and `getFlagshipProducts` filter
 * on flags no placeholder sets, so putting them last is belt-and-braces rather than
 * load-bearing. When the real equipment stock arrives, delete the import and this spread
 * and the site loses 48 products with no other edit.
 */
export const products: Product[] = [
  ...stockedProducts,
  ...placeholderBrandBats,
  ...placeholderProducts,
];

export function getFeaturedProducts(limit = 8): Product[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getFlagshipProducts(): Product[] {
  return products.filter((p) => p.flagship);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return products.filter((p) => p.brandSlug === brandSlug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}
