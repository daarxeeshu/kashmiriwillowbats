import Image from "next/image";
import Link from "next/link";
import { getFlagshipProducts } from "@/data/products";
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
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
              className="group block overflow-hidden rounded-sm border border-white/10 bg-white/5"
            >
              <div className="relative aspect-[16/10] studio-bg">
                <Image
                  src={hero.image}
                  alt={hero.name}
                  fill
                  className="object-contain object-center p-[10%] transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-white/10 p-5">
                <div>
                  <p className="text-[11px] font-semibold text-accent">{hero.brandName}</p>
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
              className="group flex items-center gap-4 rounded-sm border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-white/90">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                  sizes="64px"
                />
              </div>
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
