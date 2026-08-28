import type { Announcement, Benefit, NavEntry, TrustPoint } from "@/types/commerce";

export const siteConfig = {
  name: "Kashmiri Willow Bats",
  shortName: "KWB",
  domain: "kashmiriwillowbats.com",
  url: "https://kashmiriwillowbats.com",
  description:
    "Authentic Kashmir Willow bats and professional cricket equipment. Multi-brand cricket store from Kashmir — KIS, JK, Valleywoods, SLS, Woodford & more.",
  tagline: "The Home of Kashmiri Willow",
  engraving: {
    price: 200,
    freeThreshold: 6000,
  },
  /** The only support address this site publishes. Anything that needs a human goes
   *  here or to WhatsApp — there is no second inbox and none should be invented. */
  supportEmail: "kashmiriwillowbats@gmail.com",
  /** Country code first, digits only — the format wa.me expects. Overridable per
   *  environment with NEXT_PUBLIC_WHATSAPP_NUMBER; this is the default so the site
   *  works without env setup. Read only through `lib/whatsapp.ts`. */
  whatsappNumber: "917006399534",
  /* WhatsApp is deliberately not in here: it is a contact channel rather than a
     social profile, and it has its own field above so there is exactly one place the
     number lives. */
  social: {
    handle: "kashmiriwillowbats",
    instagram: "https://instagram.com/kashmiriwillowbats",
    facebook: "https://facebook.com/kashmiriwillowbats",
  },
} as const;

/* ── Physical stores ──────────────────────────────────────────────────────────────
 *
 * Town and role only. Street addresses, phone numbers, opening hours and map links are
 * deliberately absent rather than guessed: a wrong address on a shop page sends a
 * customer on a wasted journey, which is worse than a page that says "Sangam,
 * Bijbehara" and invites a message. Add the fields here when the business supplies
 * them and every consumer picks them up. */
export interface StoreLocation {
  id: string;
  /** Town or locality, as the business states it. */
  name: string;
  area?: string;
  /** Filled in only when the business provides it — never inferred. */
  addressLine?: string;
  hours?: string;
  mapUrl?: string;
}

export const mainStore: StoreLocation = {
  id: "sangam-bijbehara",
  name: "Sangam, Bijbehara",
  area: "Anantnag district, Kashmir Valley",
};

export const subStores: StoreLocation[] = [
  { id: "kulgam", name: "Kulgam", area: "Kashmir Valley" },
  { id: "srinagar", name: "Srinagar", area: "Kashmir Valley" },
];

/** Rotating announcement bar — later sourced from CMS/database */
export const announcements: Announcement[] = [
  {
    id: "free-shipping",
    message: "Free shipping on prepaid orders",
    href: "/offers",
  },
  {
    id: "free-engraving",
    message: "Free engraving above ₹6,000",
    href: "/customize",
  },
  {
    id: "bat-expert",
    message: "24/7 bat expert support",
    href: "#bat-expert",
  },
];

/* ── The main navigation ──────────────────────────────────────────────────────────
 *
 * The three bat categories are grouped rather than listed flat, and the reason is
 * measured. At 1024px — the width the desktop row first appears at — eight top-level
 * items need 729px of the 730px available: a one-pixel margin, which is not a fit. It
 * was already worse than that before the grouping, because the items were being
 * squeezed below their own text width: "Kashmir Willow", "English Willow" and "Bat
 * Doctor" each wrapped onto two lines inside a 64px header bar.
 *
 * Grouped, the row asks for 444px and nothing wraps at any width. Nothing was removed
 * to get there — all three categories keep their own labels and their own routes, and
 * the mobile drawer lists them flat under a heading, where vertical space is free. */
export const mainNav: NavEntry[] = [
  { label: "Home", href: "/" },
  {
    label: "Bats",
    items: [
      { label: "Kashmir Willow", href: "/categories/kashmir-willow-bats" },
      { label: "English Willow", href: "/categories/english-willow-bats" },
      // Third bat category, and it belongs with the other two rather than under
      // Equipment — a hard tennis bat is a bat, not an accessory.
      { label: "Hard Tennis Bat", href: "/categories/hard-tennis-bats" },
    ],
  },
  // Drawer-only, with Offers below. Both keep their routes and their place in the
  // mobile list; what they give up is a slot in the desktop row, which is the surface
  // that ran out of width once Bat Doctor was promoted to a button beside Bat Expert.
  // The footer's "Shop" column carries both, so neither is orphaned.
  { label: "Equipment", href: "/categories/cricket-equipment", drawerOnly: true },
  { label: "Brands", href: "/brands" },
  // A service, not a category — the only item here that sells labour rather than
  // stock. `highlight` is what the header and the drawer read to give it the gold
  // treatment; it was already declared on `NavItem` and unused until now.
  { label: "Bat Doctor", href: "/bat-doctor", highlight: true },
  { label: "Offers", href: "/offers", drawerOnly: true },
];

export const trustPoints: TrustPoint[] = [
  {
    id: "authentic",
    title: "Authentic Products",
    description: "Multiple established cricket brands from Kashmir's cricket hub.",
    icon: "shield-check",
  },
  {
    id: "expert",
    title: "Expert Bat Selection",
    description: "Speak directly with cricket specialists who know willow, weight, and pickup.",
    icon: "message-circle",
  },
  {
    id: "engraving",
    title: "Custom Engraving",
    description: "Laser name engraving on-site — personalize your bat before dispatch.",
    icon: "pen-tool",
  },
  {
    id: "delivery",
    title: "Safe Delivery",
    description: "Professional packaging, toe protection, and bat cover included.",
    icon: "package",
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "WhatsApp assistance whenever you need help choosing or tracking.",
    icon: "headphones",
  },
  {
    id: "proof",
    title: "Real Customer Proof",
    description: "Unboxing and ping-test videos from verified buyers.",
    icon: "video",
  },
];

export const includedBenefits: Benefit[] = [
  { id: "cover", label: "Free Bat Cover", icon: "shield" },
  { id: "toe", label: "Free Toe Protection", icon: "footprints" },
  { id: "delivery", label: "Safe Delivery", icon: "truck" },
  { id: "support", label: "Expert Support", icon: "users" },
  { id: "prep", label: "Fresh Bat Preparation", icon: "sparkles" },
];
