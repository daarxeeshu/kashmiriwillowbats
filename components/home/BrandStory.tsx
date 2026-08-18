import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";

export function BrandStory() {
  return (
    <section className="bg-background">
      <div className="container-main grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <FadeIn className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border">
            <Image
              src="/hero/brand-story.jpg"
              alt="Brand story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </FadeIn>

        <FadeIn>
          <p className="eyebrow">Our brand story</p>
          <h2 className="heading-lg mt-4 text-foreground">
            Built for Kashmir Willow cricket culture
          </h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
            We bring together trusted bat makers and cricket gear brands to
            create a focused multi-brand destination for players who care about
            quality, craftsmanship, and authenticity.
          </p>
          <div className="mt-8">
            <ButtonLink href="/about" variant="outline" size="lg">
              Learn More
            </ButtonLink>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
