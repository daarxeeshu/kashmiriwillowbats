import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config";
import { products } from "@/data/products";
import { brands } from "@/data/brands";
import { categories } from "@/data/categories";

/* Built from the same data files the pages render from, so a product, brand or
 * category added to the data appears here with no second edit — and one removed
 * cannot linger as a dead sitemap entry.
 *
 * Placeholder products are deliberately included: they are real, rendered routes
 * with honest placeholder labelling, and excluding them would mean re-filtering
 * this list when real stock replaces them. The per-visitor pages (cart, checkout,
 * wishlist, account) are excluded to match robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;

  const staticRoutes = [
    "",
    "/brands",
    "/bat-doctor",
    "/customize",
    "/customize/3d",
    "/offers",
    "/size-guide",
    "/wall-of-fame",
    "/wall-of-fame/submit",
    "/contact",
    "/shipping",
    "/returns",
    "/warranty",
    "/track-order",
    "/faqs",
    "/about",
    "/store",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/shipping-policy",
  ].map((path) => ({ url: `${base}${path}` }));

  return [
    ...staticRoutes,
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}` })),
    ...brands.map((b) => ({ url: `${base}/brands/${b.slug}` })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}` })),
  ];
}
