import type { CartLine } from "@/types/cart";
import { clampQty } from "./totals";

export const CART_STORAGE_KEY = "kwb.cart.v1";

/* ── Reading someone else's data ─────────────────────────────────────────────────
 *
 * localStorage is not ours. It survives deploys, it is editable by hand, and the shape
 * we wrote last release is not necessarily the shape we read this one. So the parse is
 * defensive at every level — not JSON, not an array, an entry that is not an object, a
 * slug that is not a string, a quantity that is NaN — and every one of those failures
 * degrades to "no cart" or "skip this line" rather than throwing.
 *
 * A throw here would be uncaught inside a provider that mounts on every page, which
 * turns one malformed key into a blank site. The version suffix in the key is the
 * escape hatch for a real shape change: bump it and last version's data is ignored
 * instead of needing a migration. */
export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    // Private mode and "block site data" both throw on access, not just on write.
    return [];
  }
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const lines: CartLine[] = [];

    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const { slug, qty, options, engraving } = entry as Record<string, unknown>;
      if (typeof slug !== "string" || !slug) continue;

      /* Deduplicated on the *spec*, not the slug: the same bat in two configurations
         is legitimately two rows, but the same bat in the same configuration twice is
         a corrupt file, and would render as two steppers for one line. `resolveCart`
         re-derives the real key, so this only has to be stable, not identical. */
      const spec =
        typeof options === "object" && options !== null
          ? Object.entries(options as Record<string, unknown>)
              .filter(([, v]) => typeof v === "string")
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => k + ":" + v)
              .join(",")
          : "";
      const name = typeof engraving === "string" ? engraving : "";
      const key = slug + "|" + spec + "|" + name;
      if (seen.has(key)) continue;
      seen.add(key);

      lines.push({
        slug,
        qty: clampQty(typeof qty === "number" ? qty : 1),
        // Kept as-is here and validated in `resolveCart`, which knows the product and
        // therefore whether options apply at all.
        options:
          typeof options === "object" && options !== null
            ? (options as Record<string, string>)
            : undefined,
        engraving: name || undefined,
      });
    }

    return lines;
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Quota exceeded, or storage disabled. The cart still works for this session —
    // it just will not survive a reload, which is a better outcome than a crash.
  }
}
