"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CoverflowSlide {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  /**
   * Short name painted onto the card itself. Self-gating — cards render it only
   * when it is set. Distinct from `title`, which names the *centred* card in the
   * caption below: a reader looking at the rake needs to identify the cards they
   * have not selected yet, which the caption cannot do.
   */
  label?: string;
  /**
   * Where this card goes when it is centred and tapped. Optional, and its absence
   * is meaningful: a slide without one is a picture, and taps on it do nothing but
   * centre it.
   *
   * Only ever rendered as a real `<a>` on the *centred* card. Off-centre cards
   * already own the tap — it brings them to the middle — so giving them a link too
   * would mean one gesture with two meanings depending on which card you hit.
   */
  href?: string;
  meta?: { label: string; value: string }[];
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  showCaption?: boolean;
  showPagination?: boolean;
  showNavigation?: boolean;
  /** Names the carousel for assistive tech. */
  label?: string;
  className?: string;
  cardClassName?: string;
  /** Which slide sits centred at rest. Clamped into range. */
  initialIndex?: number;
  /** Fires when the centred card changes, with its index in `slides`. */
  onSelect?: (index: number) => void;
  /**
   * Fires when the centred card is activated — tapped, or its link followed by
   * keyboard. Only meaningful for slides carrying an `href`.
   *
   * It exists because the mouse case cannot go through the anchor: the frame takes
   * pointer capture on every press, so the click event is dispatched there and never
   * reaches the card underneath. `endDrag` already knows which slot was hit and
   * whether the press was a tap or a drag, so it is the only place that can tell a
   * click on the centre card from the end of a throw. Routing is left to the caller
   * so this component stays free of a router.
   */
  onActivate?: (index: number) => void;
}

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(148px, 22vw, 260px)",
  gap = 0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = "Cover carousel",
  className,
  cardClassName,
  initialIndex = 0,
  onSelect,
  onActivate,
}: CoverflowCarouselProps) {
  const count = slides.length;

  // Resting position. Seeded once — this is a starting point, not a lock, so a
  // later change to the prop must not yank a card the reader has scrolled to.
  // The trailing `|| 0` is a NaN guard: min/max both pass NaN straight through.
  const start = Math.max(0, Math.min(count - 1, Math.round(initialIndex))) || 0;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(start);
  /** Where the current settle is headed. Stepping off `pos` instead would
      swallow a keypress that lands mid-flight, before the round-off moves. */
  const targetRef = React.useRef(start);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
    /** Peak distance the pointer has travelled, for telling a tap from a drag. */
    moved: number;
  } | null>(null);

  const [selected, setSelected] = React.useState(start);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      // A card is teleported across the ring at exactly half a turn out, so it
      // has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // ponytail: exponential ease-out, not a spring. Swap in a spring only
        // if the settle needs overshoot.
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      // Take the shorter way round rather than unwinding the whole ring.
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      moved: 0,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    // Cards per second, for the throw.
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;
    // Furthest the pointer has travelled from where it went down. Peak rather than
    // current distance, so a drag that wanders out and comes back is still a drag.
    drag.moved = Math.max(drag.moved, Math.abs(event.clientX - drag.x));

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;

    /* A press that never travelled is a tap, and a tap on an off-centre card means
       "bring that one here" — the behaviour every coverflow has and the one thing
       this component was missing. Without it the only ways to reach a neighbour are
       dragging, the arrows, or the dots, and the card sitting half-visible right next
       to the centre looks more clickable than any of them.

       Handled here rather than with an onClick on each card for two reasons: the
       frame has pointer capture, so a click event never reaches the card the pointer
       is actually over, and this is where the drag distance is already known. The
       tilted cards also overlap heavily, so `elementFromPoint` would frequently
       return the wrong one — the geometry below asks which slot the tap landed in,
       which is the same maths `paint()` uses, so it agrees with what is on screen.

       TAP_SLOP of 6px, not 0: a touch always drifts a pixel or two, and a mouse
       usually drifts one. Below the slop no scroll position has meaningfully
       changed, so treating it as a tap cannot fight a drag the reader intended. */
    const TAP_SLOP = 6;
    if (drag.moved <= TAP_SLOP) {
      const pitch = widthRef.current * (1 + gap);
      const frame = frameRef.current;
      if (pitch && frame) {
        // Which slot, in card widths, the tap sits at relative to the centre. The
        // centre card spans -0.5..0.5, its neighbour 0.5..1.5, and so on.
        const box = frame.getBoundingClientRect();
        const fromCentre = event.clientX - (box.left + box.width / 2);
        const step = Math.round(fromCentre / pitch);
        if (step !== 0) {
          nudge(step);
          return;
        }
      }
      /* A tap on the centre card. There is nothing to move — settling to where we
         already are would cancel nothing and still cost a frame — so the position is
         left alone and the tap is offered to the caller instead.

         This is the mouse path for the card's link, and it has to be here rather than
         on the anchor: the frame holds pointer capture from `onPointerDown`, so the
         browser dispatches the click to the frame and the anchor underneath never
         sees one. What makes it safe is the same `TAP_SLOP` test the branch above
         relies on — the press has already been shown not to have travelled, so this
         cannot fire at the end of a drag that happened to finish over the centre. */
      const centred = indexAt(posRef.current);
      if (slides[centred]?.href) onActivate?.(centred);
      return;
    }

    // Let a flick carry, but never more than two cards.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // Reported after commit, not from inside the pointer handler, so a consumer
  // re-rendering on select can never interleave with the drag maths. Held in a
  // ref because consumers pass an inline arrow: depending on the callback
  // itself would re-fire this on every render of the parent.
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  });
  React.useEffect(() => {
    onSelectRef.current?.(selected);
  }, [selected]);

  const active = slides[selected];

  return (
    <div
      className={cn("w-full", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          // Vertical padding keeps the drop shadows clear of the overflow clip.
          // `ring-accent` rather than the upstream `ring-ring`: this design
          // system defines no `--color-ring`, so that class resolves to nothing
          // and the focus ring silently disappears. Gold is the focus colour
          // used elsewhere (see BrandCard).
          className="cursor-grab overflow-hidden py-10 outline-none ring-accent focus-visible:ring-2 active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            // Horizontal drag is ours; the page keeps vertical scrolling.
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: "var(--cf-card)",
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                role="group"
                aria-roledescription="slide"
                // Name the slide when there is one. Bare "3 of 9" tells a
                // screen-reader user their position and nothing about what they
                // are on.
                aria-label={
                  slide.label
                    ? `${slide.label}, ${index + 1} of ${count}`
                    : `${index + 1} of ${count}`
                }
                className={cn(
                  // `bg-surface-elevated` rather than the upstream `bg-muted`:
                  // here `--color-muted` is 40% white — a *text* colour. As a
                  // card backing on this dark theme it flashes a light grey
                  // slab before each image paints.
                  "absolute left-1/2 top-0 aspect-square overflow-hidden rounded-2xl bg-surface-elevated shadow-xl will-change-transform",
                  // Off-centre cards are tappable (see endDrag), so they say so. The
                  // centred one keeps the frame's grab cursor because dragging is all
                  // it does. Pointer handling stays on the frame — this is cursor
                  // feedback only, which is why it can be a class and not a handler.
                  // The centred card keeps the frame's grab cursor when it is only a
                  // picture, and takes a pointer when it is also a destination.
                  index === selected && !slide.href
                    ? "cursor-grab"
                    : "cursor-pointer",
                  cardClassName,
                )}
                style={{ width: "var(--cf-card)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                />

                {slide.label && (
                  // Painted on the card so it tilts and recedes with it. The
                  // scrim is what makes one label treatment work over both a
                  // photograph and a flat placeholder; without it the text
                  // dropped out against the light areas of the KIS cover.
                  // aria-hidden because the group's aria-label above already
                  // carries this name — otherwise it is announced twice.
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-9"
                  >
                    {/* 12px. These were 10px on the assumption that a brand name
                        would not fit any larger, which measurement contradicts: the
                        longest ("Valley Woods") needs 81px at 12px inside a 136px
                        box. `aria-hidden` makes them invisible to a screen reader —
                        the slide's own aria-label carries the name — but a sighted
                        reader still reads these to tell one card from another, so
                        the readability floor applies to them like anything else. */}
                    <p className="truncate text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      {slide.label}
                    </p>
                  </div>
                )}

                {/* The centred card's destination, as a real link.

                    It will not receive the ordinary mouse click — the frame captured
                    the pointer, so `endDrag` handles that — and it is here for
                    everything a programmatic navigation would otherwise throw away:
                    the URL in the status bar on hover, right-click → open in new tab,
                    ⌘/Ctrl-click, a focus stop, and an href a crawler can follow.

                    `onClick` covers the one case that *does* reach it: pressing Enter
                    on the focused link fires a click. Modified clicks fall through
                    untouched so the browser can open them in a new tab or window —
                    calling `preventDefault` on those is the standard way to break
                    ⌘-click without noticing. */}
                {index === selected && slide.href && (
                  <a
                    href={slide.href}
                    draggable={false}
                    aria-label={slide.label ? `Visit ${slide.label}` : undefined}
                    onClick={(event) => {
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      ) {
                        return;
                      }
                      event.preventDefault();
                      onActivate?.(index);
                    }}
                    className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="absolute left-3 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="absolute right-3 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {showCaption && active?.title && (
        // `animate-coverflow-caption` rather than the upstream
        // `animate-in fade-in`: those come from tailwindcss-animate, which this
        // project does not use. The keyframe lives in globals.css beside the
        // others and is disabled under prefers-reduced-motion.
        <div
          key={selected}
          className="animate-coverflow-caption mt-2 flex flex-col items-center px-6"
        >
          <p className="text-[15px] font-semibold tracking-tight text-foreground">
            {active.title}
          </p>
          {active.subtitle && (
            <p className="mt-1 text-[13px] text-muted-foreground">
              {active.subtitle}
            </p>
          )}
          {active.meta && active.meta.length > 0 && (
            <dl className="mt-10 w-full max-w-[230px] text-[12px]">
              {active.meta.map((row) => (
                <div key={row.label} className="flex justify-between py-[5px]">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {showPagination && (
        // Same split as CategoryCarousel: the button is a 44px touch target with no
        // visible box, the span inside it is the 10px dot. An 8px button is both
        // hard to see on this dark theme and a poor target — growing the dot itself
        // to 44px would swap one problem for a row of oversized discs.
        <div className="-mx-1 mt-6 flex items-center justify-center">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={
                slides[index]?.label
                  ? `Go to ${slides[index].label}`
                  : `Go to slide ${index + 1}`
              }
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className="group flex h-11 min-w-6 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2.5 rounded-full bg-foreground transition-opacity",
                  index === selected
                    ? "opacity-100"
                    : "opacity-40 group-hover:opacity-70",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
