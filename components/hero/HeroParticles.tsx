"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { PARTICLES, type Particle } from "./hero-data";

/* Atmosphere for the hero stage: dust motes and a few star-like glints.
 *
 * Two things keep this cheap enough to run under a scroll animation.
 *
 * The ambient movement is CSS — `.animate-hero-drift` and `.animate-hero-twinkle`
 * from globals.css — so sixty odd elements breathe without a single JS frame.
 * Scroll parallax is a transform on their shared parents, which composes with
 * those keyframes instead of fighting them.
 *
 * And parallax is grouped into three depth bands rather than applied per mote.
 * Thirty MotionValues would each schedule an independent style write every
 * frame; three read the same way on screen — near motes visibly outrun far ones
 * — for a tenth of the bookkeeping.
 */

const BAND_WEIGHT = [0.45, 0.95, 1.6] as const;

const BANDS: Particle[][] = [[], [], []];
for (const p of PARTICLES) {
  BANDS[p.depth < 0.7 ? 0 : p.depth < 1.05 ? 1 : 2].push(p);
}

/** Concave four-point star. A plain rotated cross reads as a plus sign; the
    pinched waist is what makes it a glint. */
const STAR =
  "M12 0C12.9 8.6 15.4 11.1 24 12c-8.6.9-11.1 3.4-12 12-.9-8.6-3.4-11.1-12-12C8.6 11.1 11.1 8.6 12 0Z";

function Mote({ p }: { p: Particle }) {
  return (
    <span
      aria-hidden="true"
      className={cn("absolute block animate-hero-drift", p.showAt)}
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        // Base opacity lives on this element, not the child: the twinkle
        // keyframes animate opacity, and an animated property overrides an
        // inline one. Split across two elements the two multiply instead.
        opacity: p.opacity,
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.duration * 3.4}s`,
      }}
    >
      {p.kind === "star" ? (
        <svg
          viewBox="0 0 24 24"
          className="animate-hero-twinkle block"
          style={{
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay * 0.7}s`,
            filter: "drop-shadow(0 0 3px rgba(255,240,214,0.55))",
          }}
        >
          <path d={STAR} fill="#fdf6e7" />
        </svg>
      ) : (
        <span
          className="animate-hero-twinkle block rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay * 0.7}s`,
          }}
        />
      )}
    </span>
  );
}

function Band({
  items,
  weight,
  progress,
}: {
  items: Particle[];
  weight: number;
  progress: MotionValue<number>;
}) {
  // Rises with the camera, then blows past it during the push — the field is
  // what sells the dolly, because the bat's own scale could equally be read as
  // the product just getting bigger.
  const y = useTransform(progress, [0, 1], ["0svh", `${(-13 * weight).toFixed(2)}svh`]);
  const scale = useTransform(progress, [0, 0.5, 0.7, 1], [1, 1.12, 1.85, 1.2]);
  const opacity = useTransform(progress, [0, 0.5, 0.7, 0.86, 1], [1, 1, 0.45, 0.7, 0.85]);

  return (
    <motion.div className="absolute inset-0" style={{ y, scale, opacity }}>
      {items.map((p) => (
        <Mote key={`${p.x}-${p.y}`} p={p} />
      ))}
    </motion.div>
  );
}

export function HeroParticles({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {BANDS.map((items, i) => (
        <Band key={i} items={items} weight={BAND_WEIGHT[i]} progress={progress} />
      ))}
    </div>
  );
}
