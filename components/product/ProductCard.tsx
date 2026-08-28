"use client";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import type { Product } from "@/types/commerce";
import { Badge } from "@/components/ui/Badge";
import {
  PRODUCT_CARD_SIZES,
  ProductImageFrame,
  type ProductImageRatio,
} from "@/components/product/ProductImageFrame";
import { discountPercent, formatPrice, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  /** Above-the-fold cards only. Passed through to the frame's `priority`. */
  priority?: boolean;
  ratio?: ProductImageRatio;
  className?: string;
}

/* ── The product card, everywhere ────────────────────────────────────────────────
 *
 * One component, used by the homepage grid and by every catalogue page (category,
 * brand) through `CatalogProductGrid`. Composition, image logic, actions, badges and
 * information hierarchy all live here, so a change lands in all of them at once —
 * and no page carries its own copy of any of it.
 *
 * ── Surface: liquid glass ──
 * `.product-glass` (globals.css), which is the same construction as the hero's
 * `.hero-glass` with the white values raised: a directional translucent fill, a lit
 * inset hairline along the top edge for thickness, a specular sweep that travels
 * further than the card tilts, and a lift on hover. The hairline is the whole
 * illusion — an even border round a translucent box reads as a flat panel, while one
 * edge catching light reads as a slab with a thickness.
 *
 * ── Why the actions are not hover-only ──
 * The wishlist heart, the quick-view eye and the add-to-cart bar were all
 * `opacity-0 group-hover:opacity-100`. On a touch screen there is no hover, so on a
 * phone those three controls existed in the DOM, were focusable, and were invisible
 * and unusable — the card's entire action set was unreachable. `opacity: 0` leaves a
 * control in the tab order, so a keyboard user could also focus an add-to-cart
 * button they could not see.
 *
 * So the reveal is gated on the *device*, not the breakpoint: the `no-hover:`
 * variant registered in globals.css is `@media (hover: none)` — false on a mouse,
 * true on a touch screen. A pointer device keeps the quiet card that reveals its
 * tools on approach; a touch device gets them permanently. A width breakpoint would
 * get this wrong in both directions: a touch laptop at 1440px would hide them, and a
 * mouse-driven 380px window would show them.
 *
 * The add-to-cart control is the one exception — always visible, at every size and on
 * every input. It is the card's primary action, and it sits in the card body rather
 * than floating over the photograph, which is also what stops it covering the product
 * it is selling. */
