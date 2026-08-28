import Link from "next/link";
import { getFlagshipProducts } from "@/data/products";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export function KISFeatured() {
  const [hero, ...supporting] = getFlagshipProducts().slice(0, 4);

  if (!hero) return null;

  return (
    <section
      className="relative overflow-hidden bg-forest text-white"
      aria-labelledby="kis-heading"
    >
      <div
        className="absolute inset-0 opacity-[0.07] willow-grain"
        aria-hidden="true"
      />

      <Container className="relative section-padding">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <FadeIn>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
              Flagship brand
            </p>
            <h2 id="kis-heading" className="heading-lg mt-3 text-white">
              KIS Unstoppable
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
              Engineered for players who don&apos;t compromise. Manufactured,
              stocked, and shipped from our Kashmir operations.
            </p>
            <ButtonLink
              href="/brands/kis"
              variant="outline-dark"
              size="lg"
              className="mt-8"
            >
              Shop KIS
            </ButtonLink>
          </FadeIn>

          <FadeIn delay={0.08}>
            <Link
              href={`/products/${hero.slug}`}
              className="product-glass group block overflow-hidden rounded-xl"
            >
              {/* The shared frame. This panel is where the derive-the-backdrop-from-
                  the-image technique was first worked out by hand — a blurred
                  cover-cropped copy of the same file filling the letterbox that
                  `object-contain` always left. It now lives in
                  `ProductImageFrame` and every product image in the app gets it,
                  so this is the same composition as a card, one size up. */}
              <ProductImageFrame
                src={hero.image}
                alt={hero.name}
                ratio="square"
                sizes="(min-width: 1280px) 656px, (min-width: 1024px) 55vw, calc(100vw - 3rem)"
              />
              <div className="relative z-[2] flex items-end justify-between gap-4 border-t border-white/10 bg-white/[0.04] p-5">
                <div>
                  <p className="text-[12px] font-semibold text-accent">{hero.brandName}</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">{hero.name}</h3>
                </div>
                <p className="text-lg font-semibold">{formatPrice(hero.price)}</p>
              </div>
            </Link>
          </FadeIn>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {supporting.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              {/* Same frame again, at rail scale. This was `h-20 w-16` on
                  `bg-white/90` — an arbitrary fixed height (§3) and a fourth
                  background treatment for the same eight images, which put the two
                  cream placeholders on white and the dark JPEG in a white box.
                  `w-16` with the portrait ratio resolves to the identical 64×80,
                  so the layout is unchanged; only the composition is now shared. */}
              <ProductImageFrame
                src={product.image}
                alt={product.name}
                ratio="portrait"
                sizes="64px"
                className="w-16 shrink-0 rounded-md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="mt-0.5 text-sm text-white/70">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
