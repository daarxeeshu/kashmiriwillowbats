import type { Product } from "@/types/commerce";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

interface ProductCardGridProps {
  products: Product[];
  /** Number of leading cards to mark `priority`. Above-the-fold count differs by
   *  context — a catalogue page shows a full row immediately, a homepage section
   *  sits below the hero and needs none. */
  priorityCount?: number;
  className?: string;
}

/* ── The one product-card grid ────────────────────────────────────────────────────
 *
 * The column ladder lived in two places and they disagreed: the homepage ran
 * `grid-cols-2 lg:grid-cols-4` while the catalogue ran
 * `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — 1-up on a phone, and a 3-up step
 * the homepage never had. That is not just an inconsistency: `ProductCard`'s `sizes`
 * attribute is a single string describing "the grid this card is in", so with two
 * different ladders it was necessarily wrong for one of them. On a 1024px catalogue
 * page at 3-up it claimed 25vw and shipped images a third too small.
 *
 * One ladder, quoted by one `sizes` constant:
 *
 *     0            640          768          1024               ∞
 *     ├─── 2-up ────┼──── 2-up ───┼─── 3-up ───┼────── 4-up ─────┤
 *     │  gap 12px   │  gap 16px   │  gap 16px  │    gap 16px     │
 *     │  138–301px  │             │  ~224px    │    224–448px    │
 *
 * 2-up from the smallest width, because 1-up meant a single 4:5 image plus a body
 * filled a phone viewport end to end — browsing eight bats took eight full scroll
 * pages and no two products were ever visible together, which defeats the entire
 * purpose of a listing grid. The tighter gutter below 640px is there because at 2-up
 * on a 320px screen every pixel of gap comes straight out of the card.
 *
 * The 3-up step at 768 exists because without it the tablet band was the one place
 * the ladder misbehaved, and measurably: 2-up on a 768px viewport gives a 344px card
 * with a 429px-tall image, and then at 1024 the card *shrinks* to 224px. Cards
 * growing to their largest size on the second-smallest layout and then contracting is
 * a discontinuity, not a ladder. With 3-up at 768 the card holds ~224px from 768
 * right through 1024 and only grows past that, so the progression is monotonic and a
 * tablet gets a browsable three-across grid instead of two posters.
 *
 * `items-stretch` plus `h-full` on the card is what makes every card in a row the
 * same height regardless of its name length or source-image ratio (§8).
 *
 * The ladder is exported as a string because the homepage needs the same columns
 * wrapped in `StaggerGrid` for its scroll entrance, and `StaggerGrid` is a
 * framer-motion client component — importing it here would push framer into every
 * catalogue page's bundle for an animation those pages do not use. So there are two
 * wrappers and exactly one ladder, quoted by both, which cannot drift apart. The
 * `PRODUCT_CARD_SIZES` contract in `ProductImageFrame` describes this string. */
export const PRODUCT_GRID_LADDER =
  "grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4";

export function ProductCardGrid({
  products,
  priorityCount = 0,
  className,
}: ProductCardGridProps) {
  return (
    <div className={cn(PRODUCT_GRID_LADDER, className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
          className="h-full"
        />
      ))}
    </div>
  );
}
