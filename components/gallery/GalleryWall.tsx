"use client";

import { useMemo, useState } from "react";
import { GalleryCard } from "./GalleryCard";
import { GalleryLightbox } from "./GalleryLightbox";
import { cn } from "@/lib/utils";
import type { GalleryCategory, GalleryCategoryMeta, GalleryItem } from "@/types/gallery";

/* ── The wall ────────────────────────────────────────────────────────────────────
 *
 * A filterable grid, and the grid is deliberate. A continuously drifting wall was
 * considered and rejected for this content: looping requires duplicating every tile,
 * so a young player would meet himself three times on the page he was proud to be on;
 * the tiles move under a finger that is trying to tap one; and filtering re-chunks the
 * columns mid-drift. Recognition is the purpose here, and a person should appear once,
 * hold still, and open when tapped.
 *
 * Motion is still there, just carried by the section's own reveal on scroll and by the
 * tile's hover lift — the language the rest of the site already speaks.
 *
 * ── Filters ──
 * A horizontal scroller on every width. Wrapping tabs onto three lines on a phone is
 * the failure mode named in the brief; scrolling keeps the row one line tall and the
 * overflow inside its own box rather than on the page.
 */

interface GalleryWallProps {
  items: GalleryItem[];
  categories: GalleryCategoryMeta[];
  /** slug -> product name, resolved on the server so this stays free of catalogue
   *  lookups and cannot drift from the real product list. */
  batNames: Record<string, string>;
  /** Larger tiles for `featured` entries. Off for the compact homepage teaser. */
  emphasiseFeatured?: boolean;
}

export function GalleryWall({
  items,
  categories,
  batNames,
  emphasiseFeatured = true,
}: GalleryWallProps) {
  const [active, setActive] = useState<GalleryCategory | "all">("all");
  const [open, setOpen] = useState<GalleryItem | null>(null);

  const shown = useMemo(
    () => (active === "all" ? items : items.filter((i) => i.category === active)),
    [items, active],
  );

  const activeMeta = categories.find((c) => c.id === active);

  return (
    <div>
      {/* ── Filter bar ──
          Glass, because it is a small control cluster over a dark section — the kind of
          surface the effect suits — rather than a large area where the blur would cost
          more than it gives. */}
      <div
        role="tablist"
        aria-label="Filter the Wall of Fame by category"
        className={cn(
          "-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0",
          // Hide the scrollbar but keep the scrolling; the row is short and the
          // gradient edge below signals there is more.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Snap so a flick lands on a tab rather than between two.
          "snap-x snap-mandatory",
        )}
      >
        {categories.map((cat) => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(cat.id)}
              className={cn(
                "snap-start whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-all duration-200",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                // A 40px-tall control: comfortably tappable without becoming a slab.
                "min-h-10",
                isActive
                  ? "border-expert/50 bg-expert/15 text-expert"
                  : "border-white/10 bg-white/[0.04] text-white/60 backdrop-blur-sm hover:border-white/25 hover:text-white",
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {activeMeta?.blurb && (
        <p aria-live="polite" className="mt-4 text-sm leading-relaxed text-white/45">
          {activeMeta.blurb}
        </p>
      )}

      {/* ── The grid ──
          Two up on the smallest phones and four at desktop. Featured entries take a
          2x2 cell from `sm` up, which is where there is room for the rhythm to read. */}
      {shown.length > 0 ? (
        <ul
          className={cn(
            "mt-6 grid gap-3 sm:gap-4",
            "grid-cols-2 lg:grid-cols-4",
            emphasiseFeatured && "sm:auto-rows-auto",
          )}
        >
          {shown.map((item, index) => (
            <li key={item.id} className={cn(emphasiseFeatured && item.featured && "sm:col-span-2 sm:row-span-2")}>
              <GalleryCard
                item={item}
                batName={item.batUsed ? batNames[item.batUsed] : undefined}
                featured={emphasiseFeatured && item.featured}
                // Only the first row is above the fold; everything else stays lazy so a
                // wall of hundreds does not fetch itself on load.
                priority={index < 2}
                onOpen={setOpen}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-white/12 p-8 text-center text-sm text-white/45">
          Nothing here yet. Photographs are added as players and customers send them in.
        </p>
      )}

      <GalleryLightbox
        item={open}
        batName={open?.batUsed ? batNames[open.batUsed] : undefined}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
