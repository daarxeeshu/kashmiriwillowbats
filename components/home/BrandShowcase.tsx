// components/home/BrandShowcase.tsx
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { BrandCoverflow } from "@/components/home/BrandCoverflow";
import { FadeIn } from "@/components/ui/FadeIn";

export function BrandShowcase() {
  /* ── Extra headroom, and only at the top, and only here ────────────────────────
   * This is the one section that follows the hero, and the only place on the page
   * where a section has to introduce itself immediately after a pinned scroll film
   * rather than after another ordinary band of content. `section-padding`'s 4rem is
   * tuned for the latter; against the hero it reads as the next thing arriving rather
   * than a new section beginning.
   *
   * Overriding rather than editing `section-padding` because ten other sections share
   * it and their rhythm is right — the utility stays the site's default and this is a
   * local exception. It works because `section-padding` is declared in
   * `@layer components`, which the cascade places before Tailwind's utilities, so
   * `pt-*` wins without `!important` or a more specific selector.
   *
   * The taper is deliberate. Mobile gains the most (4rem → 6.5rem) because the short
   * viewport is what compresses the hand-off; by `lg` the value returns exactly to the
   * 6rem `section-padding` already gives, since at that width the transition reads as
   * intentional and does not need help. `pb` is untouched — the section below this one
   * is an ordinary neighbour. */
  return (
    <section
      id="shop-by-brand"
      className="section-padding bg-surface-dark pt-[6.5rem] text-white lg:pt-24"
      aria-labelledby="brands-heading"
    >
      <Container>
        <FadeIn className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9a7b4f]">
              Bat manufacturers
            </p>
            <h2
              id="brands-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Bat Brands
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-white/60">
              Explore Kashmir Willow bats from established manufacturers across
              the valley. One destination, multiple craftsmen.
            </p>
          </div>

          <ButtonLink
            href="/brands"
            variant="outline-dark"
            size="sm"
            className="shrink-0"
          >
            View all brands
          </ButtonLink>
        </FadeIn>

        <div className="mt-10">
          <BrandCoverflow />
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          All brands are independent manufacturers based in Kashmir Valley
        </p>
      </Container>
    </section>
  );
}
