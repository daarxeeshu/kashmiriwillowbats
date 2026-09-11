import type { Metadata } from "next";
import Link from "next/link";
import { Camera } from "lucide-react";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { GalleryWall } from "@/components/gallery/GalleryWall";
import {
  activeGalleryCategories,
  galleryCount,
  visibleGalleryItems,
} from "@/data/gallery";
import { resolveBatNames } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Wall of Fame",
  description:
    "Players who trust Kashmiri Willow Bats — from international stages to the grounds of Kashmir, and the customers who play with our bats every week.",
};

export default function WallOfFamePage() {
  const items = visibleGalleryItems();
  const categories = activeGalleryCategories();
  const batNames = resolveBatNames(items);

  return (
    <section className="bg-surface-dark text-white" aria-labelledby="wof-heading">
      <Container className="section-padding">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Wall of Fame" }]}
        />

        <FadeIn className="mt-6 max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9a7b4f]">
            Wall of Fame
          </p>
          <h1
            id="wof-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Players. Passion. Kashmir.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            From international stages to the grounds of Kashmir, every player who trusts
            our bats deserves to be seen.
          </p>
          <p className="mt-3 text-sm text-white/40">
            {galleryCount()} on the wall — and counting.
          </p>
        </FadeIn>

        <div className="mt-10">
          <GalleryWall items={items} categories={categories} batNames={batNames} />
        </div>

        {/* ── Submission CTA ── */}
        <FadeIn className="mt-14">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              Want to be on our Wall of Fame?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
              Brought a KW bat onto the ground? Send us your photograph and become part
              of the Kashmiri Willow Bats community.
            </p>
            <ButtonLink
              href="/wall-of-fame/submit"
              variant="primary"
              size="lg"
              className="mt-6 w-full sm:w-auto"
            >
              <Camera className="size-4" />
              Submit your photo
            </ButtonLink>
            <p className="mt-4 text-xs leading-relaxed text-white/35">
              Players under 18 need a parent or guardian to send the photograph and give
              permission. Nothing is published until we have that and have reviewed it —
              see{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-white/60"
              >
                our privacy policy
              </Link>
              .
            </p>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
