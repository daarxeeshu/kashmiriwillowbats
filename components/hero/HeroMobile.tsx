"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { HeroParticles } from "./HeroParticles";

/* ═══ The hero below 768px ══════════════════════════════════════════════════════
 *
 * A separate composition, not the desktop stage with smaller numbers. The desktop
 * hero is a six-phase film: the headline is at opacity 0 until 16% of the scroll
 * track and the CTAs until 86%, because on a wide screen the viewer is *watching*
 * a reveal. On a phone that same schedule means the first viewport is a dark
 * rectangle with a 91px sliver of bat in it and nothing else — which is exactly
 * what it was doing.
 *
 * So this is a plain flow layout, and that choice is doing the real work: the six
 * elements are laid out by the box model in a column, none of them is positioned,
 * and the bat's band is `flex-1`, so the composition cannot put anything outside
 * the viewport at any width. It shrinks the bat instead.
 *
 * Three rules follow from the failure it replaces:
 *
 *   Nothing here is gated on scroll. Every element is at its resting opacity the
 *   moment it paints. Scroll only ever moves things — it never decides whether
 *   they exist.
 *
 *   The entrance is CSS, and no element's resting state is invisible. The column
 *   fades in as one block (.hero-fade-in) and the items rise individually
 *   (.hero-in) — the fade has no delay and the staggered part touches only
 *   transform, so the worst an animation that never runs can do here is leave
 *   something fifteen pixels low. See globals.css for why that split matters.
 *
 *   The bat is tilted rather than scaled up. The asset is 431x1526 — 1:3.54 — so an
 *   upright bat wide enough to read on a phone would be taller than the phone. The
 *   lean converts spare length into width and lives in CSS (.hero-bat-tilt) because
 *   it has to respond to viewport height, not width — see globals.css.
 *
 * ── The camera ──
 * Within those rules there is still room for the thing the desktop stage is for,
 * and this now has it: an 80svh track that pushes the bat forward, lifts the whole
 * composition and warms the pool. What it deliberately does not do is any of the
 * desktop film's *staging* — no spec panels,
 * no macro blow-up, no headline entrance, no clip-path frame. It is one continuous
 * move, which is why it holds up on a phone where the desktop sequence would not.
 *
 * Its size is set by clearances, not by eye, and the binding one is underneath the
 * bat. The bat's band is `flex-1` between the type and the buttons, so it is already
 * about as tall as the room allows — and how much slack is left below it depends on
 * which rung of the tilt ladder the viewport is on, because a shorter screen leans
 * the bat further and makes it squat and wide. Measured at rest: 417px tall with 35px
 * of slack at 390x844, 252px with 8px at 360x640, and 168px with just 2px at 320x568.
 *
 * One thing follows, and it is the whole camera:
 *
 *   The zoom grows the bat from its toe, not its centre. `transformOrigin: 50% 100%`
 *   puts the anchor on the band's bottom edge, so scale cannot move the bottom of the
 *   bat at all — every pixel of new height goes up into the empty stage. That is what
 *   makes one scale value safe on a 35px slack and a 2px one alike. A centred origin
 *   has to be re-tuned per height and still fails; see the note on the origin below.
 *
 * It used to be two: the zoom was paired with a 5deg straighten, suppressed on the
 * shortest rung because rotation is not origin-proof the way scale is. That move is
 * gone — not for clearance, but because it was narrowing the bat while the zoom was
 * widening it, and winning. The measurement is with `batScale` below.
 *
 * The type then rises at the rate the zoom lifts the bat's top edge, so the gap to the
 * support line holds across the track, and stops short of sliding the eyebrow under
 * the header. Every one of those three was violated by an earlier, larger version of
 * this move — see the notes on each value below.
 */

/* The `useShortestRung` subscription that used to live here is gone with the rotation
   it existed to suppress — it watched `(max-height: 620px)` for the one rung where a
   straighten would have swung the bat into the button. Scale from a toe origin is safe
   at every rung without asking, so the component no longer needs to know the viewport
   height at all, and the hero drops a matchMedia listener on every phone. */

/** Entrance stagger, seconds. Order is the reading order of the column. Safe to
 *  delay because these drive transform-only keyframes. */
const DELAY = {
  eyebrow: 0.05,
  heading: 0.14,
  support: 0.26,
  bat: 0.2,
  cta: 0.42,
} as const;

