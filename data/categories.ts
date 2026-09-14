import type { Category } from "@/types/commerce";

export const categories: Category[] = [
  {
    id: "kashmir-willow-bats",
    slug: "kashmir-willow-bats",
    name: "Kashmir Willow Bats",
    descriptor: "Authentic valley willow for every level",
    image: "/categories/kashmir-willow.webp",
    iconKey: "kashmir-willow",
    accent: "forest",
  },
  {
    id: "english-willow-bats",
    slug: "english-willow-bats",
    name: "English Willow Bats",
    descriptor: "Premium grade English willow",
    /* Both lines describe the grade ladder rather than making a claim about any one
       bat, because the grade *is* what distinguishes the five products in this
       category and it is the only thing about them established so far. Same split as
       Hard Tennis Bat above: this one introduces the category to someone already on
       the page, the next has to win a click from a search result. */
    catalogueDescription:
      "Explore our English willow range, graded from Player Grade 1+ through Grade 4.",
    seoDescription:
      "Shop English willow cricket bats graded from Player Grade 1+ to Grade 4 at Kashmiri Willow Bats.",
    image: "/categories/english-willow.webp",
    iconKey: "english-willow",
    accent: "brass",
  },
  {
    id: "hard-tennis-bats",
    // Plural, and `/categories/`-prefixed, because that is this project's existing
    // convention for every other category — `kashmir-willow-bats`,
    // `english-willow-bats`. A bare `/hard-tennis-bat` would be the only category
    // route in the app that did not live under `/categories`, and the brief is
    // explicit that an established routing convention wins. The display name below
    // is the singular "Hard Tennis Bat" the brief specifies; the slug is a URL, not
    // a label, and the two are allowed to differ.
    slug: "hard-tennis-bats",
    name: "Hard Tennis Bat",
    descriptor: "Power built for hard tennis cricket",
    catalogueDescription:
      "Explore our collection of hard tennis bats built for power, durability and control.",
    // Deliberately not the same sentence as the one above. The page header introduces
    // the category to someone already on it; this one has to win a click from a search
    // result, so it leads with "Shop" and carries "tennis-ball cricket", which is what
    // people type.
    seoDescription:
      "Shop hard tennis bats designed for power, control and fast-paced tennis-ball cricket.",
    image: "/categories/hard-tennis-bat.webp",
    iconKey: "hard-tennis",
    accent: "charcoal",
  },
  /* ── Equipment ────────────────────────────────────────────────────────────────
   *
   * The eight non-bat categories. Each now carries the two-line copy split the bat
   * categories above already use: `catalogueDescription` is the supplied line, printed
   * under the catalogue heading for someone already on the page, and `seoDescription`
   * is written to win a click from a search result — so it leads with "Shop" and
   * carries the words people actually type ("wicketkeeping", "leg guards", "kit bag").
   * `descriptor` stays as it is, because it has to fit a 200px carousel card.
   */
  {
    id: "batting-gloves",
    slug: "batting-gloves",
    name: "Batting Gloves",
    descriptor: "Protection with feel and flexibility",
    catalogueDescription: "Grip, protection and control for every delivery.",
    seoDescription:
      "Shop cricket batting gloves built for grip, protection and control at Kashmiri Willow Bats.",
    image: "/categories/batting-gloves.jpg",
    iconKey: "gloves",
    accent: "warm",
  },
  {
    id: "batting-pads",
    slug: "batting-pads",
    name: "Batting Pads",
    descriptor: "Lightweight, durable leg guards",
    catalogueDescription: "Protection, mobility and comfort for every innings.",
    seoDescription:
      "Shop cricket batting pads and leg guards balancing protection, mobility and comfort.",
    image: "/categories/batting-pads.webp",
    iconKey: "pads",
    accent: "charcoal",
  },
  {
    id: "cricket-bags",
    // The slug stays `cricket-bags` while the display name becomes "Cricket Kit Bags".
    // Same reasoning as `hard-tennis-bats` above: the slug is a URL and the name is a
    // label, and renaming the URL would break the existing `/categories/cricket-bags`
    // route, its prerendered page and any link already pointing at it — to no reader's
    // benefit, since nothing about the label is derived from the slug.
    slug: "cricket-bags",
    name: "Cricket Kit Bags",
    descriptor: "Kit bags for every cricketer",
    catalogueDescription:
      "Carry your complete game-day setup with purpose-built cricket bags.",
    seoDescription:
      "Shop cricket kit bags, wheelie bags and duffles built to carry a complete game-day setup.",
    image: "/categories/cricket-bags.webp",
    iconKey: "bag",
    accent: "charcoal",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
