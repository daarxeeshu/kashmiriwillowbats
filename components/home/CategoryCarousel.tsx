"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

/** Derived from the shared catalogue so slugs, labels and images stay in sync. */
const CATEGORIES = categories.map((category) => ({
  slug: category.slug,
  label: category.name,
  href: `/categories/${category.slug}`,
  img: category.image,
}));

const TOTAL  = CATEGORIES.length;
const RADIUS = 340;
const CARD_W = 200;
const CARD_H = 260;

function getAngle(index: number, offset: number) {
  return ((index / TOTAL) * 360 + offset) % 360;
}

function angleToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Which card is facing the viewer for a given rotation. Derived, not state. */
function getActiveIndex(offset: number) {
  const normalised = ((offset % 360) + 360) % 360;
  const step = 360 / TOTAL;
  return ((Math.round((360 - normalised) / step) % TOTAL) + TOTAL) % TOTAL;
}

export function CategoryCarousel() {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragging            = useRef(false);
  const lastX               = useRef(0);
  const velocityRef         = useRef(0);
  const rafRef              = useRef<number | null>(null);
  const containerRef        = useRef<HTMLDivElement>(null);

  const active = getActiveIndex(offset);

  const applyInertia = useCallback(() => {
    function step() {
      if (Math.abs(velocityRef.current) < 0.05) return;
      velocityRef.current *= 0.93;
      setOffset((o) => o + velocityRef.current);
      rafRef.current = requestAnimationFrame(step);
    }
    step();
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current    = true;
    lastX.current       = e.clientX;
    velocityRef.current = 0;
    setIsDragging(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx      = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velocityRef.current = dx * 0.18;
    setOffset((o) => o + dx * 0.18);
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
    rafRef.current   = requestAnimationFrame(applyInertia);
  }, [applyInertia]);

  const rotate = useCallback((dir: 1 | -1) => {
    const step = 360 / TOTAL;
    setOffset((o) => o + dir * step);
  }, []);

  return (
    <section className="section-padding bg-surface-dark overflow-hidden">
      <div className="container-main">

        {/* ── Header ── */}
        <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Full Catalogue</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Shop by category
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Everything you need for the game.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => rotate(-1)}
              aria-label="Previous category"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-white/30 hover:text-white"
            >
              ‹
            </button>
            <button
              onClick={() => rotate(1)}
              aria-label="Next category"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-white/30 hover:text-white"
            >
              ›
            </button>
          </div>
        </div>

        {/* ── Carousel stage ── */}
        <div
          ref={containerRef}
          className="relative mx-auto select-none"
          style={{
            width:       "100%",
            height:      `${CARD_H + RADIUS * 0.6}px`,
            perspective: "1200px",
            cursor:      isDragging ? "grabbing" : "grab",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {CATEGORIES.map((cat, i) => {
            const angleDeg = getAngle(i, offset);
            const angleRad = angleToRad(angleDeg);
            const x        = Math.sin(angleRad) * RADIUS;
            const z        = Math.cos(angleRad) * RADIUS;
            const depth    = (z + RADIUS) / (RADIUS * 2);
            const scale    = 0.72 + depth * 0.35;
            const opacity  = 0.35 + depth * 0.65;
            const isActive = i === active;

            return (
              <div
                key={cat.slug}
                style={{
                  position:  "absolute",
                  top:       "50%",
                  left:      "50%",
                  width:     `${CARD_W}px`,
                  height:    `${CARD_H}px`,
                  transform: `
                    translate(-50%, -50%)
                    translateX(${x}px)
                    translateZ(${z}px)
                    scale(${scale})
                  `,
                  opacity,
                  zIndex:    Math.round(depth * 100),
                  transition: isDragging
                    ? "none"
                    : "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
                  willChange: "transform, opacity",
                }}
              >
                <Link
                  href={cat.href}
                  tabIndex={isActive ? 0 : -1}
                  draggable={false}
                  className={cn(
                    "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border",
                    "no-underline transition-all duration-300",
                    isActive
                      ? "border-[#9a7b4f]/60 shadow-[0_0_40px_rgba(154,123,79,0.18)]"
                      : "border-white/[0.07]",
                  )}
                  onClick={(e) => {
                    if (Math.abs(velocityRef.current) > 0.5) e.preventDefault();
                  }}
                >
                  {/* ── Photo ── */}
                  <div className="relative flex-1 overflow-hidden">
                    <Image
                      src={cat.img}
                      alt={cat.label}
                      fill
                      sizes={`${CARD_W}px`}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      draggable={false}
                    />
                    {/* gradient over photo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-[#0e0d0b]/30 to-transparent" />
                  </div>

                  {/* ── Label ── */}
                  <div className="relative z-10 px-4 pb-5 pt-3">
                    <span
                      className={cn(
                        "block text-[13px] font-medium leading-snug tracking-tight",
                        isActive ? "text-white" : "text-white/60",
                      )}
                    >
                      {cat.label}
                    </span>
                    {isActive && (
                      <span className="mt-2 block h-0.5 w-8 rounded-full bg-[#9a7b4f]" />
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* ── Dot indicators ── */}
        <div className="mt-10 flex justify-center gap-1.5">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.slug}
              aria-label={`Go to ${cat.label}`}
              onClick={() => {
                const step    = 360 / TOTAL;
                const current = ((offset % 360) + 360) % 360;
                const target  = ((TOTAL - i) * step) % 360;
                let   delta   = target - current;
                if (delta > 180)  delta -= 360;
                if (delta < -180) delta += 360;
                setOffset((o) => o + delta);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-6 bg-[#9a7b4f]"
                  : "w-1.5 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
