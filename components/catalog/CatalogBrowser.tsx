"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/types/commerce";
import { CatalogProductGrid } from "@/components/catalog/CatalogProductGrid";
import { cn, formatPrice } from "@/lib/utils";

/* ── The one catalogue browser ────────────────────────────────────────────────────
 *
 * Filtering and sorting did not exist anywhere in this project before this file — no
 * sort control, no filter state, no query-param reader, on any route. So "reuse the
 * existing filter system" resolves to the next best thing the instruction is actually
 * after: build it once, here, and have every catalogue page call it. Hard Tennis Bat
 * gets filters and sorting, and Kashmir Willow, English Willow and every future
 * category get the identical controls from the same component — which is the outcome
 * the brief's "do not create a second implementation" is protecting.
 *
 * ── Which controls appear is decided by the data, not by this file ──
 * A brand filter over one brand is a checkbox that can only ever be on, and a price
 * slider over one price is a slider with one position. Both are worse than nothing:
 * they imply the catalogue is deeper than it is. So each control tests its own axis
 * for real variance and renders only if it finds some. The consequence worth stating
 * plainly: on a category with no products, this renders no controls at all, and on
 * today's Kashmir Willow (two brands, eight prices) it renders brand and price and
 * nothing else.
 *
 * Weight, bat size and playing style are *not* here, and that is not an omission. The
 * `Product` type carries id, slug, name, brand, image, mrp, price, badge, rating,
 * reviewCount, category, featured and flagship — there is no weight, size or profile
 * field on any product in the catalogue. Filters over fields that do not exist would
 * have to invent their values. They can be added the day the data model grows them,
 * and the shape above is what they plug into.
 *
 * Sorting offers Featured, both price directions and Name. Not "Newest": nothing in
 * the product model records when a product was added, and ordering by array index
 * while calling it recency would be a guess presented as a fact. */

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

/** Flagship first, then featured, then catalogue order. `sort` is stable in every
 *  engine this ships to, so equal ranks keep the order `data/products.ts` lists them
 *  in — which is itself editorial and worth preserving. */
function featuredRank(product: Product): number {
  if (product.flagship) return 0;
  if (product.featured) return 1;
  return 2;
}

function sortProducts(products: Product[], sort: SortValue): Product[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return copy.sort((a, b) => featuredRank(a) - featuredRank(b));
  }
}

