// data/brands.ts
import type { Brand } from "@/types/commerce";

export const brands: Brand[] = [
  {
    id: "kis",
    slug: "kis",
    name: "KIS",
    descriptor: "Khan International Sports — Unstoppable",
    logo: "/brands/kis.svg",
    image: "/brands/kis-cover.svg",
    isFlagship: true,
  },
  {
    id: "jk",
    slug: "jk",
    name: "JK",
    descriptor: "Established Kashmir cricket brand",
    logo: "/brands/jk.svg",
    image: "/brands/jk-cover.svg",
  },
  {
    id: "valleywoods",
    slug: "valleywoods",
    name: "Valley Woods",
    descriptor: "Valley-crafted willow specialists",
    logo: "/brands/valleywoods.svg",
    image: "/brands/valleywoods-cover.svg",
  },
  {
    id: "tramboo",
    slug: "tramboo",
    name: "Tramboo",
    descriptor: "Kashmir willow craftsmen",
    // no logo/image yet — typographic placeholder used automatically
  },
  {
    id: "woodford",
    slug: "woodford",
    name: "Woodford",
    descriptor: "Premium willow craftsmanship",
    logo: "/brands/woodford.svg",
    image: "/brands/woodford-cover.svg",
  },
  {
    id: "whiteduck",
    slug: "whiteduck",
    name: "Whiteduck",
    descriptor: "Distinctive cricket bats",
    logo: "/brands/whiteduck.svg",
    image: "/brands/whiteduck-cover.svg",
  },
  {
    id: "sls",
    slug: "sls",
    name: "SLS",
    descriptor: "Performance cricket equipment",
    logo: "/brands/sls.svg",
    image: "/brands/sls-cover.svg",
  },
  {
    id: "ib",
    slug: "ib",
    name: "IB",
    descriptor: "International quality bats",
    logo: "/brands/ib.svg",
    image: "/brands/ib-cover.svg",
  },
  {
    id: "a-star",
    slug: "a-star",
    name: "A Star",
    descriptor: "Rising cricket brand",
    logo: "/brands/a-star.svg",
    image: "/brands/a-star-cover.svg",
  },
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

export function getFlagshipBrand(): Brand | undefined {
  return brands.find((b) => b.isFlagship);
}