import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { PRODUCT_GRID_LADDER } from "@/components/product/ProductCardGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StaggerGrid, StaggerItem } from "@/components/ui/FadeIn";

/* ── Hard Tennis Bat, on the home page ────────────────────────────────────────────
 *
 * Two states from one component, chosen by the data rather than by an edit here:
 *
 *   products in the category   →  a showcase row, four cards, "view all"
 *   none, and `comingSoon`     →  the category introduction with a launch panel
 *
 * That is what makes it configurable in the sense the brief asks for. Nothing about
 * this file has to change when the first products are added to `data/products.ts` with
 * `categorySlug: "hard-tennis-bats"` — the row appears, the launch panel goes away,
 * and the "view all" button starts pointing at a populated catalogue.
 *
 * The cards are `ProductCard` and the columns are `PRODUCT_GRID_LADDER`, the same two
 * things every other product surface in the app uses, so a Hard Tennis Bat card is
 * indistinguishable from a Kashmir Willow one — including the image frame that fits
 * rather than crops, which is what carries the brief's requirement about tall and
 * angled bat photography. It is inherited, not reimplemented.
 *
 * `StaggerGrid` rather than `ProductCardGrid` for the same reason `ProductGrid` uses
 * it: the homepage animates its sections in on scroll and the catalogue pages must not
 * pay framer-motion's weight for an animation they do not run. One ladder, two
 * wrappers. */

const CATEGORY_SLUG = "hard-tennis-bats";
const SHOWCASE_LIMIT = 4;

export function HardTennisBats() {
  const category = getCategoryBySlug(CATEGORY_SLUG);
  if (!category) return null;

  const href = `/categories/${category.slug}`;
  const products = getProductsByCategory(CATEGORY_SLUG).slice(0, SHOWCASE_LIMIT);
  const hasProducts = products.length > 0;

  return (
    <section
      className="section-padding bg-background"
      aria-labelledby="hard-tennis-bat-heading"
    >
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2 text-accent">Hard tennis cricket</p>
            {/* Sized here rather than through `SectionHeading`, which applies a
                `heading-lg` class that is not defined in any stylesheet in this
                project. Matching `CategoryCarousel`'s explicit ramp instead keeps this
                section the same size as its neighbours. */}
            <h2
              id="hard-tennis-bat-heading"
              className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              Hard Tennis Bat
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
              Built for hard tennis-ball cricket. Designed for power, control and
              fast-paced play.
            </p>
          </div>

          {/* Only alongside a populated row. With nothing to view, "view all" is a
              button that leads to an empty page — the launch panel below carries the
              link in that case, and says what is at the other end of it. */}
          {hasProducts && (
            <ButtonLink
              href={href}
              variant="outline-dark"
              size="md"
              className="shrink-0 self-start sm:self-auto"
            >
              View all Hard Tennis Bats
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          )}
        </div>

        {hasProducts ? (
          <StaggerGrid className={PRODUCT_GRID_LADDER}>
            {products.map((product) => (
              <StaggerItem key={product.id} className="h-full">
                <ProductCard product={product} className="h-full" />
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          /* §19's controlled state. Not an empty grid, and not placeholder cards with
             invented names and prices — the category is introduced honestly and the
             one thing a customer can usefully do about it today is offered. */
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="grid items-center gap-0 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[240px]">
                <Image
                  src={category.image}
                  // Decorative: the heading above and the copy beside it both name
                  // the category, and the graphic adds no information a screen
                  // reader needs.
                  alt=""
                  fill
                  sizes="(min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/80 sm:to-surface"
                />
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  Launching soon
                </p>
                <p className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
                  Our first Hard Tennis Bat collection is on its way.
                </p>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                  We are finalising weights, profiles and grades now. See what is
                  coming, or ask our bat expert to reserve one before it is listed.
                </p>
                <ButtonLink
                  href={href}
                  variant="expert"
                  size="md"
                  className="mt-6"
                >
                  See what&apos;s coming
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
