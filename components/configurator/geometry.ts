/* ── Option id → 3D shape ────────────────────────────────────────────────────────
 *
 * The one place the storefront's option vocabulary meets the geometry.
 *
 * This file exists because of a real mismatch. The 3D engine was written standalone
 * and had its own ids — `semioval`, `full`, `round`, `sh`, `s5` — none of which are in
 * `data/bat-options.ts`. That matters more than it looks: `sanitiseBatOptions` is what
 * the server calls, and an id it does not recognise is replaced by the group's default
 * rather than rejected. A studio that spoke its own vocabulary would let a customer
 * configure a Duckbill and have the workshop build an SRT, silently, with nothing
 * anywhere reporting a fault.
 *
 * So the storefront's ids are the only ids. Every key below is one that
 * `BAT_OPTION_GROUPS` or `BAT_STUDIO_OPTION_GROUPS` declares, and the numbers beside
 * it are what the mesh does about it.
 */
import {
  BAT_OPTION_GROUPS,
  BAT_STUDIO_OPTION_GROUPS,
  type BatOptionGroup,
} from "@/data/bat-options";

/** Bat length multiplier. 1.0 is a short handle full size. */
export const SIZE_SCALE: Record<string, number> = {
  "sh-full": 1.0,
  "lh-full": 1.015,
  harrow: 0.93,
  "size-6": 0.88,
  "size-5": 0.83,
  "size-4": 0.78,
  "size-3": 0.73,
};

/** How much timber the blade carries, 0..1. Drives edge and spine together, because
 *  on a real bat they are not independent — weight is where the wood went. */
export const WEIGHT_MASS: Record<string, number> = {
  w700: 0.18,
  w800: 0.24,
  w880: 0.3,
  w950: 0.35,
  w1020: 0.4,
  w1080: 0.48,
  w1130: 0.42,
  w1180: 0.55,
  w1220: 0.72,
  w1260: 0.88,
};

/** Which weight bands a size can be. A size 5 is never a 1250 g bat, and offering it
 *  would be a control that produces an unbuildable order. */
export const WEIGHTS_FOR_SIZE: Record<string, string[]> = {
  "size-3": ["w700"],
  "size-4": ["w700", "w800"],
  "size-5": ["w800", "w880"],
  "size-6": ["w880", "w950"],
  harrow: ["w1020", "w1080"],
  "sh-full": ["w1130", "w1180", "w1220", "w1260"],
  "lh-full": ["w1180", "w1220", "w1260"],
};

/**
 * `swell` is where the timber sits, measured from the toe (0) to the shoulder (1);
 * `spine` scales the ridge down the back; `toeDrop` carries the spine off the end of
 * the blade instead of tapering it away.
 *
 * The labels in `data/bat-options.ts` are the contract here: SRT is described to the
 * customer as the low profile, Duckbill as the high one, and TTS as the full one, so
 * that is what the numbers have to produce.
 */
export const PROFILE_SHAPE: Record<
  string,
  { swell: number; spine: number; toeDrop: number }
> = {
  // Low, even, mid sweet spot — the least timber of the three.
  srt: { swell: 0.46, spine: 1.0, toeDrop: 0 },
  // Big low middle and a heavy toe.
  duckbill: { swell: 0.3, spine: 1.16, toeDrop: 0.1 },
  // Spine carried all the way into the toe, so the bottom is the thick part.
  tts: { swell: 0.22, spine: 1.12, toeDrop: 0.34 },
};

/** Edge thickness multiplier. */
export const EDGE_GAIN: Record<string, number> = {
  e35: 0.8,
  e40: 1.0,
  e45: 1.28,
};

/** How far the toe is rounded off, 0 = square, 1 = full radius. */
export const TOE_ROUND: Record<string, number> = {
  flat: 0.0,
  "semi-round": 0.5,
  "full-round": 1.0,
};

/** `oval` deepens the handle front-to-back; `egg` flattens only its back face, which
 *  is what a semi-oval actually is. Both are about resisting the bat twisting in the
 *  hand, so neither of them touches the handle's width. */
export const HANDLE_SHAPE: Record<string, { oval: number; egg: number }> = {
  round: { oval: 0.0, egg: 0.0 },
  "semi-oval": { oval: 0.55, egg: 0.7 },
};

