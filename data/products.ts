import type { Product } from "@/types/commerce";

/**
 * Static product catalogue for homepage display.
 * Replace with PostgreSQL queries when commerce backend is ready.
 * Ratings/review counts omitted until real review data exists.
 */
export const products: Product[] = [
  {
    id: "kis-mh7000-plus",
    slug: "kis-mh7000-plus",
    name: "M&H7000+",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-mh7000-plus.jpg",
    mrp: 12999,
    price: 11499,
    badge: "Flagship",
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-mh7000",
    slug: "kis-mh7000",
    name: "M&H7000",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-mh7000.svg",
    mrp: 10999,
    price: 9799,
    badge: "Popular",
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-bazuka",
    slug: "kis-bazuka",
    name: "Bazuka",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-bazuka.svg",
    mrp: 8499,
    price: 7499,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-game-changer",
    slug: "kis-game-changer",
    name: "Game Changer",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-game-changer.svg",
    mrp: 7999,
    price: 6999,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-players-special",
    slug: "kis-players-special",
    name: "Players Special",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-players-special.svg",
    mrp: 9499,
    price: 8499,
    categorySlug: "kashmir-willow-bats",
    featured: true,
    flagship: true,
  },
  {
    id: "kis-master-pro",
    slug: "kis-master-pro",
    name: "Master Pro",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-master-pro.svg",
    mrp: 6999,
    price: 6299,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "kis-finisher",
    slug: "kis-finisher",
    name: "Finisher",
    brandSlug: "kis",
    brandName: "KIS",
    image: "/products/kis-finisher.svg",
    mrp: 5999,
    price: 5499,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
  {
    id: "jk-pro-willow",
    slug: "jk-pro-willow",
    name: "JK Pro Willow",
    brandSlug: "jk",
    brandName: "JK",
    image: "/products/jk-pro-willow.svg",
    mrp: 5499,
    price: 4999,
    categorySlug: "kashmir-willow-bats",
    featured: true,
  },
];

export function getFeaturedProducts(limit = 8): Product[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getFlagshipProducts(): Product[] {
  return products.filter((p) => p.flagship);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return products.filter((p) => p.brandSlug === brandSlug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}
