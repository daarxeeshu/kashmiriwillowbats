"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SpecCard as SpecCardData } from "./hero-data";

/* One annotation panel from the hero's engineering-diagram phase.
 *
 * Every animated property here is a transform, an opacity, or (on two panels) a
 * filter — nothing that triggers layout. The panel's resting place is plain CSS
 * `left`/`top` set once; the sequence only ever moves it from there.
 */

/** Camera starts past the panels. */
const PUSH_OUT = 0.5;
/** Panels are clear of the frame. */
const PUSH_DONE = 0.64;
/** End of the macro shot. The peripheral labels dissolve with it, and no panel
 *  comes back afterwards — see the note on `opacity` below. */
const MACRO_END = 0.76;

interface SpecCardProps {
  card: SpecCardData;
  progress: MotionValue<number>;
  /** Cursor position, -1..1 across the stage. Already spring-smoothed. */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}

export function SpecCard({ card, progress, pointerX, pointerY }: SpecCardProps) {
  const { at, dir, depth, peripheral, behind } = card;

  const in0 = at - 0.03;
  const in1 = at + 0.07;
  /* The panel's whole travel: settle in, hold, then leave with the camera. There
     is no return leg — every keyframe list here ends at PUSH_DONE. */
  const keys = [in0, in1, PUSH_OUT, PUSH_DONE];

  /* How far the camera throws the panel aside, as a share of its own width.
     Peripheral panels stay in frame through the macro shot as out-of-focus
     labels, so they travel far less. Weighted by depth so the group disperses at
     different rates — a uniform slide reads as one card deck moving. */
  const away = (peripheral ? 52 : 155) * depth;

  const x = useTransform(progress, keys, [
    `${dir * 15}%`,
    "0%",
    "0%",
    `${dir * away}%`,
  ]);

  const y = useTransform(progress, keys, [
    "9px",
    "0px",
    "0px",
    `${(-11 * depth).toFixed(1)}px`,
  ]);

  const scale = useTransform(progress, keys, [0.93, 1, 1, 1.28]);

  /* No panel returns for the closing composition. Glass without its label is a
     grey rectangle — five of them scattered behind the product read as leftover
     UI, not as depth, and the brief puts the bat first and the specs fourth. So
     the diagram is a chapter that ends: the interior panels leave with the camera
     push, the peripheral pair survives the macro shot as blurred labels, and the
     finale is bat, headline and CTAs on an empty stage.

     `rest` is the resting opacity. The blank depth panels sit well under the
     labelled ones — they exist to give the annotation layer a near and far plane,
     and any more presence than that and they start competing for attention. */
  const rest = behind ? 0.45 : 1;
  const macro = peripheral ? 0.4 : 0;

  /* Opacity gets its own keys rather than reusing `keys`: on the shared timing a
     panel held its glass all the way to PUSH_DONE, so for ~0.14 of the scroll it
     was an empty box drifting off-frame after its text had gone. It now fades out
     just behind its own copy. */
  const opacity = useTransform(
    progress,
    [in0, in1, PUSH_OUT, PUSH_OUT + 0.06, MACRO_END, MACRO_END + 0.06],
    [0, rest, rest, macro, macro, 0],
  );

  /* Depth of field, on the two peripheral panels only. Animating `filter` costs
     a repaint of the layer, which is why it is not on all seven — but on two
     small panels during one short window it buys the macro shot its sense of a
     focal plane, and nothing composited can fake that. */
  const filter = useTransform(
    progress,
    [PUSH_OUT, PUSH_DONE],
    ["blur(0px)", "blur(3.5px)"],
  );

  /* Copy dims as the camera leaves. On the peripheral pair it dims rather than
     goes, because 12.5px type under 3.5px of blur is an illegible smear — which
     is exactly what a label at the edge of a macro shot should be. Separate from
     panel opacity so the glass can outlive its label by a beat. */
  const textOpacity = useTransform(
    progress,
    [in0, in1, PUSH_OUT, PUSH_OUT + 0.06],
    [0, 1, 1, peripheral ? 0.55 : 0],
  );

  /* Cursor tilt is muted while the camera is moving. Two motions on one element
     read as a glitch; the panel should feel touchable when it is at rest and
     inert when it is being flown past. */
  const tilt = useTransform(progress, [in1, PUSH_OUT, PUSH_DONE], [1, 1, 0]);

  const rotateY = useTransform([pointerX, tilt], ([px, w]) =>
    (px as number) * 7 * depth * (w as number),
  );
  const rotateX = useTransform([pointerY, tilt], ([py, w]) =>
    -(py as number) * 5.5 * depth * (w as number),
  );

  // The specular blob travels further than the panel tilts, which is what makes
  // it read as a reflection of something in the room rather than a gradient
  // painted on the surface.
  const sheenX = useTransform(pointerX, [-1, 1], ["-34%", "34%"]);
  const sheenY = useTransform(pointerY, [-1, 1], ["-40%", "40%"]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "hero-glass overflow-hidden rounded-xl",
        behind ? "z-0" : "z-20",
        card.showAt ?? "flex",
      )}
      style={{
        // Inline, not the `absolute` utility: this project force-defines
        // `.absolute` in @layer base (globals.css), and `.hero-glass` sets
        // `position: relative` from @layer components — a later layer, so the
        // class would lose. An inline declaration outranks both.
        position: "absolute",
        left: `${card.x}%`,
        top: `${card.y}%`,
        width: card.w,
        x,
        y,
        scale,
        opacity,
        rotateX,
        rotateY,
        transformPerspective: 900,
        filter: peripheral ? filter : undefined,
      }}
    >
      <motion.span
        className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2"
        style={{
          x: sheenX,
          y: sheenY,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 38%, transparent 68%)",
        }}
      />

      {card.title ? (
        <motion.div className="relative w-full px-3.5 py-3" style={{ opacity: textOpacity }}>
          {card.dots ? (
            // Three dim dots, as the reference's annotation panels carry. Read
            // as instrument lights, and they give the panel a top-left weight
            // that stops two lines of centred text looking like a tooltip.
            <span className="mb-2.5 flex gap-1">
              <span className="h-1 w-1 rounded-full bg-white/35" />
              <span className="h-1 w-1 rounded-full bg-white/22" />
              <span className="h-1 w-1 rounded-full bg-white/14" />
            </span>
          ) : null}

          <span className="block text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-white/45">
            {card.eyebrow}
          </span>
          <span className="mt-1.5 block text-[12.5px] font-semibold leading-tight tracking-[-0.01em] text-white/92">
            {card.title}
          </span>
        </motion.div>
      ) : (
        // Blank panel. Height has to come from somewhere with no content in it.
        <span className="block w-full pb-[62%]" />
      )}
    </motion.div>
  );
}