/** Sticker colourway → the prepared cutout, and the swatch the control shows. */
export const STICKER_ART: Record<string, { src: string; swatch: string }> = {
  gold: {
    src: "/configurator/stickers/kis-master-pro-gold-shield.webp",
    swatch: "#C9A227",
  },
  red: {
    src: "/configurator/stickers/kis-master-pro-red-shield.webp",
    swatch: "#D31F26",
  },
  blue: {
    src: "/configurator/stickers/kis-master-pro-blue-shield.webp",
    swatch: "#0A6ED1",
  },
};

/** Grip colour → the colour the rubber is tinted, and the swatch. They differ: a
 *  swatch has to read at 20 px against a dark panel, the material has to read under
 *  image-based lighting. */
export const GRIP_COLOUR: Record<string, { colour: string; swatch: string }> = {
  white: { colour: "#EDEDEA", swatch: "#F2F2F2" },
  black: { colour: "#232323", swatch: "#191919" },
  red: { colour: "#C4181F", swatch: "#D31F26" },
  blue: { colour: "#0F63BE", swatch: "#0A6ED1" },
  green: { colour: "#1E9E52", swatch: "#1E9E52" },
};

/** Engraving faces, as the canvas layout understands them. */
export type EngraveFace = "front" | "back";

/** Cap height as a fraction of blade width. The studio's slider works in these, and
 *  `capHeightId` turns the result into millimetres for the order. */
export const ENGRAVE_SIZE = { min: 0.14, max: 0.46, default: 0.28 };

/** Named starting points. The customer can drag away from all of them — these exist
 *  so the first thing they see is already in a sensible place. */
export const ENGRAVE_PLACEMENTS: {
  id: string;
  label: string;
  u: number;
  v: number;
  face: EngraveFace;
}[] = [
  { id: "toe", label: "Above the toe", u: 0.5, v: 0.115, face: "front" },
  { id: "mid", label: "Below the sticker", u: 0.5, v: 0.5, face: "front" },
  { id: "spine", label: "On the spine", u: 0.5, v: 0.32, face: "back" },
];

/* ── Lookups ─────────────────────────────────────────────────────────────────── */

const ALL_GROUPS = [...BAT_OPTION_GROUPS, ...BAT_STUDIO_OPTION_GROUPS];

export function groupById(id: string): BatOptionGroup | null {
  return ALL_GROUPS.find((g) => g.id === id) ?? null;
}

/** The label the customer and the workshop both see for one chosen id. */
export function labelFor(groupId: string, valueId: string): string {
  const group = groupById(groupId);
  return group?.values.find((v) => v.id === valueId)?.label ?? valueId;
}

export interface ShapeConfig {
  size: string;
  weight: string;
  profile: string;
  edge: string;
  toe: string;
  handle: string;
}

/** Every shape parameter the mesh needs, from a whole configuration.
 *
 *  Each lookup falls back to the group's own default rather than to a literal, so a
 *  new option id added to `data/bat-options.ts` before this file catches up produces
 *  the default bat rather than a bat with `undefined` in its spine. */
export function shapeFor(config: ShapeConfig) {
  const profileDefault = PROFILE_SHAPE[groupById("profile")!.defaultId];
  const handleDefault = HANDLE_SHAPE[groupById("handle")!.defaultId];
  const profile = PROFILE_SHAPE[config.profile] ?? profileDefault;
  const handle = HANDLE_SHAPE[config.handle] ?? handleDefault;
  return {
    swell: profile.swell,
    spine: profile.spine,
    toeDrop: profile.toeDrop,
    edge: EDGE_GAIN[config.edge] ?? 1,
    round: TOE_ROUND[config.toe] ?? 0,
    oval: handle.oval,
    egg: handle.egg,
    mass: WEIGHT_MASS[config.weight] ?? 0.55,
    scale: SIZE_SCALE[config.size] ?? 1,
  };
}

/** The weight bands this size may be, as option values ready to render. */
export function weightsForSize(size: string) {
  const group = groupById("weight")!;
  const allowed = WEIGHTS_FOR_SIZE[size] ?? WEIGHTS_FOR_SIZE["sh-full"];
  return group.values.filter((v) => allowed.includes(v.id));
}

/** The band to move to when a size change makes the current one impossible. Picks the
 *  middle of the new range rather than the lightest, so changing size does not quietly
 *  also change the bat to the thinnest shape it can be. */
export function reconcileWeight(size: string, weight: string): string {
  const allowed = WEIGHTS_FOR_SIZE[size] ?? WEIGHTS_FOR_SIZE["sh-full"];
  if (allowed.includes(weight)) return weight;
  return allowed[Math.min(allowed.length - 1, Math.floor(allowed.length / 2))];
}
