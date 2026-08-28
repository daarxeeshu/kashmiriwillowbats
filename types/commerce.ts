export interface Brand {
  id: string;
  slug: string;
  name: string;
  descriptor?: string;
  logo?: string;
  image?: string;
  productCount?: number;
  isFlagship?: boolean;
}

export type CategoryIconKey =
  | "kashmir-willow"
  | "english-willow"
  | "hard-tennis"
  | "gloves"
  | "pads"
  | "thigh-guard"
  | "helmet"
  | "ball"
  | "shoes"
  | "bag"
  | "accessories";

export type CategoryAccent = "forest" | "brass" | "charcoal" | "sage" | "warm";

export interface Category {
  id: string;
  slug: string;
  name: string;
  descriptor: string;
  image: string;
  iconKey: CategoryIconKey;
  accent: CategoryAccent;
  /** Longer copy for the catalogue page header. `descriptor` has to stay short
   *  enough for a 200px carousel card, which is too short to introduce a category
   *  someone has just navigated to. Falls back to `descriptor` when absent. */
  catalogueDescription?: string;
  /** The `<meta name="description">`, when it should differ from the on-page copy.
   *  A page header introduces a category to someone already looking at it; a search
   *  result has to earn the click, so it leads with the verb and carries the terms
   *  people actually search for. Falls back to `catalogueDescription`, then
   *  `descriptor`, so a category only needs this when the two genuinely differ. */
  seoDescription?: string;
  /** Announced-but-not-yet-stocked. Switches the catalogue page and the homepage
   *  section to a coming-soon state instead of an empty grid, and is what makes that
   *  behaviour configurable rather than inferred from a zero count — a category can
   *  legitimately be live with nothing in stock today, which is a different message
   *  from one that has not launched. */
  comingSoon?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Optional, because a product can legitimately arrive without one. The Hard Tennis
   *  Bat range was supplied as names and prices with no brand attribution, and the
   *  honest options were to leave this out or to guess — a guess would print a brand
   *  claim on the card, the detail page, the page title and a brand listing. Every
   *  reader below treats absence as "no brand" and renders nothing rather than
   *  "undefined": the card drops its eyebrow line, the detail page drops its brand
   *  link, and the brand filter ignores the product instead of offering an empty
   *  option. Supplying both fields later is a two-line change per product with no
   *  component edits. */
  brandSlug?: string;
  brandName?: string;
  image: string;
  mrp?: number;
  price: number;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  categorySlug: string;
  featured?: boolean;
  flagship?: boolean;
  /** Development placeholder, not real inventory: an invented name against an invented
   *  price, standing in until the eight equipment categories are stocked.
   *
   *  One flag on the record rather than placeholder logic spread through the UI. It is
   *  read in exactly two places — the badge on `ProductCard` and the notice on the
   *  product detail page — and by nothing else: it deliberately does not gate routing,
   *  filtering, sorting or metadata, because a placeholder has to exercise the same
   *  paths real inventory will. Replacing the set is deleting
   *  `data/placeholder-products.ts` and `public/products/placeholders/`; converting one
   *  to real stock is dropping this line and the photograph. Neither touches a
   *  component. */
  isPlaceholder?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  code?: string;
  highlight?: string;
  /* ── The machine-readable half ──
   * `highlight` is the words on the card ("10% OFF"); these are what the checkout
   * actually computes with. They are separate fields rather than something parsed back
   * out of the string because a discount derived by regex from display copy breaks the
   * moment somebody rewrites the copy - and it would break silently, in the direction
   * of charging the wrong amount. */
  /** Percentage off the subtotal. */
  percentOff?: number;
  /** Minimum number of items in the cart before the code applies. */
  minItems?: number;
  /** Waives delivery. Nothing is charged for shipping in this flow, so this only
   *  changes what the order says - the figure is still agreed on WhatsApp. */
  freeShipping?: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  href?: string;
}

export interface TrustPoint {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Benefit {
  id: string;
  label: string;
  icon: string;
}

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  /** Listed in the mobile drawer, kept out of the desktop header row.
   *
   *  The two surfaces have opposite constraints and this is what lets one entry
   *  answer to both: the header row is a single 64px bar competing for width with
   *  the logo lock-up, two service buttons and the icon cluster, while the drawer
   *  is a vertical list where another line costs nothing. A destination that is
   *  reachable elsewhere — the footer carries both of today's — can therefore come
   *  out of the row without coming out of the site.
   *
   *  Deliberately a property of the entry rather than a list of hrefs inside
   *  `Header`, so the decision reads where the nav is defined and a route that is
   *  renamed cannot quietly reappear in the bar. */
  drawerOnly?: boolean;
}

/** A labelled set of destinations: a dropdown in the desktop header, a titled block
 *  in the mobile drawer. `items` is the discriminant — an entry either navigates
 *  somewhere itself or opens a group, never both, so callers narrow with
 *  `"items" in entry` and no type guard is needed. */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}
