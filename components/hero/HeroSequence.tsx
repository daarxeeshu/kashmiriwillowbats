"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { HeroMobile } from "./HeroMobile";
import { HeroParticles } from "./HeroParticles";
import { SpecCard } from "./SpecCard";
import { HUB, SPEC_CARDS } from "./hero-data";

/* ═══ The cinematic hero ═══════════════════════════════════════════════════════
 *
 * One pinned stage, one scroll value, six phases. The tall outer section is the
 * scroll track; the inner `sticky` stage never moves, so what the viewer reads as
 * a camera is entirely transforms on the layers inside it.
 *
 *   00.0–16   reveal    the void, the bat, nothing else
 *   16–30     headline  type enters from the left, glass slab rises behind
 *   30–50     specs     annotation panels land, connectors draw to the blade
 *   50–64     push      camera dollies through the panels, they disperse
 *   64–78     macro     blade and sticker fill the frame
 *   78–100    settle    pull back, warm light, nav and CTAs arrive
 *
 * Two design rules hold the whole thing together.
 *
 * Nothing animates through React. `useScroll` gives a MotionValue, `useSpring`
 * smooths it, and every layer reads that through `useTransform` — so a scroll
 * from 0 to 1 re-renders this component exactly zero times. That is the brief's
 * "do not tie heavy React state to every scroll event", and it is also why the
 * spring can stand in for a smooth-scroll library: the *animation* is eased
 * while the page's own scrolling stays native, which is what makes fast flicks
 * feel like scrubbing a timeline rather than skipping frames.
 *
 * And responsiveness is CSS, never JavaScript. No `matchMedia` decides what to
 * render, because a JS breakpoint check produces one tree on the server and
 * another on the client. Breakpoints only ever change values or visibility.
 *
 * That last rule is why the phone hero is a sibling component rather than this one
 * with smaller numbers. Below 768px the whole scroll film is `display:none` and
 * `HeroMobile` takes the stage — see its own header for why. The six phases above
 * exist to be *watched*, and the schedule that makes them work (headline at 16%,
 * CTAs at 86%) is precisely what left a phone's first viewport empty. Both trees
 * are in the markup at every width and CSS picks one, so there is no hydration
 * branch and nothing swaps after mount.
 */

/* ── Camera keyframes ─────────────────────────────────────────────────────────
   Measured off the reference sequence in design/hero/sequence/ (300 frames).

   X is in vw and Y in svh, both applied *before* scale in the transform, so they
   stay screen-space regardless of how close the camera is. */

const CAM = [0, 0.16, 0.3, 0.5, 0.62, 0.7, 0.78, 0.88, 1];

/* ── The resolution budget, and why the scale table is inverted ───────────────
   `SHOTS` is the camera as it reads on screen: 1 at rest, 4.9 at the macro peak.
   It is divided through by that peak below, and the bat is laid out 4.9x larger
   to match — so the composition is identical and every camera value is a scale
   *down*.

   The reason is a magnified layer, and it is worth being precise about which
   half of that is measured and which half is not.

   Measured, and the dominant term: at the 4.9 peak the bat paints ~573 CSS px
   wide, which on a 1.25 DPR display is ~716 device pixels asked of a 431px file
   — a 1.66x upscale, and 2.66x on a 2 DPR screen. Nothing in this file can move
   that number. The note this comment replaced put it at "roughly 1.3x native —
   visibly crisp", which arrived at 1.3 by leaving DPR out; that is the arithmetic
   error, and the softness at the peak follows from it directly. There are no more
   real pixels to be had: design/hero/herobat.png is the master at 1024x1536 and
   the bat trims out of it at 431 wide.

   Not measured, and the reason for the inversion: a layer whose box is ~117px
   and whose transform then magnifies it 4.9x invites the compositor to raster
   small and stretch the bitmap on the GPU, which is a second and much uglier
   blur on top of the first. Laying the box out at the peak means every camera
   value is a downscale, which filters cleanly, and removes that failure mode by
   construction. It is the standard shape for this problem — but it adds no
   pixels, and the browser pane could not composite when this was written, so it
   was never confirmed against the symptom. Treat it as sound-by-construction,
   not as verified.

   If the peak has to be pixel-exact rather than merely clean, the lever is the
   peak itself: 431 / (117 x 1.25) = 2.95, which is already SHOTS[4]. Capping
   there is native-sharp at 1.25 DPR and ~1.8x at 2. That is an art-direction
   call — a shorter push for a harder image — and deliberately not made here.

   The cost of the inversion is texture memory — the bat rasters at roughly
   573x2025 — which is affordable because this stage is desktop-only; the phone
   hero is a separate component and does not carry the push. */
