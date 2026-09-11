// data/brands.ts
import type { Brand } from "@/types/commerce";

export const brands: Brand[] = [
  {
    id: "kis",
    slug: "kis",
    name: "KIS",
    descriptor:
      "Khan International Sports — the Valley's flagship bat maker, on cricket's international stage.",
    logo: "/brands/kis.svg",
    image: "/brands/kis-cover.jpg",
    isFlagship: true,
  },
  {
    id: "jk",
    slug: "jk",
    name: "JK",
    descriptor: "Established Kashmir cricket brand",
    logo: "/brands/jk.jpg",
    image: "/brands/jk-cover.jpg",
  },
  {
    id: "valleywoods",
    slug: "valleywoods",
    name: "Valley Woods",
    descriptor: "Valley-crafted willow specialists",
    logo: "/brands/valleywoods.svg",
    image: "/brands/valleywoods-cover.webp",
  },
  {
    id: "tramboo",
    slug: "tramboo",
    name: "Tramboo",
    descriptor: "Kashmir willow craftsmen",
    image: "/brands/tramboo-cover.webp",
    // no logo yet — typographic placeholder used automatically
  },
  /* Woodford, Whiteduck, SLS, IB and A Star were removed on the owner's instruction.
     They were never stocked: each carried five invented models at invented prices and
     a cover the image optimiser rejected, so all five brand cards had been rendering
     as error tiles. Their placeholder ranges went with them — see
     data/placeholder-brand-bats.ts. Nothing else read these slugs, so removing them
     drops the brand pages, their products and their sitemap entries together. */
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

export function getFlagshipBrand(): Brand | undefined {
  return brands.find((b) => b.isFlagship);
}