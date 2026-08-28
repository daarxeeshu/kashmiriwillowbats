"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { brands } from "@/data/brands";
import { ButtonLink } from "@/components/ui/Button";
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";

/**
 * Last-resort cover for a brand added without artwork, as a data URI so a
 * missing asset can never become a missing file. Every brand in `data/brands.ts`
 * currently has an image — either a photograph or a generated cover from
 * `scripts/generate-brand-covers.mjs` — so nothing reaches this today. A new
 * brand should get its own entry in that script rather than land here: this is a
 * safety net, and it is the one card that will not be visually distinct.
 */
function initialsCover(name: string): string {
  // Split on whitespace first. `slice(0, 2)` on "A Star" yields "A " — the bug
  // that put a trailing space in the old a-star placeholder.
  const words = name.split(/\s+/).filter(Boolean);
  const initials = (
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : name.replace(/[^A-Za-z]/g, "").slice(0, 2)
  )
    .slice(0, 3)
    .toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">` +
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="#1e2a22"/><stop offset="100%" stop-color="#12100e"/>` +
    `</linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<text x="50%" y="50%" fill="#ffffff" fill-opacity="0.16" text-anchor="middle" ` +
    `dominant-baseline="central" font-family="system-ui,sans-serif" font-size="200" ` +
    `font-weight="600" letter-spacing="8">${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function BrandCoverflow() {
  const slides = useMemo<CoverflowSlide[]>(
    () =>
      brands.map((brand) => ({
        src: brand.image ?? initialsCover(brand.name),
        alt: `${brand.name} Kashmir Willow cricket bats`,
        title: brand.name,
        subtitle: brand.descriptor,
        label: brand.name,
        href: `/brands/${brand.slug}`,
      })),
    [],
  );

  // KIS is the flagship, so it opens centred. Read off the flag rather than the
  // array position or the slug: KIS happens to be first in `data/brands.ts`
  // today, and a reorder must not quietly slide it out of the centre. Same
  // source of truth as `getFlagshipBrand()`. Falls back to the first brand.
  const flagshipIndex = Math.max(
    0,
    brands.findIndex((brand) => brand.isFlagship),
  );

  const [selected, setSelected] = useState(flagshipIndex);
  const active = brands[selected];

  /* Tapping the centred cover opens that brand. The carousel reports the tap rather
     than navigating itself, so the push happens here, through the router — the card's
     own `<a>` is what a crawler and a ⌘-click see, but a plain click on it would be a
     full document load, and this is a client-side navigation. */
  const router = useRouter();
  const openBrand = useCallback(
    (index: number) => {
      const brand = brands[index];
      if (brand) router.push(`/brands/${brand.slug}`);
    },
    [router],
  );

  return (
    <div className="flex flex-col items-center">
      <CoverflowCarousel
        slides={slides}
        label="Bat brands"
        showCaption
        showNavigation
        showPagination
        initialIndex={flagshipIndex}
        onSelect={setSelected}
        onActivate={openBrand}
        cardWidth="clamp(160px, 24vw, 280px)"
        cardClassName="ring-1 ring-white/10"
      />

      {/* Kept even though the centred cover is now clickable itself. The cover is a
          photograph with no words on it, so nothing about it announces that it leads
          anywhere — and the cards are still draggable, which is the gesture a reader
          discovers first. This names the destination, and it is what a reader who has
          not thought to try clicking a picture will use. */}
      {active && (
        <ButtonLink
          href={`/brands/${active.slug}`}
          variant="outline-dark"
          size="sm"
          className="mt-8"
        >
          {`Visit ${active.name}`}
        </ButtonLink>
      )}
    </div>
  );
}