const BAT_PEAK = 4.9;
const BAT_SCALE_SHOTS = [1, 1.13, 1.3, 1.61, 2.95, 4.9, 2.7, 1.7, 1.57];
const BAT_SCALE = BAT_SCALE_SHOTS.map((s) => s / BAT_PEAK);
// Opens right of centre, per the brief and the reference's first frame. The stage
// centres the bat, so this is the offset from dead centre — 2.5vw is about a third
// of the bat's own width at rest, enough to read as composed rather than as a
// mistake, and it leaves the left of the frame empty for the headline to enter into.
const BAT_X = ["2.5vw", "2.8vw", "3.4vw", "4.5vw", "2vw", "-1vw", "3vw", "9vw", "11vw"];
// The sticker sits at 0.486 of the asset's height, so at the 4.9 peak (225svh of
// bat) its centre is 3.2svh above the frame's — hence the nudge down, and only
// there. Everything else is a hair of drift to keep the bat from feeling nailed
// to the middle of the screen.
const BAT_Y = [
  "0svh",
  "-1.2svh",
  "-2.2svh",
  "-2.8svh",
  "0.5svh",
  "3.2svh",
  "1.2svh",
  "0svh",
  "0svh",
];
// Plane rotation, kept under 3°: the asset is a flat render, so this is a lean,
// not a turn, and past a few degrees a lean starts to look like a mistake.
const BAT_ROTATE = [0, -0.6, -1.2, -1.8, -2.4, -3, -2, -0.8, -0.6];
// The actual turn. Capped at ±8° — beyond about 12° a flat cutout under
// perspective stops reading as a solid object and starts reading as a card.
const BAT_ROTATE_Y = [8, 5, 1, -2, -4, -6, -3, 4, 6];
const BAT_ROTATE_X = [1.5, 1, 0.5, 0, -1, -1.5, -0.5, 0.5, 1];

/* bat-glow.png is the full frame of the master render downscaled, while bat.png
   is the master trimmed to x 291..722, y 10..1536 of a 1024x1536 canvas. These
   percentages put the glow back in register with the bat, expressed against the
   bat's own box so they survive every scale the camera applies. Derived from the
   numbers scripts/generate-hero-bat.mjs prints, not eyeballed. */
const GLOW_BOX = {
  left: "-67.52%",
  top: "-0.66%",
  width: "237.59%",
  height: "100.66%",
} as const;

const CONNECTED = SPEC_CARDS.filter((c) => c.anchor);

