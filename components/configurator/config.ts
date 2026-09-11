/* ── The studio's configuration ──────────────────────────────────────────────────
 *
 * One plain object, every field an id from `data/bat-options.ts` except the engraving,
 * which is text and two continuous coordinates because the customer drags it.
 *
 * The whole point of the shape below is that `toCartOptions` can turn it into the
 * exact record `sanitiseBatOptions` expects without a translation table — there isn't
 * one, because the studio never had its own vocabulary. See `geometry.ts` for why
 * that mattered.
 */
import {
  acrossId,
  capHeightId,
  fromToeId,
  normaliseEngraving,
} from "@/data/bat-options";
import {
  ENGRAVE_SIZE,
  GRIP_COLOUR,
  reconcileWeight,
  shapeFor,
  type EngraveFace,
} from "./geometry";

export interface EngraveConfig {
  on: boolean;
  text: string;
  font: string;
  face: EngraveFace;
  /** Across the face and up from the toe, both 0..1 in blade space. Continuous,
   *  because the mark is dragged; quantised to millimetres only on the way out. */
  pos: { u: number; v: number };
  /** Cap height as a fraction of blade width. */
  size: number;
  /** How hard the laser was driven, 0..1. Affects depth of cut, not placement. */
  depth: number;
}

export interface StudioConfig {
  /** The product being configured. The price authority, and the only field that is
   *  not an option id — the server resolves it against `data/products.ts`. */
  slug: string;
  size: string;
  handle: string;
  profile: string;
  toe: string;
  weight: string;
  edge: string;
  toeGuard: string;
  sticker: string;
  grip: string;
  engrave: EngraveConfig;
}

/** The keys `BatStudio.apply` watches. `slug` is here because the bat's own name is
 *  burnt into the blade and its willow decides the finish, so changing the product
 *  redraws the engraving and re-tints the wood. */
export type StudioConfigKey = keyof StudioConfig | "model";

export function defaultConfig(slug: string): StudioConfig {
  return {
    slug,
    size: "sh-full",
    handle: "semi-oval",
    profile: "srt",
    toe: "semi-round",
    weight: "w1180",
    edge: "e40",
    toeGuard: "none",
    sticker: "gold",
    grip: "white",
    engrave: {
      on: true,
      text: "",
      font: "block",
      face: "front",
      pos: { u: 0.5, v: 0.115 },
      size: ENGRAVE_SIZE.default,
      depth: 0.72,
    },
  };
}

/* Placement limits, in blade space. The engraving may not be dragged onto the
   rounded edge or off the toe: the laser cannot cut a curve that steep, and a name
   that runs over the shoulder is under the grip. These are the same bounds the canvas
   layout clamps to, kept here as well so the *stored* position never drifts outside
   what can be drawn. */
const U_MIN = 0.14;
const U_MAX = 0.86;
const V_MIN = 0.03;
const V_MAX = 0.97;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Make a configuration internally consistent.
 *
 * Called after every change, so an option that becomes impossible because of another
 * option is corrected once, here, rather than in each control. Changing from a short
 * handle to a size 5 has to move the weight band with it — a size 5 at 1220 g is not
 * a bat anyone can make, and leaving it selected would put it in the order.
 */
export function reconcile(config: StudioConfig): StudioConfig {
  const engrave = config.engrave;
  return {
    ...config,
    weight: reconcileWeight(config.size, config.weight),
    engrave: {
      ...engrave,
      text: normaliseEngraving(engrave.text),
      size: clamp(engrave.size, ENGRAVE_SIZE.min, ENGRAVE_SIZE.max),
      pos: {
        u: clamp(engrave.pos.u, U_MIN, U_MAX),
        v: clamp(engrave.pos.v, V_MIN, V_MAX),
      },
    },
  };
}

/** Which top-level keys differ. Drives how much work `BatStudio.apply` does, so it
 *  compares the engraving by value rather than by reference — a new object with the
 *  same text must not trigger a repaint. */
export function changedKeys(a: StudioConfig, b: StudioConfig): StudioConfigKey[] {
  const keys: StudioConfigKey[] = [];
  for (const key of Object.keys(b) as (keyof StudioConfig)[]) {
    if (key === "engrave") continue;
    if (a[key] !== b[key]) keys.push(key);
  }
  if (JSON.stringify(a.engrave) !== JSON.stringify(b.engrave)) keys.push("engrave");
  // The engine's dependency lists name the product `model`; the cart calls it a slug.
  if (a.slug !== b.slug) keys.push("model");
  return keys;
}

export const ALL_CONFIG_KEYS: StudioConfigKey[] = [
  "slug",
  "model",
  "size",
  "handle",
  "profile",
  "toe",
  "weight",
  "edge",
  "toeGuard",
  "sticker",
  "grip",
  "engrave",
];

/** Everything `BatStudio.apply` needs, derived from the configuration plus the two
 *  facts that come from the product rather than from the customer. */
export function enginePayload(
  config: StudioConfig,
  product: { name: string; willow: "kashmir" | "english" },
) {
  return {
    shape: shapeFor(config),
    willow: product.willow,
    brandName: product.name,
    toeGuard: config.toeGuard,
    gripColour: GRIP_COLOUR[config.grip]?.colour ?? "#EDEDEA",
    sticker: config.sticker,
    engrave: config.engrave,
  };
}

/**
 * The configuration as cart option ids.
 *
 * `millimetres` comes from the mesh — the studio measures the bat the customer is
 * actually looking at, because the same blade-space position is a different number of
 * millimetres on a size 3 and a short handle. When it is absent (the mesh has not
 * loaded) the engraving position groups are simply omitted, which `sanitiseBatOptions`
 * treats as "not configured in 3D" rather than defaulting them — an order should never
 * record a placement that was never measured.
 */
export function toCartOptions(
  config: StudioConfig,
  millimetres: { fromToe: number; across: number; capHeight: number } | null,
): Record<string, string> {
  const options: Record<string, string> = {
    size: config.size,
    handle: config.handle,
    profile: config.profile,
    toe: config.toe,
    weight: config.weight,
    edge: config.edge,
    toeGuard: config.toeGuard,
    sticker: config.sticker,
    grip: config.grip,
  };

  // No text means no engraving, and none of its settings belong in the order — a
  // font and a position for a name nobody asked for is noise in the workshop's
  // message.
  const text = normaliseEngraving(config.engrave.text);
  if (config.engrave.on && text && millimetres) {
    options.engraveFont = config.engrave.font;
    options.engraveFace = config.engrave.face;
    options.engraveFromToe = fromToeId(millimetres.fromToe);
    options.engraveAcross = acrossId(millimetres.across);
    options.engraveHeight = capHeightId(millimetres.capHeight);
  }

  return options;
}
