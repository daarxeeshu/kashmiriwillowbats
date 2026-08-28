import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";

export function BatExpert() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-main grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <FadeIn className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border">
            <Image
              src="/hero/bat-expert.jpg"
              alt="Bat expert"
              fill
              className="object-cover"
              /* Same two-column geometry as BrandStory: 584px at the container
                 cap, max-w-xl (576px) below lg. See BrandStory for the maths. */
              sizes="(min-width: 1280px) 584px, (min-width: 1024px) calc(50vw - 3.5rem), (min-width: 624px) 576px, calc(100vw - 2rem)"
            />
          </div>
        </FadeIn>

        <FadeIn>
          <p className="eyebrow">Bat expert guidance</p>
          <h2 className="heading-lg mt-4 text-foreground">
            Choose the right willow, profile, and pickup
          </h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
            Get help selecting Kashmir Willow bats based on grain structure,
            weight, pickup, and playing style. Perfect for school cricket,
            club level, and competitive players.
          </p>
          <div className="mt-8">
            <ButtonLink href="/expert-guidance" variant="primary" size="lg">
              Talk to an Expert
            </ButtonLink>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
