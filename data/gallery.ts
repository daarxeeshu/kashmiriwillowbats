import type {
  GalleryCategory,
  GalleryCategoryMeta,
  GalleryItem,
} from "@/types/gallery";

/* ── Wall of Fame data ───────────────────────────────────────────────────────────
 *
 * The single seam between the gallery and wherever its entries come from. Today that
 * is the array below; tomorrow it is a Supabase query. Every consumer goes through the
 * selectors at the bottom of this file rather than reading the array, so replacing the
 * source is a change to this file alone.
 *
 * ── Everyone here is real, and only what was supplied is recorded ──
 * The eight entries are people the business named and provided photographs for. The
 * rule that governed the placeholders they replaced still governs these: no team,
 * achievement, endorsement or relationship with this brand is stated unless it came
 * from the business. So `playerType`, `location`, `caption` and `batUsed` sit empty —
 * `batUsed` especially, which renders next to a face as an endorsement, and none was
 * given. A missing field is a gap; a filled-in one is a claim about a named person.
 *
 * ── On minors ──
 * `published` defaults to false for anything under-19 and stays false until an adult
 * with authority to consent has approved it. That rule lives with the data rather than
 * in the UI so it cannot be lost when the UI changes — see `visibleGalleryItems`.
 */

export const GALLERY_CATEGORIES: GalleryCategoryMeta[] = [
  { id: "all", label: "All" },
  {
    id: "international",
    label: "International",
    blurb: "Players who have represented their country.",
  },
  {
    id: "professional",
    label: "IPL / Professional",
    blurb: "Franchise and first-class cricketers.",
  },
  { id: "icon", label: "Icon Players", blurb: "Names the game remembers." },
  {
    id: "kashmir",
    label: "Kashmir Superstars",
    blurb: "The Valley's best-known cricketers.",
  },
  {
    id: "local",
    label: "Local Talent",
    blurb: "Club and district cricket across Kashmir.",
  },
  {
    id: "under-19",
    label: "Under 19",
    blurb: "Age-group and academy players. Published with guardian consent only.",
  },
  {
    id: "customer",
    label: "Customers",
    blurb: "People who bought a bat and sent us a photograph of it in play.",
  },
];

/* The eight players on the wall, in the order they are shown.
 *
 * Every one is a real person named by the owner, so this file states only what was
 * given: a name, a category and a photograph. No club, no achievement, no bat — a
 * `batUsed` value renders beside the face as an endorsement, and none was supplied.
 * An empty field is a gap; an invented one is a claim about someone who never made it.
 *
 * `published` gates rendering in the data layer rather than the UI, so no component
 * can show an unapproved photograph by forgetting a filter. All eight are adults;
 * anything arriving for the under-19 category stays unpublished until a guardian has
 * agreed to it. */
const ITEMS: GalleryItem[] = [
  {
    id: "shiraz-khan",
    name: "Shiraz Khan",
    image: "/gallery/shiraz-khan.webp",
    category: "icon",
    featured: true,
    displayOrder: 1,
    published: true,
  },
  {
    id: "thisara-perera",
    name: "Thisara Perera",
    image: "/gallery/thisara-perera.webp",
    category: "international",
    featured: true,
    displayOrder: 2,
    published: true,
  },
  {
    id: "keshara-nuwantha",
    name: "Keshara Nuwantha",
    image: "/gallery/keshara-nuwantha.webp",
    category: "international",
    displayOrder: 3,
    published: true,
  },
  {
    id: "pervez-rasool",
    name: "Pervez Rasool",
    image: "/gallery/pervez-rasool.webp",
    category: "professional",
    featured: true,
    displayOrder: 4,
    published: true,
  },
  {
    id: "fazlul-haq",
    name: "Fazlul Haq",
    image: "/gallery/fazlul-haq.webp",
    category: "professional",
    displayOrder: 5,
    published: true,
  },
  {
    id: "ishtiyaq-rasool",
    name: "Ishtiyaq Rasool",
    image: "/gallery/ishtiyaq-rasool.webp",
    category: "kashmir",
    displayOrder: 6,
    published: true,
  },
  {
    id: "jahangir-lone",
    name: "Jahangir Lone",
    image: "/gallery/jahangir-lone.webp",
    category: "kashmir",
    displayOrder: 7,
    published: true,
  },
  {
    id: "madhan",
    name: "Madhan",
    image: "/gallery/madhan.webp",
    category: "local",
    displayOrder: 8,
    published: true,
  },
];

/* ── Selectors ──
 * The only way anything reads this data. When Supabase arrives these become async and
 * the array above disappears; no component changes shape. */

/** Published entries only, in display order. The published check is here rather than
 *  in a component so that no future surface can accidentally render an unapproved
 *  photograph — particularly a minor's. */
export function visibleGalleryItems(): GalleryItem[] {
  return ITEMS.filter((item) => item.published).sort(
    (a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER),
  );
}

export function galleryItemsByCategory(category: GalleryCategory | "all"): GalleryItem[] {
  const all = visibleGalleryItems();
  return category === "all" ? all : all.filter((i) => i.category === category);
}

/** A short, featured-first selection for the homepage teaser. */
export function featuredGalleryItems(limit = 6): GalleryItem[] {
  const all = visibleGalleryItems();
  const featured = all.filter((i) => i.featured);
  return [...featured, ...all.filter((i) => !i.featured)].slice(0, limit);
}

/** Categories that actually have something published, so the filter bar never offers
 *  a tab that leads to an empty wall. `all` is always present. */
export function activeGalleryCategories(): GalleryCategoryMeta[] {
  const present = new Set(visibleGalleryItems().map((i) => i.category));
  return GALLERY_CATEGORIES.filter((c) => c.id === "all" || present.has(c.id));
}

export function galleryCount(): number {
  return visibleGalleryItems().length;
}