export function ProductCard({
  product,
  priority = false,
  ratio = "portrait",
  className,
}: ProductCardProps) {
  const discount =
    product.mrp != null ? discountPercent(product.mrp, product.price) : 0;

  return (
    <article
      className={cn(
        "product-glass group flex flex-col overflow-hidden rounded-xl",
        className,
      )}
    >
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          aria-label={product.name}
        >
          <ProductImageFrame
            src={product.image}
            alt={product.name}
            ratio={ratio}
            priority={priority}
            sizes={PRODUCT_CARD_SIZES}
          />
        </Link>

        {/* `z-[2]` on the overlays, because the glass sheen paints at `z-1`: it
            should travel across the photograph, not across a badge or an icon. */}
        {(product.isPlaceholder || product.badge) && (
          <div className="absolute left-2 top-2 z-[2] flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
            {/* One of the two places in the app that reads `isPlaceholder` — the other
                is the notice on the product page. Deliberately not the `forest`
                variant the marketing badges use: this is not a selling point, and a
                green chip is read as one. The neutral fill and the dashed edge are the
                whole message — provisional, not a claim — and they say it without
                needing a longer word than the 138px card at 2-up on a 320px phone can
                hold. Nothing else about the card changes: a placeholder has to sit in
                the same grid, filter, sort and route as real stock, or the catalogue
                is not actually being tested. */}
            {product.isPlaceholder && (
              <Badge className="border-dashed">Placeholder</Badge>
            )}
            {product.badge && <Badge variant="forest">{product.badge}</Badge>}
          </div>
        )}

        <div className="absolute right-2 top-2 z-[2] flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 no-hover:opacity-100 sm:right-3 sm:top-3">
          {/* These two DO carry `backdrop-blur`: unlike the card, they have
              something behind them to refract — the product photograph and its
              ambient wash. That is glass doing work rather than glass costing GPU
              over a flat background. */}

          {/* A Link, for the same reason the add-to-cart control below is one, and
              the reasoning there now applies here too. There is no wishlist in this
              project: no state, no context, no handler — `/wishlist` is a
              ComingSoonPage. This was a `<button type="button">` with nothing bound
              to it, which was survivable while it took a hover to find. It is no
              longer: the stack above reveals permanently on touch, so on a phone
              every card carried a visible control promising "Add to wishlist" that
              did nothing at all when tapped. So it goes where the site's own answer
              lives. When wishlist state arrives this becomes a `<button>` again with
              a handler, and nothing else here changes.

              The nested span is the target/visual split this codebase already uses
              for the carousel dots: the anchor is the 44px touch target, the span
              inside it is the 32px chip you can see. A 44px chip would take a
              quarter of the width of a 166px photograph at 2-up on a 375px phone,
              and 32px is already past the 24px WCAG floor — so the fix is to grow
              the target, not the graphic. `-m-1.5` gives back the 6px the larger
              box would otherwise push the chip in from the corner, so the chip
              stays exactly where it sits today. Both are `no-hover:`, so a pointer
              device gets a box that shrink-wraps the chip: unchanged, to the pixel. */}
          <Link
            href="/wishlist"
            className="group/wish flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent no-hover:-m-1.5 no-hover:size-11"
            aria-label={`Add ${product.name} to wishlist`}
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white/85 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_12px_-4px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors group-hover/wish:border-white/35 group-hover/wish:bg-white/20 group-hover/wish:text-accent-hover sm:size-9">
              <Heart className="size-4" />
            </span>
          </Link>
          {/* Quick view is a shortcut to the page the card's image and title
              already link to, so on a phone — where it would sit permanently over
              a 138px-wide photograph — it is redundant rather than useful. Hidden
              on touch, kept on hover devices where it costs nothing at rest. */}
          <Link
            href={`/products/${product.slug}`}
            className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white/85 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_12px_-4px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors hover:border-white/35 hover:bg-white/20 hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent no-hover:hidden sm:size-9"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="size-4" />
          </Link>
        </div>
      </div>

      {/* `z-[2]` lifts the whole info region above the sheen so the text keeps its
          contrast. The top hairline separates it from the photograph the way the
          card's own top edge separates the card from the page — same language, one
          step quieter. */}
      <div className="relative z-[2] flex flex-1 flex-col border-t border-white/10 bg-white/[0.04] p-3 sm:p-4">
        {/* `truncate`, because at 2-up on a small phone "Kashmir Ideal Sports"
            wraps to two lines and every card in the row then has to be as tall as
            the longest brand name.

            Dropped entirely for a product with no brand rather than reserved with a
            `min-h`, which is the opposite of what the name and discount lines below
            do — and deliberately. Those two reserve because their *neighbours* have
            content there and a row has to stay aligned. Brand is absent for a whole
            category at a time, so reserving would put an identical empty gold line
            above all four cards for nobody. Price and button stay aligned regardless:
            `mt-auto` pins them to the bottom of a stretched card. */}
        {product.brandName && (
          <p className="truncate text-[12px] font-semibold tracking-wide text-accent">
            {product.brandName}
          </p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {/* Clamped to two lines, and `min-h` reserves both of them whether or not
              the name needs them. That combination is what keeps a row aligned
              (§8, §10): names here run from "Ace 200" to "M&H7000+ Players
              Edition", so without the clamp one long name sets the row's height,
              and without the reserve a one-line name pulls its own price and button
              up out of line with its neighbour's. */}
          <h3 className="mt-1 line-clamp-2 min-h-[2lh] text-[13px] font-semibold leading-snug tracking-tight text-white transition-colors group-hover:text-accent-hover sm:text-base">
            {product.name}
          </h3>
        </Link>

        {/* `mt-auto` pins price and button to the bottom, so a card whose name
            resolves to one line still lines its controls up with the rest. */}
        <div className="mt-auto pt-3">
          {/* A deterministic two-line price region, and the reason is measured: as
              one `flex-wrap` row this reflowed on digit count. A 5-digit price
              ("₹11,499 ₹12,999 12% off") broke onto three baselines and stood 43px
              tall, while a 4-digit one broke onto two and stood 23px — so the top
              row of the grid sat 20px taller than every row below it purely because
              its bats cost more. Splitting it fixes the height at two lines
              whatever the digits: price and struck MRP on one, the discount on its
              own. `min-h-[1lh]` holds the second line open even for a product with
              no MRP, so a full-price item still aligns with a discounted one. */}
          <div className="flex items-baseline gap-x-2">
            <span className="text-[15px] font-semibold text-white sm:text-base">
              {formatPrice(product.price)}
            </span>
            {product.mrp != null && product.mrp > product.price && (
              <span className="truncate text-[12px] text-white/45 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>
          <p className="mt-0.5 min-h-[1lh] text-[12px] font-semibold leading-normal text-success">
            {discount > 0 ? `${discount}% off` : ""}
          </p>

          {/* Persistent, on every device — this is the control that used to be a
              hover-only bar across the bottom of the photograph, moved into the body
              and given a resting state.

              It was a Link to `/cart` because there was no cart to add to: the page
              was a ComingSoonPage and a `<button>` here would have done nothing. The
              note left then said this becomes a button again once cart state exists,
              with nothing else changing — and that is exactly what happened. The
              classes below are the ones it already had; only the element and the
              handler are new. */}
          <AddToCartButton
            slug={product.slug}
            name={product.name}
            className={cn(
              "mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg",
              /* Frosted rather than the flat cream slab this was. A solid
                 near-white block is the one element that would refuse to join the
                 glass system — it stops the light instead of transmitting it. */
              "border border-white/25 bg-white/14 text-[12px] font-semibold tracking-wide text-white",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.32)] backdrop-blur-md",
              "transition-colors hover:border-white/40 hover:bg-white/22",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          />
        </div>
      </div>
    </article>
  );
}