export function HeroMobile({ progress }: { progress: MotionValue<number> }) {
  /* Spring-smoothed and reduced-motion-parked upstream in HeroSequence, so this
     component has no scroll wiring of its own — one `useScroll` and one spring
     serve both compositions. */

  // The particle bands share the desktop curve, so feed them only its calm head.
  // Past ~0.3 that curve starts the dolly blow-past, which has no counterpart here.
  const drift = useTransform(progress, [0, 1], [0, 0.28]);

  /* ── Camera ──
     Peaks at 0.62 and settles a shade back, so the move decelerates into its end
     instead of stopping dead against the end of the track.

     8%, and the ceiling is set by the shortest phone rather than by taste. Because the
     origin is the toe (see below) the scale cannot reach the buttons at all, so what
     limits it is the top of the frame and the reading: past about 10% the blade starts
     to crowd the support line on the tall rungs, and the bat stops looking like a
     product on a stage. 11% about the *centre* was the first attempt and it measured
     clean at 390x844 while putting the toe 3-7px inside the SHOP NOW button at both
     360x640 and 320x568 — the same value, three different results, which is what a
     centred origin costs. */
  const batScale = useTransform(progress, [0, 0.62, 1], [1, 1.06, 1.08]);
  /* ── Why there is no straighten any more ──
     There was one: 0 -> 5deg toward upright, off on the shortest rung because at a
     48deg lean it swung the bat's low corner into the button. The clearance reasoning
     was right, but it was guarding a move that was working against the zoom.

     Rotating a leaning object toward upright makes its bounding box narrower and
     taller. Measured across the track at 375x812, with the 8% zoom running: the bat
     went from 210px wide to 197px. It was scaled up 8% and still ended 6% narrower —
     the 5deg cost about 13% of width on its own. So the thing the camera is for, the
     product coming forward, was being cancelled in the one dimension a phone has to
     spare, and what actually read on screen was a slight recede.

     Zoom alone cannot buy the width back either: it would take ~21% to overcome the
     rotation, and the documented ceiling here is ~10% before the blade crowds the
     support line. So the rotation goes and the zoom stays. The bat now widens 8%
     across the track instead of narrowing 6% — a 14% swing toward the intended read,
     with the toe still pinned by `transformOrigin` and the clearance to SHOP NOW
     unchanged at every rung (verified at 375x812, 360x640 and 320x568).

     It costs one transform property per frame, which is the cheap direction. */

  /* The type rises and the bat does not, which is where the parallax comes from: the
     headline slides up past a planted product rather than the pair of them moving
     together. It also has to rise at least as fast as the zoom lifts the bat's top
     edge, or the handle closes on the support line — 4svh is 34px at 390x844 against
     the 33px the zoom adds, and the gap only widens from there on shorter screens.
     Going further is not free either: another 1svh slides the eyebrow under the
     header, which is where the first tuning of this put it. */
  const typeY = useTransform(progress, [0, 1], ["0svh", "-4svh"]);
  /* Recedes, never disappears, and never starts hidden: full for the first half,
     then to 0.5 as the viewer is already on their way to the next section. */
  const typeOpacity = useTransform(progress, [0, 0.55, 1], [1, 0.9, 0.5]);
  const warmth = useTransform(progress, [0, 1], [0.6, 1]);

  return (
    /* Sticky rather than absolutely filling the section, which is what gives the
       camera a track to run on: the section is 180svh, this is one viewport of it,
       and the 80svh difference is the move. `overflow-hidden` belongs here and not
       on the section — on an ancestor it would cancel the stickiness — and it is
       what keeps the scaled bat from ever reaching the document's scrollWidth. */
    <div className="sticky top-0 h-[100svh] w-full overflow-hidden md:hidden">
      {/* ── Environment. Same tokens as the desktop stage. The warm pool lifts
              with the camera: the bat coming forward should look like it is
              coming into the light, not dragging its own lighting along. ── */}
      <div className="hero-void absolute inset-0" />
      <motion.div className="hero-warmth absolute inset-0" style={{ opacity: warmth }} />
      <HeroParticles progress={drift} />
      <div className="hero-vignette pointer-events-none absolute inset-0 z-40" />
      <div className="hero-grain pointer-events-none absolute inset-0 z-40 opacity-40 mix-blend-soft-light" />

      {/* ── The column ──
              Vertical margins are in svh, not rem, so a 568px-tall phone tightens
              the type instead of squeezing the bat out of the frame. The top pad
              clears the announcement bar and header, which float over this.

              The bottom pad is larger than it looks like it needs to be, for two
              reasons. The hero is pulled up by --header-height + --announcement-height,
              but the announcement bar wraps to two lines below about 430px, so the
              real chrome is ~11px taller than the pull-up and the section hangs that
              far past the fold — without the pad, EXPLORE was clipped along its
              bottom edge. And the site's floating WhatsApp button is anchored to the
              viewport at bottom-5 right-5, so anything sitting flush with the bottom
              of the first screen ends up underneath it. */}
      <div
        className={
          "hero-fade-in relative z-30 flex h-full flex-col items-center px-5 text-center " +
          "pt-[calc(var(--header-height)+var(--announcement-height)+1.4svh)] " +
          "pb-[calc(env(safe-area-inset-bottom,0px)+5svh)]"
        }
      >
        <motion.div
          className="flex w-full flex-col items-center"
          style={{ y: typeY, opacity: typeOpacity }}
        >
          {/* 12px floor, same as the desktop eyebrow, and this is the copy that
              actually renders on a phone — the audit that flagged the 10.5px one
              cited mobile readability but pointed at the desktop stage, which is
              `hidden` below 768px. Tracking eased 0.2em -> 0.18em so the wider
              glyphs still fit a 320px screen: at 12px/0.2em the line measures
              ~253px against 280px of usable width, which is close enough that a
              longer eyebrow would wrap. */}
          <span
            className="hero-in inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60"
            style={{ animationDelay: `${DELAY.eyebrow}s` }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Handcrafted in Kashmir
          </span>

          {/* Its own h1, and the desktop stage keeps its own. Exactly one of the two
              is ever rendered, so only one is ever in the accessibility tree. */}
          <h1
            className="hero-in mt-[1.7svh] text-[clamp(2.15rem,10vw,3rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-white"
            style={{ animationDelay: `${DELAY.heading}s` }}
          >
            Kashmiri
            <span
              className="mt-0.5 block"
              style={{
                backgroundImage:
                  "linear-gradient(96deg, #f4e9d4 0%, #cdb489 48%, #8d7550 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Willow Bats
            </span>
          </h1>

          <p
            className="hero-in mt-[1.8svh] max-w-[20rem] text-[13.5px] leading-relaxed text-white/55"
            style={{ animationDelay: `${DELAY.support}s` }}
          >
            Crafted from Kashmir. Built for the modern game.
          </p>
        </motion.div>

        {/* ── The product ──
                `flex-1 min-h-0` is what guarantees the column fits: the bat gets
                whatever height is left after the type and the buttons, and never
                pushes them off screen. 92% of that leaves room for the tilt, which
                makes the bounding box about 4% taller than the bat itself. */}
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          {/* Four elements, one transform each — camera, entrance rise, idle float,
              then the tilt on the image. Sharing an element would let one silently
              win, and the camera is the one that would lose: the tilt is a class and
              the float is a keyframe, both of which overwrite `transform` wholesale.
              The band itself deliberately has none. It held a small upward drift for
              a while, and that drift was the thing dragging the toe into the button on
              short viewports — a translate moves the bottom edge, which is exactly
              what the origin below is arranged to avoid. */}
          <motion.div
            className="h-full"
            style={{
              scale: batScale,
              /* The toe is the anchor, not the centre — this one number is what makes
                 the move safe at every viewport height. Growth from a bottom origin is
                 entirely upward, into the empty stage, so the distance from the bat to
                 SHOP NOW is a constant no matter what the scale does or which rung of
                 the tilt ladder the viewport is on. A centred origin has to be re-tuned
                 per height and still fails: at 11%/50% the toe measured 23px clear at
                 390x844 and 3-7px *inside* the button at 360x640 and 320x568, because
                 the short-viewport rungs leave almost no slack under the bat.
                 It also reads better. A bat that grows from its toe is a bat being
                 raised toward the viewer; one that grows from its middle is an image
                 being scaled. */
              transformOrigin: "50% 100%",
            }}
          >
            <div
              className="hero-bat-in h-full"
              style={{ animationDelay: `${DELAY.bat}s` }}
            >
              <div className="animate-hero-float h-full">
                <Image
                  src="/hero/bat.png"
                  alt="Kashmiri willow cricket bat, front face"
                  width={431}
                  height={1526}
                  priority
                  // Same source and the same `sizes` as the desktop stage, so this is
                  // one request and one decode for both compositions.
                  sizes="480px"
                  className="hero-bat-tilt h-[95%] w-auto drop-shadow-[0_26px_44px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── CTAs ──
                Stacked, full width. Side by side they need 291px of the 320px a
                small phone has after padding, and the brief lists them on separate
                lines anyway. */}
        <div
          className="hero-in mt-[2.2svh] flex w-full max-w-[19rem] flex-col gap-2.5"
          style={{ animationDelay: `${DELAY.cta}s` }}
        >
          <Link
            href="/categories/kashmir-willow-bats"
            className={
              "inline-flex h-12 items-center justify-center rounded-full bg-white px-6 " +
              "text-[12px] font-semibold uppercase tracking-[0.16em] text-[#111] " +
              "shadow-[0_14px_38px_-16px_rgba(255,255,255,0.5)] " +
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
            }
          >
            Shop Now
          </Link>
          <Link
            href="/brands"
            className={
              "hero-glass inline-flex h-12 items-center justify-center rounded-full px-6 " +
              "text-[12px] font-semibold uppercase tracking-[0.16em] text-white/85 " +
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
            }
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
