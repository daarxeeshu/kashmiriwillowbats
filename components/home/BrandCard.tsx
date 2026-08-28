// components/home/BrandCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassSurface from "@/components/GlassSurface";
import type { Brand } from "@/types/commerce";

interface BrandCardProps {
  brand: Brand;
  className?: string;
  variant?: "featured" | "standard" | "compact";
  index?: number;
  /** Preload the cover. Set this on the card that is the page's LCP element. */
  priority?: boolean;
}

export function BrandCard({
  brand,
  className,
  variant = "standard",
  index = 0,
  priority = false,
}: BrandCardProps) {
  const delay = index * 80;

  return (
    <Link
      href={`/brands/${brand.slug}`}
      aria-label={`Explore ${brand.name} bats`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl",
        "brand-card-animate",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a7b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1b19]",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Cover image layer */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          variant === "featured" && "aspect-[4/3] sm:aspect-[3/2]",
          variant === "standard" && "aspect-[4/3]",
          variant === "compact" && "aspect-[3/2]",
        )}
      >
        {brand.image ? (
          <Image
            src={brand.image}
            alt=""
            fill
            priority={priority}
            className={cn(
              "object-cover object-center",
              "transition-transform duration-500 ease-out",
              "group-hover:scale-[1.04]",
              "saturate-[0.88] group-hover:saturate-100",
            )}
            sizes={
              variant === "featured"
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e2a22]">
            <span
              className="select-none font-semibold tracking-widest text-white/20"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
              aria-hidden="true"
            >
              {brand.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b]/90 via-[#0e0d0b]/20 to-transparent" />

        {/* Flagship badge */}
        {brand.isFlagship && (
          <div className="absolute left-4 top-4 z-10">
            {/* 12px, matching `Badge` — this is the same chip in a different
                component, and it sits on `/brands` where it is a real label rather
                than decoration. Safe to raise where the hero spec panels are not:
                this is `inline-block` over a cover image with room to spare, so it
                grows to fit instead of being clipped by a fixed panel width. */}
            <span className="inline-block rounded-sm bg-[#9a7b4f] px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-white">
              Flagship
            </span>
          </div>
        )}
      </div>

      {/* Glass content panel */}
      <GlassSurface
        width="100%"
        borderRadius={0}
        displace={0}
        brightness={62}
        opacity={0.72}
        mixBlendMode="normal"
        interactive
        className="border-t-0 !border-white/[0.07]"
      >
        <div
          className={cn(
            "flex items-end justify-between gap-3 px-5 py-4",
            variant === "featured" && "px-6 py-5",
          )}
        >
          <div className="min-w-0">
            {/* Brand name — always visible. `truncate` keeps a two-word name
                like "Valley Woods" on one line; wrapping made this panel a
                row taller than its neighbours and broke the grid's alignment. */}
            <p
              className={cn(
                "mb-1 truncate font-semibold tracking-tight text-white",
                variant === "featured" ? "text-2xl" : "text-lg",
              )}
            >
              {brand.name}
            </p>

            {/* No logo overlay here on purpose. `brightness-0 invert` flattens
                any opaque artwork to solid white, and every current logo asset
                is opaque — the placeholder SVGs carry a cream background rect,
                and /brands/jk.jpg is a photograph. The result was a white bar
                on all eight cards. The brand name above already identifies the
                card, so the overlay was duplicate content anyway. The logo is
                still rendered on /brands/[slug], untinted on a surface plate. */}

            {variant === "featured" && brand.isFlagship && (
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9a7b4f]">
                Unstoppable
              </p>
            )}

            {variant !== "compact" && brand.descriptor && !brand.isFlagship && (
              <p className="mt-0.5 truncate text-xs text-white/50">
                {brand.descriptor}
              </p>
            )}
          </div>

          {/* CTA */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5",
              "text-xs font-medium text-white/60",
              "transition-all duration-300 group-hover:text-[#9a7b4f]",
              variant === "compact" && "hidden sm:flex",
            )}
            aria-hidden="true"
          >
            <span className="hidden sm:inline">Explore bats</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </GlassSurface>

      {/* Hover border glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.07] transition-all duration-300 group-hover:border-white/[0.16] group-hover:shadow-[0_0_0_1px_rgba(154,123,79,0.15)]"
      />

      {/* Lift shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.3)] transition-opacity duration-300 group-hover:opacity-100"
      />
    </Link>
  );
}
