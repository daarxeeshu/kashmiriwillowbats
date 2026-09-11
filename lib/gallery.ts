import { getProductBySlug } from "@/data/products";
import type { GalleryItem } from "@/types/gallery";

/* Resolve every `batUsed` slug to the product's real name, once, on the server.
 *
 * The gallery stores a slug rather than a label so that renaming a product cannot
 * leave a stale bat name printed under somebody's photograph. A slug that no longer
 * matches a product simply drops out — the tile then shows no bat line, which is
 * correct: we would rather say nothing than name a bat we no longer sell. */
export function resolveBatNames(items: GalleryItem[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const item of items) {
    if (!item.batUsed || names[item.batUsed]) continue;
    const product = getProductBySlug(item.batUsed);
    if (!product) continue;
    names[item.batUsed] = product.brandName
      ? `${product.brandName} ${product.name}`
      : product.name;
  }
  return names;
}
