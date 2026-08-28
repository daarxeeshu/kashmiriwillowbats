"use client";

import { useRef, useState, useCallback, useLayoutEffect } from "react";
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

/** Slop, in pixels, before a pointer gesture counts as a drag rather than a tap.
 *  Small enough that a deliberate swipe engages immediately, large enough to absorb
 *  the two or three pixels a finger or a hand-held mouse moves while pressing. At the
 *  0.18°/px rotation rate below, 8px is 1.4° — invisible. */
const DRAG_SLOP = 8;

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
  /* ── Why the rotation is not React state ────────────────────────────────────
   *
   * It was: `setOffset` ran on every pointermove and on every inertia frame, so a
   * swipe re-rendered this component — and all eleven cards, each with a next/image
   * and its own transform — sixty times a second. On a phone that is the whole lag.
   *
   * The rotation now lives in a ref and is written straight to each card’s style,
   * which is the same rule the hero states for itself: do not tie heavy React state
   * to a continuous gesture. React re-renders here only when the *active* card
   * changes — roughly once per card crossed instead of once per frame.
   *
   * `active` stays in state because it drives the dots, the aria-current and the
   * label treatment, all of which are real DOM changes React should own. */
  const offsetRef = useRef(0);
  const [active, setActive] = useState(() => getActiveIndex(0));
  const activeRef = useRef(active);
  const [isDragging, setIsDragging] = useState(false);
  /** True while a gesture or its inertia is running: transitions are off then, so a
   *  per-frame write is not fighting a 0.35s ease. Discrete jumps (arrows, dots)
   *  leave it false and keep the eased travel. */
  const animatingRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragging            = useRef(false);
  const lastX               = useRef(0);
  const startX              = useRef(0);
  /** Furthest the pointer travelled this gesture. The tap/swipe discriminator. */
  const dragDistance        = useRef(0);
  const pointerId           = useRef<number | null>(null);
  const velocityRef         = useRef(0);
  const rafRef              = useRef<number | null>(null);
  const containerRef        = useRef<HTMLDivElement>(null);

  /** Writes the ring straight to the DOM. The only place card geometry is applied. */
  const paint = useCallback(() => {
    const o = offsetRef.current;

    for (let i = 0; i < TOTAL; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const angleRad = angleToRad(getAngle(i, o));
      const x     = Math.sin(angleRad) * RADIUS;
      const z     = Math.cos(angleRad) * RADIUS;
      const depth = (z + RADIUS) / (RADIUS * 2);

      el.style.transform =
        `translate(-50%, -50%) translateX(${Number(x.toFixed(3))}px) ` +
        `translateZ(${Number(z.toFixed(3))}px) scale(${Number((0.72 + depth * 0.35).toFixed(4))})`;
      el.style.opacity = String(Number((0.35 + depth * 0.65).toFixed(4)));
      el.style.zIndex = String(Math.round(depth * 100));
      el.style.transition = animatingRef.current
        ? "none"
        : "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease";
    }

    // Only when the front card actually changes — not on every frame.
    const next = getActiveIndex(o);
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
  }, []);

  /* After every render, before paint. React re-renders (an `active` change) rewrite
     the style attribute from the JSX below, which is always the offset-0 geometry —
     so this immediately restores the real rotation. Running in a layout effect means
     the reset never reaches the screen. */
  useLayoutEffect(() => {
    paint();
  });

  const applyInertia = useCallback(() => {
    function step() {
      if (Math.abs(velocityRef.current) < 0.05) {
        // Settled: hand the eased transition back for arrows and dots.
        animatingRef.current = false;
        paint();
        return;
      }
      velocityRef.current *= 0.93;
      offsetRef.current += velocityRef.current;
      paint();
      rafRef.current = requestAnimationFrame(step);
    }
    step();
  }, [paint]);

  /* ── Gesture handling ─────────────────────────────────────────────────────────
   *
   * The important thing here is what pointerdown *doesn't* do: it does not call
   * `setPointerCapture`. It used to, and that single line was why not one of the eleven
   * cards navigated. Capturing on the stage container redirects every subsequent event
   * for that pointer to the container — including `mouseup`, and therefore the `click`,
   * whose target the browser computes from where the press and the release landed.
   * Measured: `pointerdown` and `mousedown` arrived at the card with the right href,
   * then `mouseup` and `click` both arrived at the stage `<div>` with no anchor above
   * them. The `<Link>` was never told it had been clicked, so the URL never changed.
   *
   * Capture is still needed — without it a drag dies the moment the pointer leaves the
   * stage — so it is acquired lazily, at the instant movement passes DRAG_SLOP. That
   * one change settles both the click bug and the tap/swipe question with the same
   * mechanism, and in the right direction each time: a tap never captures, so its click
   * reaches the `<Link>` and navigates; a swipe captures, so the browser's own
   * retargeting suppresses the click for us. No timers, no synthetic events, no
   * guessing at intent from velocity after the fact. */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerId.current   = e.pointerId;
    dragging.current    = false;
    startX.current      = e.clientX;
    lastX.current       = e.clientX;
    dragDistance.current = 0;
    velocityRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;

    const travelled = Math.abs(e.clientX - startX.current);
    if (travelled > dragDistance.current) dragDistance.current = travelled;

    if (!dragging.current) {
      if (travelled <= DRAG_SLOP) return;
      /* Threshold crossed: this is a drag. Take capture now, and re-baseline from the
         current position so the slop is absorbed rather than applied as a jump. */
      dragging.current = true;
      lastX.current    = e.clientX;
      animatingRef.current = true;
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    const dx      = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velocityRef.current = dx * 0.18;
    offsetRef.current += dx * 0.18;
    paint();
  }, [paint]);

  const onPointerUp = useCallback(() => {
    pointerId.current = null;
    if (!dragging.current) return;   // a tap: leave the click alone
    dragging.current = false;
    setIsDragging(false);
    rafRef.current   = requestAnimationFrame(applyInertia);
  }, [applyInertia]);

  /** Shortest-path rotation to bring card `index` to the front. Shared by the arrows'
   *  neighbours, the dot indicators and keyboard focus, so all three agree on which way
   *  round the ring is nearer — and so none of them owns a private copy of the maths. */
  const rotateTo = useCallback((index: number) => {
    const step    = 360 / TOTAL;
    const current = ((offsetRef.current % 360) + 360) % 360;
    const target  = ((TOTAL - index) * step) % 360;
    let   delta   = target - current;
    if (delta > 180)  delta -= 360;
    if (delta < -180) delta += 360;
    animatingRef.current = false;
    offsetRef.current += delta;
    paint();
  }, [paint]);

  const rotate = useCallback((dir: 1 | -1) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    velocityRef.current = 0;
    animatingRef.current = false;
    offsetRef.current += dir * (360 / TOTAL);
    paint();
  }, [paint]);

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
            /* Horizontal gestures are ours, vertical ones stay the page's. Without
               this the browser owns the whole gesture on a touch screen and cancels
               the pointer stream mid-swipe; with `none` instead of `pan-y` the page
               would stop scrolling wherever a finger happened to land on the
               carousel, which is a worse bug than the one being fixed. */
            touchAction: "pan-y",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {CATEGORIES.map((cat, i) => {
            const angleDeg = getAngle(i, 0);
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
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                style={{
                  position:  "absolute",
                  top:       "50%",
                  left:      "50%",
                  width:     `${CARD_W}px`,
                  height:    `${CARD_H}px`,
                  /* One line, and rounded — both halves of that are hydration
                     fixes, and this is the "1 Issue" the dev overlay reports on
                     the home page.

                     A template literal broken across source lines sends its
                     newlines and indentation into the style attribute. The browser
                     stores the declaration normalized to a single line, so React
                     compares its own multi-line string against the normalized one,
                     finds them different, and logs a mismatch it says it "won't
                     patch up" — leaving the server's transform in place on a
                     carousel whose whole job is to be transformed.

                     Precision is the same bug wearing a different hat: CSS
                     serializes a raw float like 0.46217026146778234 back as
                     0.46217, which will never equal what React expects. So every
                     number that reaches the attribute is rounded to a precision
                     CSS round-trips exactly, and passed through Number() so a
                     trailing zero cannot reintroduce the difference. */
                  transform:
                    `translate(-50%, -50%) translateX(${Number(x.toFixed(3))}px) ` +
                    `translateZ(${Number(z.toFixed(3))}px) scale(${Number(scale.toFixed(4))})`,
                  opacity:   Number(opacity.toFixed(4)),
                  zIndex:    Math.round(depth * 100),
                  transition:
                    "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
                  willChange: "transform, opacity",
                }}
              >
                {/* ── The card ─────────────────────────────────────────────────
                    A real `<Link>` filling the card, which it already was — the two
                    changes here are what make that link actually reachable.

                    `bg-surface-dark` is the fix for the wrong-destination bug, and it
                    is worth spelling out because it looks like a cosmetic line. The
                    card had no background at all: the photograph covered the top ~77%
                    and the label strip below it was transparent. So on a coverflow
                    where cards overlap, the front card's label area was a window —
                    you could see the card *behind* through it, while the front card,
                    being on top, owned the hit test. Measured on eight of the eleven:
                    the visible words "Hard Tennis Bat" sat over English Willow's
                    photograph, and clicking them went to English Willow. The class is
                    `#0b0a09`, which is the exact colour this section already paints,
                    so on the front card it is pixel-identical; what it changes is that
                    the back card no longer shows through, and "what you can see" and
                    "what you will get" become the same card by construction.

                    `tabIndex` is gone: it was `isActive ? 0 : -1`, which took ten of
                    the eleven categories out of the tab order entirely. Every card is
                    focusable now, and focusing one off the front rotates it forward
                    (see `onFocus`) so a keyboard user is never operating a control
                    they cannot see. */}
                <Link
                  href={cat.href}
                  draggable={false}
                  aria-label={`Shop ${cat.label}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border",
                    "bg-surface-dark no-underline transition-all duration-300",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    isActive
                      ? "border-[#9a7b4f]/60 shadow-[0_0_40px_rgba(154,123,79,0.18)]"
                      : "border-white/[0.07]",
                  )}
                  /* Keyboard focus brings the card to the front; a mouse click must
                     not. `:focus-visible` is exactly that distinction — true when the
                     browser judges focus to have come from the keyboard, false on a
                     click — and the difference matters here: rotating on click would
                     move the card out from under the cursor between `mousedown` and
                     `mouseup`, which is the same class of bug as the capture problem
                     above. The pointer check is the belt to that braces. */
                  onFocus={(e) => {
                    if (pointerId.current !== null) return;
                    if (!isActive && e.currentTarget.matches(":focus-visible")) {
                      rotateTo(i);
                    }
                  }}
                  /* A backstop, not the mechanism: a gesture past DRAG_SLOP has
                     already taken pointer capture, and the browser retargets the
                     click away from this anchor by itself. This says the same thing
                     declaratively, so "a swipe must not navigate" is visible in the
                     component rather than implied by a call three functions away. */
                  onClick={(e) => {
                    if (dragDistance.current > DRAG_SLOP) e.preventDefault();
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

        {/* ── Dot indicators ──
            The button is the touch target and the span inside it is the dot, which
            is the only way to satisfy both halves of the audit: a 6px dot grown to
            44px would be a row of ten fat lozenges dominating the section, and a
            44px row of 6px dots is a Fitts's Law failure. So the target is 44px tall
            and at least 24px wide with no visible box, and the dot inside it grows
            from 6px to 10px (18px when active) with a brighter idle colour.

            `-mx-1` cancels the outer half of the first and last target so the row
            stays optically centred under the carousel: the targets are wider than
            the dots they contain, and that padding would otherwise read as a gap. */}
        <div className="mt-10 -mx-1 flex justify-center">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.slug}
              type="button"
              aria-label={`Go to ${cat.label}`}
              /* The dots are a control for the carousel, not a tab strip, so the
                 current one is announced with aria-current rather than by leaving
                 assistive tech to infer it from the colour. */
              aria-current={i === active}
              onClick={() => rotateTo(i)}
              className="group flex h-11 min-w-6 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  i === active
                    ? "w-[18px] bg-[#9a7b4f]"
                    : "w-2.5 bg-white/30 group-hover:bg-white/60",
                )}
              />
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