/** SHOP NOW, drifting a few pixels toward the cursor. */
function MagneticLink({
  href,
  children,
  className,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 250, damping: 20, mass: 0.28 });
  const y = useSpring(rawY, { stiffness: 250, damping: 20, mass: 0.28 });

  return (
    <motion.div style={{ x, y }} className="inline-flex">
      <Link
        href={href}
        className={className}
        onPointerMove={(e) => {
          if (disabled || e.pointerType !== "mouse") return;
          // A layout read, but only on a 12rem button and only while the cursor
          // is inside it — not on every stage-wide move.
          const r = e.currentTarget.getBoundingClientRect();
          rawX.set((e.clientX - (r.left + r.width / 2)) * 0.16);
          rawY.set((e.clientY - (r.top + r.height / 2)) * 0.22);
        }}
        onPointerLeave={() => {
          rawX.set(0);
          rawY.set(0);
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

/* ── Reduced motion ───────────────────────────────────────────────────────────
   Read as an external store rather than with framer's `useReducedMotion` because
   the answer changes what this component *renders*, not just how fast it moves.

   The preference is unknowable on the server, so `useReducedMotion` returns null
   there and true on the client's first pass. Every layer's opacity and transform
   is a real `style` attribute — `motion` resolves motion values at render time —
   so branching on a value that differs between those two passes emits two
   different sets of styles, and React keeps the server's. `useSyncExternalStore`
   is built for exactly this: the server snapshot is what hydration matches
   against, and React re-renders with the live one immediately after. It also
   makes the preference live, which framer's hook explicitly is not. */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotionSafe() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export function HeroSequence() {
  const wrapRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  /* The spring is the smooth-scroll layer. Native scrolling stays native — no
     wheel hijacking, no scrollbar takeover, no library — and the animation
     trails it with spring physics, so a slow drag scrubs slowly and a flick
     races through without ever tearing. restDelta is tight because a spring that
     settles visibly late leaves the bat drifting after the page has stopped. */
  const smooth = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    mass: 0.35,
    restDelta: 0.0005,
  });

  /* Every layer below reads `progress`, and only this one transform decides what
     feeds it. Under reduced motion it is parked at 1 — the closing composition,
     fully assembled — rather than swapping the tree for a static variant, which
     would remount every layer and shift the layout.

     It is *derived* rather than a value something calls `.set()` on, and both
     halves of that matter.

     Deriving it means the parked frame arrives through a React render.
     `useTransform` recomputes synchronously during render and `motion` resolves
     motion values into the real `style` attribute, so the closing composition is
     in the markup React commits. The version that set a plain motion value from a
     mount effect looked equivalent and was not: `.set()` only *schedules* its
     dependents on the frameloop, and framer's own layout-effect cleanup calls
     `cancelFrame` on exactly that callback — so StrictMode's
     mount → cleanup → remount cancelled the one queued recompute, the re-subscribe
     never recomputed, and the second `set(1)` was a no-op because the value was
     already 1. `progress` read 1 while every layer's inline style sat at f(0):
     an empty stage for anyone with the preference on.

     Reading the preference through `useReducedMotionSafe` above is the other
     half: the branch below only produces the right styles if the value it reads
     is the same on both render passes.

     The finite check is for the mobile breakpoint, where the sticky stage is
     display:none and this section is barely taller than the viewport: a scroll
     track of zero makes framer-motion divide by nothing, and a NaN reaching a
     `useTransform` propagates to every layer as an unparseable transform. */
  const progress = useTransform(smooth, (v) =>
    reduced ? 1 : Number.isFinite(v) ? v : 0,
  );

  /* The phone reads the same spring off the same track — one `useScroll` and one
     spring for both compositions — but parks at 0 rather than 1 under reduced
     motion. On mobile progress 0 *is* the finished composition: every element is
     already at its resting opacity and the camera only ever zooms away from it,
     so 0 is the static hero and 1 would be a needlessly cropped one. That is the
     opposite of the desktop rule directly above, and the asymmetry is the point. */
  const mobileProgress = useTransform(smooth, (v) =>
    reduced || !Number.isFinite(v) ? 0 : v,
  );

  /* ── Cursor ─────────────────────────────────────────────────────────────────
     -1..1 across the viewport. The sticky stage *is* the viewport, so this needs
     no `getBoundingClientRect` — a layout read on every pointer move is the
     classic way to make a smooth page stutter. */
  const rawPX = useMotionValue(0);
  const rawPY = useMotionValue(0);
  const pointerX = useSpring(rawPX, { stiffness: 110, damping: 26, mass: 0.4 });
  const pointerY = useSpring(rawPY, { stiffness: 110, damping: 26, mass: 0.4 });

  /* ── Stage ── */
  const warmth = useTransform(progress, [0.6, 0.78, 1], [0, 0.45, 1]);
  const frame = useTransform(progress, [0.9, 1], [0, 1]);
  const clipPath = useTransform(
    frame,
    (v) => `inset(${(v * 12).toFixed(2)}px round ${(v * 24).toFixed(2)}px)`,
  );

  /* ── Bat ── */
  const batScale = useTransform(progress, CAM, BAT_SCALE);
  const batX = useTransform(progress, CAM, BAT_X);
  const batY = useTransform(progress, CAM, BAT_Y);
  const batRotate = useTransform(progress, CAM, BAT_ROTATE);
  const batRotateY = useTransform(progress, CAM, BAT_ROTATE_Y);
  const batRotateX = useTransform(progress, CAM, BAT_ROTATE_X);

  // Cursor parallax, folded into the same transform as the camera so the two
  // add instead of one overwriting the other. Falls to nothing at the macro
  // peak: a mouse nudge on a bat filling two viewport heights is a lurch.
  const cursorWeight = useTransform(progress, [0.5, 0.64, 0.78, 0.94], [1, 0.15, 0.15, 1]);
  const batCursorX = useTransform([pointerX, cursorWeight], ([p, w]) =>
    (p as number) * (w as number) * -14,
  );
  const batCursorY = useTransform([pointerY, cursorWeight], ([p, w]) =>
    (p as number) * (w as number) * -9,
  );

  /* Trimmed down from a first pass that ran roughly a third hotter. The glow is a
     rim light, and the willow's own pale handle sits right where it is brightest —
     past about 0.3 at rest the two combine and the handle reads as lit from within
     rather than lit from behind. */
  const glowOpacity = useTransform(
    progress,
    [0, 0.5, 0.7, 0.86, 1],
    [0.2, 0.26, 0.42, 0.3, 0.27],
  );

  /* ── Glass slab behind the product ── */
  const slabOpacity = useTransform(progress, [0.26, 0.34, 0.5, 0.6], [0, 1, 1, 0]);
  const slabScale = useTransform(progress, [0.26, 0.5, 0.62], [0.96, 1, 1.4]);

  /* ── Connectors ── */
  const linkOpacity = useTransform(progress, [0.3, 0.37, 0.5, 0.57], [0, 1, 1, 0]);

  /* ── Type ─────────────────────────────────────────────────────────────────── */
  const headOpacity = useTransform(
    progress,
    [0.16, 0.27, 0.5, 0.57, 0.8, 0.9],
    [0, 1, 1, 0, 0, 1],
  );
  const headX = useTransform(
    progress,
    [0.16, 0.27, 0.5, 0.57, 0.8, 0.9],
    ["-5vw", "0vw", "0vw", "-7vw", "-7vw", "0vw"],
  );
  // CTAs belong to the closing composition only — they are the one element that
  // never appears during the cinematic run, so the product holds the frame.
  const ctaOpacity = useTransform(progress, [0.86, 0.97], [0, 1]);
  const ctaY = useTransform(progress, [0.86, 0.97], ["16px", "0px"]);

  const cueOpacity = useTransform(progress, [0, 0.06], [1, 0]);

  /* The closing prop. Enters late and low, at the toe of the bat. */
  const ballOpacity = useTransform(progress, [0.82, 0.96], [0, 1]);
  const ballY = useTransform(progress, [0.82, 0.96], ["26px", "0px"]);

  /* Contact shadow. Gone entirely through the macro shot, where the frame is
     inside the blade and a shadow would be nowhere near it. */
  const shadowOpacity = useTransform(
    progress,
    [0, 0.5, 0.64, 0.82, 1],
    [0.9, 0.7, 0, 0.5, 0.8],
  );

  /* ── Chrome hand-off ────────────────────────────────────────────────────────
     The site header and announcement bar sit above this section in the document,
     and the hero is pulled up underneath them, so they float over the stage.
     While the sequence is running they go transparent; at the settle they take
     on glass. Both are CSS rules keyed off this attribute (globals.css) — the
     alternative was a second nav built from invented links, which the reference
     has and this site does not.

     The marker element does the sensing. An IntersectionObserver fires only when
     it crosses the viewport edge, so this costs nothing during a scroll, and
     `boundingClientRect.top <= 0` is what distinguishes "scrolled past" from
     "not yet reached" — `isIntersecting` alone is false in both directions. */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.heroStage = "active";

    const mark = markRef.current;
    const io = mark
      ? new IntersectionObserver(([entry]) => {
          root.dataset.heroStage =
            entry.boundingClientRect.top <= 0 ? "settled" : "active";
        })
      : null;
    io?.observe(mark!);

    return () => {
      io?.disconnect();
      delete root.dataset.heroStage;
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      data-hero-sequence=""
      /* aria-label rather than aria-labelledby: two compositions live in here and
         each owns an <h1>, so pointing at one by id would be pointing at an
         element that is display:none on the other breakpoint — and the text
         alternative computation happily reads hidden referenced nodes, which is
         how you end up labelling the mobile section with the desktop headline. */
      aria-label="Kashmiri Willow Bats"
      /* The negative margin pulls the stage up under the header and announcement
         bar so the first viewport is a full-bleed 100vh of dark studio, with the
         chrome floating over it. It shortens the document by the same amount
         rather than leaving a gap, because everything after the hero shifts with
         it. */
      className={cn(
        "relative -mt-[calc(var(--header-height)+var(--announcement-height))]",
        /* 180svh on mobile against 280 on desktop, so both breakpoints have a
           track and neither has the other's. 80svh of travel is about one flick
           — enough to read as a camera push, short enough that nobody scrolls
           through empty stage to reach the next section. The phone camera only
           zooms and drifts; it never gates content on progress, so the first
           viewport is complete whether you scroll or not. */
        "h-[180svh] border-b border-border md:h-[280svh]",
      )}
      /* Deliberately darker than --hero-void: this is only ever visible through
         the inset frame the clip-path opens at the very end, and if it matched
         the stage the frame would not exist. */
      style={{ backgroundColor: "#020304" }}
    >
      {/* Sits exactly where progress reaches 0.88, measured from this section's
          own height, so the chrome hand-off lands with the settle rather than at
          a hardcoded scroll distance. `top` is in CSS (.hero-mark) because the
          two breakpoints need different formulas — see globals.css. */}
      <div
        ref={markRef}
        aria-hidden="true"
        className="hero-mark pointer-events-none absolute left-0 h-px w-px"
      />

      <HeroMobile progress={mobileProgress} />

      <motion.div
        className="sticky top-0 hidden h-[100svh] w-full overflow-hidden md:block"
        style={{ clipPath }}
        onPointerMove={(e) => {
          if (reduced || e.pointerType !== "mouse") return;
          rawPX.set((e.clientX / window.innerWidth) * 2 - 1);
          rawPY.set((e.clientY / window.innerHeight) * 2 - 1);
        }}
        onPointerLeave={() => {
          rawPX.set(0);
          rawPY.set(0);
        }}
      >
        {/* ── Environment ── */}
        <div className="hero-void absolute inset-0" />
        <motion.div className="hero-warmth absolute inset-0" style={{ opacity: warmth }} />

        <HeroParticles progress={progress} />

        {/* Studio glass the bat stands in front of. Weak on purpose — at panel
            strength its 5px backdrop blur would fog the product. */}
        <motion.div
          className="hero-slab rounded-[2rem]"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "40%",
            top: "11%",
            width: "min(32vw, 27rem)",
            height: "78%",
            opacity: slabOpacity,
            scale: slabScale,
          }}
        />

        {/* ── Connectors ──
            One 100x100 user-space box stretched to the stage, so anchors are
            plain percentages and no measurement is needed. non-scaling-stroke is
            what keeps the hairline a hairline under that stretch. */}
        <motion.svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ opacity: linkOpacity }}
        >
          {CONNECTED.map((c) => (
            <line
              key={c.id}
              className={cn(c.showAt && "hidden lg:block")}
              x1={HUB.x}
              y1={HUB.y}
              x2={c.anchor!.x}
              y2={c.anchor!.y}
              stroke="rgba(255,255,255,0.17)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </motion.svg>

        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 ring-1 ring-white/20"
          style={{ left: `${HUB.x}%`, top: `${HUB.y}%`, opacity: linkOpacity }}
        />

        {/* Panels render behind or in front of the bat by their own z-index. */}
        {SPEC_CARDS.filter((c) => c.behind).map((c) => (
          <SpecCard
            key={c.id}
            card={c}
            progress={progress}
            pointerX={pointerX}
            pointerY={pointerY}
          />
        ))}

        {/* ── The product ── */}
        {/* The tablet offset lives here rather than in BAT_X because the camera
            table is in vw and 3vw of a 768px viewport is 23px — nowhere near
            enough to clear the headline, which at that width nearly reaches the
            middle of the frame. It is `--hero-bat-shift` (globals.css) rather
            than a utility class because the contact shadow and the cricket ball
            have to move with it; when only this wrapper knew about the nudge,
            768px put the ball on the blade and left the shadow behind. This
            wrapper carries no other transform, so the camera below is
            unaffected. */}
        <div className="absolute inset-0 z-10 flex translate-x-[var(--hero-bat-shift)] items-center justify-center">
          <motion.div
            /* The opening fade is a CSS animation, not `initial`/`animate`.
               framer-motion drives mount transitions from requestAnimationFrame,
               so an element parked at `initial` when rAF stops ticking — a
               backgrounded tab, a bfcache restore, Safari during momentum scroll —
               stays at opacity 0 with nothing left to move it. That is a bad
               failure mode anywhere and an unacceptable one on the product itself.
               Only opacity is animated here; the camera keeps the transform. */
            className="hero-reveal"
            style={{
              x: batX,
              y: batY,
              scale: batScale,
              rotate: batRotate,
              rotateX: batRotateX,
              rotateY: batRotateY,
              transformPerspective: 1400,
            }}
          >
            {/* Cursor parallax on its own element: framer-motion writes one
                `transform` per element, so folding it into the camera above
                would mean one of the two winning. */}
            <motion.div style={{ x: batCursorX, y: batCursorY }}>
              {/* CSS keyframes, for the same reason — an inline transform would
                  override the animation if they shared an element. Idle float
                  costs no JS frames this way. */}
              <div className="animate-hero-float">
                <div className="relative">
                  {/* Rim light recovered from the master render's discarded
                      alpha-0 pixels. Low opacity is not optional: at full
                      strength this reads as a halo round the bat. */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none"
                    style={{ position: "absolute", ...GLOW_BOX, opacity: glowOpacity }}
                  >
                    <Image
                      src="/hero/bat-glow.png"
                      alt=""
                      width={320}
                      height={480}
                      sizes="760px"
                      className="h-full w-full"
                    />
                  </motion.div>

                  <Image
                    src="/hero/bat.png"
                    alt="Kashmiri willow cricket bat, front face"
                    width={431}
                    height={1526}
                    priority
                    /* Wider than the box needs, and it costs nothing: bat.png is
                       431px, so every candidate at or above that resolves to the
                       same file — Next does not upscale past the source. What it
                       buys is that the request cannot quietly shrink if the
                       layout below is ever retuned. */
                    sizes="640px"
                    /* Laid out at the camera's peak — see BAT_PEAK above — so the
                       raster happens at full size and the camera only ever
                       scales down.

                       No drop-shadow here any more. A `filter` forces its own
                       render surface, which is the second half of the blur this
                       layout exists to avoid, and its 40/60px offsets were tuned
                       against a box 4.9x smaller — at this size they would read
                       as a hairline. The bat is grounded by the contact-shadow
                       ellipse below, which is where that job belonged: the stage
                       is near-black, so a black shadow on the product itself was
                       doing very little of the work. */
                    className="h-[calc(38svh*4.9)] w-auto md:h-[calc(46svh*4.9)]"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Contact shadow. Sits under the bat as a soft ellipse rather than a
            cast shape — the stage has no floor, so a hard shadow would invent
            one and the bat is meant to be floating. `left` carries the same
            tablet shift as the product itself; `-translate-x-1/2` survives
            alongside framer's inline `x` because Tailwind v4 emits the separate
            `translate` property, and the two compose. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-[82%] z-0 h-[7svh] w-[26vw] -translate-x-1/2 rounded-[50%]"
          style={{
            left: "calc(50% + var(--hero-bat-shift))",
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.75) 0%, transparent 72%)",
            opacity: shadowOpacity,
            x: batX,
          }}
        />

        {SPEC_CARDS.filter((c) => !c.behind).map((c) => (
          <SpecCard
            key={c.id}
            card={c}
            progress={progress}
            pointerX={pointerX}
            pointerY={pointerY}
          />
        ))}

        {/* ── Cricket ball ── */}
        {/* Placed off the bat rather than off the stage. The bat's rendered width
            is 0.2824 of its height, and at the closing camera that height is
            46svh x 1.57, so half the bat is 10.2svh — put the ball 7.4svh beyond
            that and it keeps the same gap from the blade on every viewport. It
            also rides `batX`, so it drifts right with the product as the camera
            pulls back instead of standing still while the bat leaves it behind.
            The flat 72% this replaces was measured off a 1440x900 frame and put
            the ball squarely on the blade at 768x1024.

            `lg`, not `md`: between 768 and 1023 the bat is 28vw wide against 13vw
            at 1440, so the whole right margin is 138px and the ball landed at
            91–98% — touching the 12px inset the closing clip-path opens. The two
            left-hand spec panels already drop out at this breakpoint for the same
            reason, so a decorative prop can go with them. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 hidden lg:block"
          style={{
            left: "calc(50% + var(--hero-bat-shift) + 17.6svh)",
            top: "70%",
            width: "clamp(48px, 5.2vw, 78px)",
            opacity: ballOpacity,
            x: batX,
            y: ballY,
          }}
        >
          <Image
            src="/hero/ball.webp"
            alt=""
            width={240}
            height={240}
            className="h-auto w-full"
          />
        </motion.div>

        {/* ── Type and CTAs ── */}
        {/* 7vw of gutter on desktop, tighter on tablet where the frame is narrow
            and the product has moved right to make room. */}
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6 md:justify-start md:px-[4vw] lg:px-[7vw]">
          <motion.div
            /* Capped harder than the desktop 30rem between md and lg: at 768px a
               30rem block reaches 62% across the frame and the support line ran
               under the blade. */
            className="w-full max-w-[19rem] text-center md:text-left lg:max-w-[30rem]"
            style={{ opacity: headOpacity, x: headX }}
          >
            {/* 12px floor. This was 10.5px, which is below the ~12px readability
                threshold — and tracking this wide (0.22em) costs legibility on top
                of the size, because it pushes the letters far enough apart that the
                word stops being read as one shape. The tracking is eased to 0.2em to
                pay for the extra width the larger size brings, so the line still
                fits the 19rem type column at 768px. */}
            <span className="inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Handcrafted in Kashmir
            </span>

            <h1
              id="hero-heading"
              className="mt-5 text-[clamp(2.5rem,6.1vw,4.9rem)] font-semibold leading-[0.94] tracking-[-0.035em] text-white"
            >
              Kashmiri
              <span
                className="mt-1 block"
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

            <p className="mx-auto mt-6 max-w-sm text-[15px] leading-relaxed text-white/55 md:mx-0">
              Crafted from Kashmir. Built for the modern game.
            </p>

            <motion.div
              className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start"
              style={{ opacity: ctaOpacity, y: ctaY }}
            >
              <MagneticLink
                href="/categories/kashmir-willow-bats"
                disabled={reduced}
                className={cn(
                  "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full",
                  "bg-white px-8 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-[#111]",
                  "shadow-[0_16px_44px_-16px_rgba(255,255,255,0.5)] transition-transform duration-300",
                  "hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70",
                )}
              >
                <span className="relative z-10">Shop Now</span>
                {/* Highlight sweep on hover. A transform, so it composites. */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </MagneticLink>

              <Link
                href="/brands"
                className={cn(
                  "hero-glass inline-flex h-12 items-center justify-center rounded-full px-8",
                  "text-[12.5px] font-semibold uppercase tracking-[0.16em] text-white/85",
                  "transition-colors duration-300 hover:text-white",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50",
                )}
              >
                Explore
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Grade ── */}
        <div className="hero-vignette pointer-events-none absolute inset-0 z-40" />
        <div className="hero-grain pointer-events-none absolute inset-0 z-40 opacity-[0.5] mix-blend-soft-light" />

        {/* ── Scroll cue ── */}
        <motion.div
          className="pointer-events-none absolute bottom-8 left-1/2 z-40 -translate-x-1/2"
          style={{ opacity: cueOpacity }}
          aria-hidden="true"
        >
          <span className="mx-auto flex h-9 w-5 items-start justify-center rounded-full border border-white/15 p-1">
            <span className="animate-scroll-cue h-1.5 w-1 rounded-full bg-white/70" />
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
