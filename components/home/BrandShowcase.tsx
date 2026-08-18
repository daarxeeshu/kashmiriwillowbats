// components/home/BrandShowcase.tsx
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { BrandGrid } from "@/components/home/BrandGrid";
import { FadeIn } from "@/components/ui/FadeIn";

export function BrandShowcase() {
  return (
    <section
      id="shop-by-brand"
      className="section-padding bg-surface-dark text-white"
      aria-labelledby="brands-heading"
    >
      <Container>
        <FadeIn className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7b4f]">
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
          <BrandGrid />
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          All brands are independent manufacturers based in Kashmir Valley
        </p>
      </Container>
    </section>
  );
}
