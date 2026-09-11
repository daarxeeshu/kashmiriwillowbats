import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { GalleryWall } from "@/components/gallery/GalleryWall";
import { activeGalleryCategories, featuredGalleryItems } from "@/data/gallery";
import { resolveBatNames } from "@/lib/gallery";

/* The homepage teaser: eight faces and a way through to the full wall.
 *
 * It runs the same `GalleryWall` as the dedicated page rather than a second, simpler
 * grid — the filter row, the lightbox and the focal-point handling are the parts most
 * likely to drift if they existed twice. What differs is only what is passed in: a
 * short, featured-first slice, and `emphasiseFeatured` off, because a 2x2 hero tile in
 * an eight-tile teaser unbalances the row it is in.
 *
 * Placed after the customer-proof sections and before the closing brand story: it is
 * social proof, so it belongs with the other evidence rather than interrupting the
 * product run at the top of the page. */
export function WallOfFame() {
  const items = featuredGalleryItems(8);
  const categories = activeGalleryCategories();
  const batNames = resolveBatNames(items);

  if (items.length === 0) return null;

  return (
    <section
      className="section-padding bg-surface-dark text-white"
      aria-labelledby="wall-of-fame-heading"
    >
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            titleId="wall-of-fame-heading"
            eyebrow="Wall of Fame"
            title="Players. Passion. Kashmir."
            description="From international stages to the grounds of Kashmir, every player who trusts our bats deserves to be seen."
            dark
          />
          <FadeIn>
            <ButtonLink
              href="/wall-of-fame"
              variant="outline-dark"
              size="sm"
              className="shrink-0"
            >
              View the wall
              <ArrowRight className="size-4" />
            </ButtonLink>
          </FadeIn>
        </div>

        <FadeIn className="mt-10">
          <GalleryWall
            items={items}
            categories={categories}
            batNames={batNames}
            emphasiseFeatured={false}
          />
        </FadeIn>
      </Container>
    </section>
  );
}
