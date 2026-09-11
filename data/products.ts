import type { Product } from "@/types/commerce";
import { placeholderProducts } from "@/data/placeholder-products";
import { placeholderBrandBats } from "@/data/placeholder-brand-bats";
import { STUDIO_CATEGORY, studioBats } from "@/data/studio-bats";

/**
 * Static product catalogue for homepage display.
 * Replace with PostgreSQL queries when commerce backend is ready.
 * Ratings/review counts omitted until real review data exists.
 */
const stockedProducts: Product[] = [
  /* ── KIS range ──────────────────────────────────────────────────────────────
   * Thirteen models, in the price order the owner supplied. `price` is that figure
   * exactly: it is what the customer is charged and what lib/orders/order.ts bills,
   * so the owner's list and the till agree by construction.
   *
   * `mrp` is the struck-through "before" price, set by the owner as a promotional
   * device rather than recorded from past sales. Each is a round retail figure picked
   * above the selling price — not a percentage divided out — so it reads as a price
   * tag; `discountPercent()` then derives the badge from the pair, which is why no
   * percentage is stored anywhere and none can drift out of step with the prices it
   * describes. Change a selling price and the badge re-derives itself, but the `mrp`
   * beside it wants revisiting in the same edit.
   *
   * `flagship` is read by KISFeatured, which shows the first four as the homepage
   * band with the first as its hero, so the flags follow the range hierarchy: Master
   * Pro leads.
   *
   * All thirteen carry real studio photographs, every one supplied at 1024x1536 — a
   * clean 2:3, which is the shape both frames crop from most kindly: 17% off the
   * height in the card, 25% off the width on the detail page, with the bat centred
   * and whole in each. Replacing any of them is a matter of dropping a file in under
   * the same name; nothing here needs editing for that. */
  {
    id: "kis-master-pro",
    slug: "kis-master-pro",
    name: "Master Pro",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-master-pro.webp",
    mrp: 13000,
    price: 11000,
    badge: "Flagship",
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-gold-edition",
    slug: "kis-gold-edition",
    name: "Gold Edition",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-gold-edition.webp",
    mrp: 11000,
    price: 9000,
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
    image: "/products/kis-players-special.webp",
    mrp: 10000,
    price: 8500,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-mh7000-plus",
    slug: "kis-mh7000-plus",
    name: "M&H 7000+",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-mh7000-plus.webp",
    mrp: 9500,
    price: 7800,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-mh7000",
    slug: "kis-mh7000",
    name: "M&H 7000",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-mh7000.webp",
    mrp: 7500,
    price: 6300,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "kis-bazuka",
    slug: "kis-bazuka",
    name: "Bazuka",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-bazuka.webp",
    mrp: 7200,
    price: 6000,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "kis-finisher",
    slug: "kis-finisher",
    name: "Finisher",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-finisher.webp",
    mrp: 6000,
    price: 5300,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "kis-game-changer",
    slug: "kis-game-changer",
    name: "Gamechanger",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-game-changer.webp",
    mrp: 5500,
    price: 4800,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "kis-pr-21",
    slug: "kis-pr-21",
    name: "PR 21",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-pr-21.webp",
    mrp: 5000,
    price: 4300,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "kis-boom-boom",
    slug: "kis-boom-boom",
    name: "Boom Boom",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-boom-boom.webp",
    mrp: 4700,
    price: 4000,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "kis-classic",
    slug: "kis-classic",
    name: "Classic",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-classic.webp",
    mrp: 4000,
    price: 3500,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "kis-limited-edition",
    slug: "kis-limited-edition",
    name: "Limited Edition",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-limited-edition.webp",
    mrp: 3600,
    price: 3200,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "kis-blaster",
    slug: "kis-blaster",
    name: "Blaster",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-blaster.webp",
    mrp: 3200,
    price: 2900,
    categorySlug: "kashmir-willow-bats",
  },

  /* ── Valley Woods range ─────────────────────────────────────────────────────
   * Seven models, in the price order the maker supplied, priced on exactly the
   * same rule as the KIS range above: `price` is charged, `mrp` is a round
   * figure above it, and the badge is derived from the pair by discountPercent().
   *
   * `flagship` is deliberately absent. It reads as a range hierarchy but is
   * consumed by KISFeatured, which shows the first four flagship products as the
   * homepage KIS band — setting it here would eventually push a Valley Woods bat
   * into a section titled for another brand. Two are `featured`, which is the
   * flag that means "may appear in the buying row", and is brand-agnostic.
   *
   * Naming: the model is "Mythix", spelled as it is printed on the bat itself.
   * The supplied price list read "MYTHIC"; the photograph was the tiebreaker,
   * because that is the spelling the customer holds in their hands. */
  {
    id: "valleywoods-katana",
    slug: "valleywoods-katana",
    name: "Katana",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-katana.webp",
    mrp: 10000,
    price: 8500,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "valleywoods-beast-pro",
    slug: "valleywoods-beast-pro",
    name: "Beast Pro",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-beast-pro.webp",
    mrp: 8500,
    price: 7000,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "valleywoods-chasemaster",
    slug: "valleywoods-chasemaster",
    name: "Chasemaster",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-chasemaster.webp",
    mrp: 7200,
    price: 6000,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "valleywoods-shadow",
    slug: "valleywoods-shadow",
    name: "Shadow",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-shadow.webp",
    mrp: 6000,
    price: 5300,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "valleywoods-ghost",
    slug: "valleywoods-ghost",
    name: "Ghost",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-ghost.webp",
    mrp: 5400,
    price: 4600,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "valleywoods-destroyer",
    slug: "valleywoods-destroyer",
    name: "Destroyer",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-destroyer.webp",
    mrp: 4700,
    price: 4100,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "valleywoods-mythix",
    slug: "valleywoods-mythix",
    name: "Mythix",
    brandSlug: "valleywoods",
    brandName: "Valley Woods",
    image: "/products/valleywoods-mythix.webp",
    mrp: 4000,
    price: 3500,
    categorySlug: "kashmir-willow-bats",
  },
/* ── JK range ───────────────────────────────────────────────────────────────
   * Five models, in the price order JK supplied, priced on the same rule as the
   * KIS and Valley Woods ranges above.
   *
   * "Most Selling" on the Black Edition is the owner's own claim about their own
   * sales, which is the only basis on which a badge like that belongs on a card:
   * it is not derived from anything this project can count, and nothing here
   * should ever generate one.
   *
   * These replace a single entry, "JK Pro Willow" at 4,999, which was carried
   * over from the initial catalogue and is not part of the range JK supplied. It
   * pointed at a placeholder SVG that the image optimiser rejects, so it had been
   * rendering as an error tile rather than a product. */
  {
    id: "jk-pro-edition",
    slug: "jk-pro-edition",
    name: "Pro Edition",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-pro-edition.webp",
    mrp: 18000,
    price: 15000,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "jk-players-edition",
    slug: "jk-players-edition",
    name: "Players Edition",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-players-edition.webp",
    mrp: 12000,
    price: 9999,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "jk-black-edition",
    slug: "jk-black-edition",
    name: "Black Edition",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-black-edition.webp",
    mrp: 11000,
    price: 9200,
    badge: "Most Selling",
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "jk-thunder",
    slug: "jk-thunder",
    name: "Thunder",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-thunder.webp",
    mrp: 10200,
    price: 8700,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "jk-acron",
    slug: "jk-acron",
    name: "Acron",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-acron.webp",
    mrp: 8600,
    price: 7500,
    categorySlug: "kashmir-willow-bats",
  },

/* ── Tramboo range ──────────────────────────────────────────────────────────
   * Five models, in the price order the maker supplied, priced on the same rule
   * as the ranges above.
   *
   * "Legend" is 12,000. The supplied list read "12,00", which is a dropped zero
   * either way — the owner confirmed 12,000 rather than 1,200, and it was worth
   * confirming: at 1,200 it would have been the cheapest bat in the catalogue,
   * under Tramboo's own Black Edition, and a tenth of what was intended.
   *
   * "Auqib Nabi Edition" is the maker's own product name for a signature model.
   * The name came from the business, not from here — nothing in this project
   * infers a player's involvement with a bat.
   *
   * These replace five invented placeholders (Pro Series, Heritage, Power,
   * Select, Club) whose prices ran to 9,499 and would have sat on the brand page
   * beside the real range. */
  {
    id: "tramboo-legend",
    slug: "tramboo-legend",
    name: "Legend",
    brandSlug: "tramboo",
    brandName: "Tramboo",
    image: "/products/tramboo-legend.webp",
    mrp: 14500,
    price: 12000,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "tramboo-sigma",
    slug: "tramboo-sigma",
    name: "Sigma",
    brandSlug: "tramboo",
    brandName: "Tramboo",
    image: "/products/tramboo-sigma.webp",
    mrp: 8800,
    price: 7400,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "tramboo-auqib-nabi-edition",
    slug: "tramboo-auqib-nabi-edition",
    name: "Auqib Nabi Edition",
    brandSlug: "tramboo",
    brandName: "Tramboo",
    image: "/products/tramboo-auqib-nabi-edition.webp",
    mrp: 7900,
    price: 6700,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "tramboo-alpine",
    slug: "tramboo-alpine",
    name: "Alpine",
    brandSlug: "tramboo",
    brandName: "Tramboo",
    image: "/products/tramboo-alpine.webp",
    mrp: 6200,
    price: 5400,
    categorySlug: "kashmir-willow-bats",
  },
  {
    id: "tramboo-black-edition",
    slug: "tramboo-black-edition",
    name: "Black Edition",
    brandSlug: "tramboo",
    brandName: "Tramboo",
    image: "/products/tramboo-black-edition.webp",
    mrp: 3900,
    price: 3499,
    categorySlug: "kashmir-willow-bats",
  },

  /* ── Hard Tennis Bat ───────────────────────────────────────────────────────────
   *
   * Four models, names and prices as supplied, each with its own photograph.
   *
   * These replace four earlier entries — Scoop Cricket Bat, Regular Bat, Pro
   * Tennis Bat and a Black Mamba at a different price — which carried placeholder
   * SVGs the image optimiser rejects and so had been rendering as error tiles.
   *
   * Still no brandSlug/brandName: this range was supplied without brand
   * attribution, and guessing one would print a manufacturer claim on the card,
   * the page title and the brand filter. Every reader treats absence as "no
   * brand" and renders nothing rather than "undefined".
   *
   * "Top Selling" on the Scoop Bat is the owner's own claim about their own
   * sales. Nothing here derives it, and nothing here should. */
  {
    id: "black-mamba",
    slug: "black-mamba",
    name: "Black Mamba",
    image: "/products/black-mamba.webp",
    mrp: 3900,
    price: 3400,
    categorySlug: "hard-tennis-bats",
  },
  {
    id: "scoop-bat",
    slug: "scoop-bat",
    name: "Scoop Bat",
    image: "/products/scoop-bat.webp",
    mrp: 2300,
    price: 2000,
    badge: "Top Selling",
    categorySlug: "hard-tennis-bats",
  },
  {
    id: "hard-tennis-legend",
    slug: "hard-tennis-legend",
    name: "Hard Tennis Legend",
    image: "/products/hard-tennis-legend.webp",
    mrp: 2050,
    price: 1800,
    categorySlug: "hard-tennis-bats",
  },
  {
    id: "kw-limited-edition",
    slug: "kw-limited-edition",
    name: "KW Limited Edition",
    image: "/products/kw-limited-edition.webp",
    mrp: 1800,
    price: 1600,
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
/* ── Everything with a price ──
 *
 * `products` is the pricing authority: `getProductBySlug` reads it, `resolveCart`
 * resolves through that, and `POST /api/orders` recomputes every line total from it.
 * The three made-to-order studio bats are in here for exactly that reason — a line
 * whose slug is not here is dropped from the order entirely.
 *
 * They are not browsable, though, and every list-shaped helper below filters them
 * out. See `data/studio-bats.ts` for why a bat that is built to order has no shelf
 * to sit on. `getProductBySlug` is deliberately *not* filtered: the cart, the order
 * and the workshop all have to be able to resolve one. */
export const products: Product[] = [
  ...stockedProducts,
  ...placeholderBrandBats,
  ...placeholderProducts,
  ...studioBats,
];

/** The browsable catalogue: `products` minus anything that only exists to be built
 *  to order. One predicate, so a new non-browsable range cannot be half-hidden. */
const browsable = products.filter((p) => p.categorySlug !== STUDIO_CATEGORY);

export function getFeaturedProducts(limit = 8): Product[] {
  return browsable.filter((p) => p.featured).slice(0, limit);
}

export function getFlagshipProducts(): Product[] {
  return browsable.filter((p) => p.flagship);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return browsable.filter((p) => p.brandSlug === brandSlug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return browsable.filter((p) => p.categorySlug === categorySlug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** Drives `generateStaticParams` and the sitemap, so it lists routes worth
 *  prerendering and indexing. A studio bat has no product page to index — the studio
 *  is its page. */
export function getAllProductSlugs(): string[] {
  return browsable.map((p) => p.slug);
}
