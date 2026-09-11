"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

/* ── The detail view ─────────────────────────────────────────────────────────────
 *
 * A native `<dialog>`, opened with `showModal()`. That is not a stylistic preference:
 * the platform gives us the whole modal contract for free — it renders in the top
 * layer so no z-index can bury it, it traps focus, it makes the rest of the page inert
 * to screen readers, Escape closes it, and focus returns to whatever opened it. A
 * div-based modal has to reimplement every one of those and usually gets two wrong.
 *
 * What is added on top:
 *   - a backdrop click that closes only when the click is genuinely outside the panel,
 *     measured against the dialog's own box rather than trusting the event target
 *     (`<dialog>` reports clicks on its backdrop as clicks on the dialog itself);
 *   - body scroll lock, because iOS will happily scroll the page behind a modal.
 *
 * The image is `object-contain` here, unlike the tile. On the wall a photograph is
 * cropped to a shared rhythm; opened, it is the whole point — so it is shown complete,
 * never cropped, whatever shape it is.
 */

interface GalleryLightboxProps {
  item: GalleryItem | null;
  batName?: string;
  onClose: () => void;
}

export function GalleryLightbox({ item, batName, onClose }: GalleryLightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Open/close follows the prop, so the dialog can never be visually open while the
  // component thinks it is closed.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [item]);

  return (
    <dialog
      ref={ref}
      // Escape fires `cancel`; the browser would then close the dialog without telling
      // React, leaving the parent holding a stale item.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        const dialog = ref.current;
        if (!dialog) return;
        // A click on the backdrop targets the dialog element, so the target alone
        // cannot distinguish it. The geometry can.
        const r = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= r.left &&
          event.clientX <= r.right &&
          event.clientY >= r.top &&
          event.clientY <= r.bottom;
        if (!inside) onClose();
      }}
      aria-label={item ? `${item.name}, photograph` : undefined}
      className={cn(
        "m-auto w-[min(94vw,58rem)] max-w-none rounded-xl border border-white/10 bg-transparent p-0",
        "backdrop:bg-black/80 backdrop:backdrop-blur-sm",
      )}
    >
      {item && (
        <div className="relative overflow-hidden rounded-xl bg-surface-dark">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            /* Glass, and this is one of the few places it earns its cost: it sits over
               a photograph, which is exactly the case where a translucent surface has
               something to refract instead of blurring a flat colour. */
            className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-5" />
          </button>

          <div className="grid lg:grid-cols-[1.25fr_1fr]">
            {/* Contained, not cropped: opened, the photograph is the content. */}
            <div className="relative aspect-[3/4] w-full bg-black lg:aspect-auto lg:min-h-[32rem]">
              <SafeImage
                src={item.image}
                alt={`${item.name}${item.playerType ? `, ${item.playerType}` : ""}`}
                fill
                sizes="(min-width: 1024px) 58vw, 94vw"
                className="object-contain"
              />
            </div>

            <div className="p-5 sm:p-7">
              {item.isPlaceholder && (
                <p className="mb-3 inline-block rounded-sm border border-dashed border-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  Placeholder
                </p>
              )}

              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {item.name}
              </h2>

              {item.playerType && (
                <p className="mt-1.5 text-sm text-white/60">{item.playerType}</p>
              )}

              <dl className="mt-5 space-y-3 text-sm">
                {/* Every row is conditional. An empty "Location: —" would be worse
                    than the row not existing, and for a minor it would be worse still. */}
                {item.location && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
                      Location
                    </dt>
                    <dd className="mt-0.5 text-white/80">{item.location}</dd>
                  </div>
                )}
                {batName && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
                      Bat used
                    </dt>
                    <dd className="mt-0.5 font-medium text-expert">{batName}</dd>
                  </div>
                )}
              </dl>

              {item.caption && (
                <blockquote className="mt-5 border-l-2 border-expert/40 pl-4 text-sm leading-relaxed text-white/70">
                  {item.caption}
                </blockquote>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
