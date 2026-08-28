import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config";

/* Everything is crawlable except the pages that are per-visitor (cart, checkout,
 * wishlist, account) or operational (the API). Those already carry their own
 * `robots` metadata; listing them here keeps well-behaved crawlers out before they
 * even request the page. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cart", "/checkout", "/wishlist", "/account"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
