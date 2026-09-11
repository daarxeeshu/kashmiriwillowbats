"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

/* ── One face on the wall ────────────────────────────────────────────────────────
 *
 * A button, not a link: it opens the lightbox rather than navigating, and a `<button>`
 * is what a screen reader and a keyboard already know how to operate. The whole tile is
 * the target, so there is no small control to miss on a phone.
 *
 * ── On cropping ──
 * `object-cover` fills the tile, and on a player photograph that is a real risk: a
 * centred crop of an upright action shot takes the head off. Two things answer it —
 * the tile is 3:4 portrait, which is the shape a person holding a bat actually is, and
 * `focal` maps to `object-position` so a subject high in the frame is protected. The
 * default is `center`; anything else is a decision recorded per photograph.
 *
 * The metadata sits under a gradient at the foot of the tile and stays short. The
 * photograph is the content; the name is a caption, not a headline competing with it.
 */

interface GalleryCardProps {
  item: GalleryItem;
  /** Resolved product name for `batUsed`, when the slug matched a real product. */
  batName?: string;
  /** Bigger tile on wide screens. Editorial rhythm only. */
  featured?: boolean;
  priority?: boolean;
  onOpen: (item: GalleryItem) => void;
}

const FOCAL_CLASS: Record<NonNullable<GalleryItem["focal"]>, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

export function GalleryCard({
  item,
  batName,
  featured = false,
  priority = false,
  onOpen,
}: GalleryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`View ${item.name}${item.playerType ? `, ${item.playerType}` : ""}`}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl border border-white/[0.07] bg-surface-dark",
        "aspect-[3/4] text-left",
        "transition-transform duration-500 ease-out",
        // Lift only where there is a pointer to lift under. On touch the tile is
        // already at rest in its final state.
        "hover:-translate-y-1 active:translate-y-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        featured && "sm:col-span-2 sm:row-span-2 sm:aspect-[3/4]",
      )}
    >
      <SafeImage
        src={item.image}
        // The name alone is not a description of a photograph, and the button's own
        // label already announces it — so the image is decorative here rather than
        // repeating the name to a screen reader twice.
        alt=""
        fill
        priority={priority}
        sizes={
          featured
            ? "(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 92vw"
            : "(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 46vw"
        }
        className={cn(
          "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]",
          FOCAL_CLASS[item.focal ?? "center"],
        )}
      />

      {/* Legibility scrim. Weighted to the foot, where the words are. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
      />

      {item.isPlaceholder && (
        // Same discipline as the product cards: nobody should have to guess which
        // faces on this wall are real people.
        <span className="absolute left-2.5 top-2.5 rounded-sm border border-dashed border-white/25 bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-sm sm:left-3 sm:top-3">
          Placeholder
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 block p-3 sm:p-4">
        <span className="block truncate text-[13px] font-semibold tracking-tight text-white sm:text-sm">
          {item.name}
        </span>
        {item.playerType && (
          <span className="mt-0.5 block truncate text-[11px] text-white/55">
            {item.playerType}
            {item.location ? ` · ${item.location}` : ""}
          </span>
        )}
        {batName && (
          <span className="mt-1.5 block truncate text-[11px] font-medium text-expert">
            {batName}
          </span>
        )}
      </span>
    </button>
  );
}