interface CatalogBrowserProps {
  products: Product[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function CatalogBrowser({
  products,
  emptyTitle,
  emptyDescription,
}: CatalogBrowserProps) {
  const [sort, setSort] = useState<SortValue>("featured");
  const [brands, setBrands] = useState<ReadonlySet<string>>(new Set());
  /** `null` means "not touched" rather than "no ceiling", so the slider can sit at
   *  the maximum without that being indistinguishable from an active filter. */
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  /* Both axes derived from the products actually passed in — so a category page and a
     future search-results page get options describing their own contents, with no
     lookup table to keep in step with the catalogue. */
  const brandOptions = useMemo(() => {
    const bySlug = new Map<string, string>();
    for (const product of products) {
      // A product with no brand contributes no option. Without this guard an
      // unattributed range would offer an "undefined" checkbox that filters to
      // nothing.
      if (product.brandSlug && product.brandName) {
        bySlug.set(product.brandSlug, product.brandName);
      }
    }
    return [...bySlug].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return null;
    const values = products.map((p) => p.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? null : { min, max };
  }, [products]);

  const showBrandFilter = brandOptions.length > 1;
  const showPriceFilter = priceBounds !== null;
  const hasFilters = showBrandFilter || showPriceFilter;

  const ceiling = maxPrice ?? priceBounds?.max ?? 0;
  const activeCount = brands.size + (maxPrice !== null ? 1 : 0);

  const visible = useMemo(() => {
    const filtered = products.filter((product) => {
      // A brandless product cannot satisfy a brand filter, so it drops out as soon
      // as one is applied — the same as any product of another brand.
      if (brands.size > 0 && (!product.brandSlug || !brands.has(product.brandSlug)))
        return false;
      if (maxPrice !== null && product.price > maxPrice) return false;
      return true;
    });
    return sortProducts(filtered, sort);
  }, [products, brands, maxPrice, sort]);

  function toggleBrand(slug: string) {
    setBrands((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function clearFilters() {
    setBrands(new Set());
    setMaxPrice(null);
  }

  /* Nothing in the category at all. Delegated rather than reimplemented: that empty
     state, its copy and its WhatsApp fallback already exist and are what every other
     catalogue page shows. */
  if (products.length === 0) {
    return (
      <CatalogProductGrid
        products={products}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }

  return (
    <div>
      {/* ── Toolbar ──
          One row on every width, which is what keeps the mobile layout (§22) and the
          desktop one from being two different designs: count on the left, the two
          controls on the right, filters in a panel underneath. The panel is a
          disclosure rather than a mobile-only drawer because a drawer would mean two
          filter UIs to keep in step, and this one is already compact enough to sit
          inline on a 320px screen. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        {/* Live, because filtering changes it without moving focus — a screen-reader
            user toggling a brand would otherwise get no feedback that anything
            happened. */}
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {visible.length === products.length ? (
            <>
              Showing{" "}
              <span className="font-semibold text-foreground">{products.length}</span>{" "}
              {products.length === 1 ? "product" : "products"}
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-foreground">{visible.length}</span> of{" "}
              {products.length} products
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              aria-expanded={panelOpen}
              aria-controls="catalog-filters"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-border-strong px-3 text-xs font-semibold tracking-wide text-foreground transition-colors hover:border-foreground/30 hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filter
              {/* A count, not a dot — "2" says what a coloured dot only hints at, and
                  survives being read aloud. */}
              {activeCount > 0 && (
                <span className="rounded-full bg-accent-muted px-1.5 text-[11px] font-bold text-accent">
                  {activeCount}
                </span>
              )}
            </button>
          )}

          {/* A native select. It gets the platform's own picker on a phone — a wheel
              on iOS, a sheet on Android — which is more usable at 320px than any
              custom menu, and it is keyboard-accessible without a line of JS. */}
          <label className="inline-flex h-10 items-center gap-2 rounded-sm border border-border-strong px-3 text-xs font-semibold tracking-wide text-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              /* `h-full` so the control is as tall as it looks. Without it the
                 select is only as tall as its 16px line box, floating in the
                 middle of a 40px label — measured 109x16 inside 166x40 at 375px.
                 Wrapping it in a label forwards *focus* from the rest of that
                 area but does not open a select's picker, so two thirds of an
                 apparently 40px control did nothing when tapped. The label keeps
                 its own height; this just lets the select claim all of it. */
              className="h-full cursor-pointer appearance-none bg-transparent pr-1 text-xs font-semibold text-foreground outline-none"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value} className="bg-surface text-foreground">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {hasFilters && (
        <div
          id="catalog-filters"
          hidden={!panelOpen}
          className="mt-4 rounded-sm border border-border bg-surface p-4 sm:p-5"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {showBrandFilter && (
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Brand
                </legend>
                <div className="mt-3 flex flex-col gap-2.5">
                  {brandOptions.map((brand) => (
                    <label
                      key={brand.slug}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={brands.has(brand.slug)}
                        onChange={() => toggleBrand(brand.slug)}
                        className="size-4 shrink-0 accent-[#9a7b4f]"
                      />
                      {brand.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {showPriceFilter && priceBounds && (
              <div>
                <label
                  htmlFor="catalog-price"
                  className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  Max price
                </label>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {formatPrice(ceiling)}
                </p>
                <input
                  id="catalog-price"
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={100}
                  value={ceiling}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="mt-2 h-10 w-full cursor-pointer accent-[#9a7b4f]"
                />
                <div className="flex justify-between text-[11px] text-muted">
                  <span>{formatPrice(priceBounds.min)}</span>
                  <span>{formatPrice(priceBounds.max)}</span>
                </div>
              </div>
            )}
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <X className="size-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        {visible.length === 0 ? (
          /* Filtered to nothing — a different situation from an empty category, and
             it needs a different way out. The category's own empty state offers
             WhatsApp, which is not the answer when the products are right there
             behind a price ceiling the customer set themselves. */
          <div className="rounded-sm border border-border bg-surface px-6 py-14 text-center">
            <h2 className="text-lg font-semibold tracking-tight">No matches</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              No products match the filters you have selected. Widen the price range or
              clear the filters to see the full range.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className={cn(
                "mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-sm px-5",
                "border border-forest bg-forest text-sm font-semibold text-white shadow-sm transition-colors",
                "hover:bg-forest-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
              )}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <CatalogProductGrid products={visible} />
        )}
      </div>
    </div>
  );
}
