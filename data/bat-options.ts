/* ── Made-to-order bat options ───────────────────────────────────────────────────
 *
 * A bat is configured, not just picked: size, handle, profile and toe shape are
 * decisions the customer makes and the workshop acts on. They are part of the order
 * rather than a display detail, so they travel with the cart line and end up in the
 * WhatsApp message the workshop reads.
 *
 * Ids are stable and terse; labels are what the customer sees and what gets written
 * into the order. Keeping both means renaming "SRT ( low profile )" to something
 * clearer later does not orphan the carts of everyone who has one open — and the id
 * is what the server validates against, so an option cannot be invented by editing
 * the request.
 */

export interface BatOptionValue {
  id: string;
  label: string;
}

export interface BatOptionGroup {
  /** Key on the cart line and in the order record. */
  id: string;
  label: string;
  values: BatOptionValue[];
  /** Chosen when nothing is selected. Every group has one, so a bat is always
   *  orderable without touching a single control — the defaults are the common spec,
   *  not a "please choose" placeholder. */
  defaultId: string;
}

/* ── The base spec ──
 * Every made-to-order bat carries all four of these, and `BatOptionsPicker` renders
 * exactly this list. Adding to it puts a new control on every bat product page and a
 * new row in every order, so it is deliberately the short list. The 3D studio's extra
 * choices live in `BAT_STUDIO_OPTION_GROUPS` below instead. */
export const BAT_OPTION_GROUPS: BatOptionGroup[] = [
  {
    id: "size",
    label: "Bat size",
    defaultId: "sh-full",
    values: [
      { id: "sh-full", label: "SH - Full Size" },
      { id: "lh-full", label: "LH - Full Size" },
      { id: "harrow", label: "Harrow Size" },
      { id: "size-6", label: "Size 6" },
      { id: "size-5", label: "Size 5" },
      { id: "size-4", label: "Size 4" },
      { id: "size-3", label: "Size 3" },
    ],
  },
  {
    id: "handle",
    label: "Handle type",
    defaultId: "round",
    values: [
      { id: "round", label: "Round Handle" },
      { id: "semi-oval", label: "Semi Oval" },
    ],
  },
  {
    id: "profile",
    label: "Profile",
    defaultId: "srt",
    values: [
      { id: "srt", label: "SRT (low profile)" },
      { id: "duckbill", label: "Duckbill (high profile)" },
      { id: "tts", label: "TTS (full profile)" },
    ],
  },
  {
    id: "toe",
    label: "Toe shape",
    defaultId: "semi-round",
    values: [
      { id: "semi-round", label: "Semi Round" },
      { id: "flat", label: "Flat Shape" },
      { id: "full-round", label: "Full Round" },
    ],
  },
];

/* ── The 3D studio's extra spec ──────────────────────────────────────────────────
 *
 * Choices that only exist in "Customise Your Bat 3D": the ones the 3D model can
 * actually show, and the ones the laser needs.
 *
 * They are a separate list, and they are *optional*, for one reason: a bat added from
 * a product page must carry exactly the spec it carried before this section existed.
 * `sanitiseBatOptions` defaults every base group but only passes an extended group
 * through when the studio actually set it — so no new rows appear in an order that was
 * not configured in 3D, and no new controls appear on `BatOptionsPicker`.
 *
 * Everything here is still an id validated against a list, which is what makes it free
 * to carry: `describeBatOptions` turns ids into labels, `buildOrder` stores those
 * labels, and `lib/orders/message.ts` already prints every label/value pair into the
 * WhatsApp message. So the workshop reads the 3D spec without a single change to the
 * cart, the order record, the API or the message.
 */

/** Positions are ids, not free numbers, so they survive the same validation as
 *  everything else. The step is what a laser jig is actually set to by hand — finer
 *  than a name is tall, coarser than a number nobody can position to. */
const FROM_TOE_STEP_MM = 20;
const FROM_TOE_MIN_MM = 20;
const FROM_TOE_MAX_MM = 560;
const ACROSS_STEP_MM = 10;
const ACROSS_MAX_MM = 40;
const CAP_HEIGHT_STEP_MM = 5;
const CAP_HEIGHT_MIN_MM = 15;
const CAP_HEIGHT_MAX_MM = 50;

function ladder(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = min; v <= max; v += step) out.push(v);
  return out;
}

/** `mm120` → "120 mm from the toe". */
export function fromToeId(mm: number): string {
  const clamped = Math.min(
    FROM_TOE_MAX_MM,
    Math.max(FROM_TOE_MIN_MM, Math.round(mm / FROM_TOE_STEP_MM) * FROM_TOE_STEP_MM),
  );
  return `mm${clamped}`;
}

/** Signed, because the customer can drag the name off the centre line: negative is
 *  towards the bat's leading edge as the customer sees it in the studio. */
export function acrossId(mm: number): string {
  const clamped = Math.min(
    ACROSS_MAX_MM,
    Math.max(-ACROSS_MAX_MM, Math.round(mm / ACROSS_STEP_MM) * ACROSS_STEP_MM),
  );
  if (clamped === 0) return "centred";
  return clamped < 0 ? `left${-clamped}` : `right${clamped}`;
}

export function capHeightId(mm: number): string {
  const clamped = Math.min(
    CAP_HEIGHT_MAX_MM,
    Math.max(
      CAP_HEIGHT_MIN_MM,
      Math.round(mm / CAP_HEIGHT_STEP_MM) * CAP_HEIGHT_STEP_MM,
    ),
  );
  return `h${clamped}`;
}

export const BAT_STUDIO_OPTION_GROUPS: BatOptionGroup[] = [
  {
    id: "weight",
    label: "Weight",
    defaultId: "w1180",
    values: [
      // The two lightest bands exist for size 3 and size 4, which are junior bats
      // and genuinely weigh this — offering a size 3 with an 880 g band would be a
      // spec nobody can make.
      { id: "w700", label: "700-780 g" },
      { id: "w800", label: "780-880 g" },
      { id: "w880", label: "880-940 g" },
      { id: "w950", label: "950-1010 g" },
      { id: "w1020", label: "1020-1080 g" },
      { id: "w1080", label: "1080-1130 g" },
      { id: "w1130", label: "1130-1180 g" },
      { id: "w1180", label: "1180-1220 g" },
      { id: "w1220", label: "1220-1260 g" },
      { id: "w1260", label: "1260-1300 g" },
    ],
  },
  {
    id: "edge",
    label: "Edge",
    defaultId: "e40",
    values: [
      { id: "e35", label: "35 mm (classic)" },
      { id: "e40", label: "40 mm (balanced)" },
      { id: "e45", label: "45 mm (big)" },
    ],
  },
  {
    // Fitted, not charged here. Same rule as engraving: the figure is agreed on
    // WhatsApp, so this records the decision and never a price.
    id: "toeGuard",
    label: "Toe guard",
    defaultId: "none",
    values: [
      { id: "none", label: "None" },
      { id: "clear", label: "Clear guard (fitted)" },
    ],
  },
  {
    id: "sticker",
    label: "Sticker colourway",
    defaultId: "gold",
    values: [
      { id: "gold", label: "Gold / Black" },
      { id: "red", label: "Crimson" },
      { id: "blue", label: "Royal Blue" },
    ],
  },
  {
    id: "grip",
    label: "Grip colour",
    defaultId: "white",
    values: [
      { id: "white", label: "White" },
      { id: "black", label: "Black" },
      { id: "red", label: "Red" },
      { id: "blue", label: "Blue" },
      { id: "green", label: "Green" },
    ],
  },
  {
    id: "engraveFont",
    label: "Engraving style",
    defaultId: "block",
    values: [
      { id: "block", label: "Block" },
      { id: "serif", label: "Classic" },
      { id: "script", label: "Script" },
    ],
  },
  {
    id: "engraveFace",
    label: "Engraving face",
    defaultId: "front",
    values: [
      { id: "front", label: "Front (playing face)" },
      { id: "back", label: "Back (spine)" },
    ],
  },
  {
    id: "engraveFromToe",
    label: "Engraving position",
    defaultId: fromToeId(110),
    values: ladder(FROM_TOE_MIN_MM, FROM_TOE_MAX_MM, FROM_TOE_STEP_MM).map((mm) => ({
      id: `mm${mm}`,
      label: `${mm} mm from the toe`,
    })),
  },
  {
    id: "engraveAcross",
    label: "Engraving offset",
    defaultId: "centred",
    values: [
      ...ladder(ACROSS_STEP_MM, ACROSS_MAX_MM, ACROSS_STEP_MM)
        .reverse()
        .map((mm) => ({ id: `left${mm}`, label: `${mm} mm left of centre` })),
      { id: "centred", label: "Centred" },
      ...ladder(ACROSS_STEP_MM, ACROSS_MAX_MM, ACROSS_STEP_MM).map((mm) => ({
        id: `right${mm}`,
        label: `${mm} mm right of centre`,
      })),
    ],
  },
  {
    id: "engraveHeight",
    label: "Engraving letter height",
    defaultId: capHeightId(30),
    values: ladder(CAP_HEIGHT_MIN_MM, CAP_HEIGHT_MAX_MM, CAP_HEIGHT_STEP_MM).map(
      (mm) => ({ id: `h${mm}`, label: `${mm} mm cap height` }),
    ),
  },
];

/** 15 characters, as specified. Enforced in the input, again on the cart line and
 *  again on the server — the last one is the only one that counts. */
export const ENGRAVING_MAX = 15;

/** Letters, numbers, spaces, apostrophes, dots and hyphens. This is burned into a bat
 *  with a laser, so the character set is what the machine can cut and what a name
 *  actually contains — not an arbitrary restriction. */
const ENGRAVING_ALLOWED = /^[A-Za-z0-9 .'-]*$/;

export function normaliseEngraving(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, ENGRAVING_MAX);
}

export function engravingError(raw: string): string | null {
  const value = normaliseEngraving(raw);
  if (!value) return null; // Optional.
  if (!ENGRAVING_ALLOWED.test(value))
    return "Letters, numbers, spaces, apostrophes, dots and hyphens only.";
  return null;
}

/** Which categories are configured this way. Bats are; a helmet has no toe shape.
 *
 *  Deliberately its own list rather than borrowing the one in `ProductImageFrame`:
 *  that set exists to choose an image aspect ratio, and two unrelated concerns that
 *  happen to name the same three categories today should not be wired to each other. */
const CONFIGURABLE_CATEGORIES = new Set([
  "kashmir-willow-bats",
  "english-willow-bats",
  "hard-tennis-bats",
  /* The three made-to-order bats in "Customise Your Bat 3D".
   *
   * This line is load-bearing. `sanitiseBatOptions` returns `undefined` for a
   * category it does not recognise, and `resolveCart` stores that — so without this
   * entry the entire 3D configuration would be stripped between the studio and the
   * order, and the workshop would receive a bat with no size, profile, handle, toe,
   * grip or engraving placement. Nothing would report a fault; the spec would simply
   * not be there. See `data/studio-bats.ts`. */
  "custom-3d-bats",
]);

export function isConfigurableBat(categorySlug: string): boolean {
  return CONFIGURABLE_CATEGORIES.has(categorySlug);
}

/** Every group at its default. */
export function defaultBatOptions(): Record<string, string> {
  return Object.fromEntries(BAT_OPTION_GROUPS.map((g) => [g.id, g.defaultId]));
}

/** Coerce an arbitrary record to valid option ids, falling back to the default for
 *  anything unknown. This is what the server calls: an id that is not in the list
 *  cannot survive it, so the order can never record a spec the workshop cannot build. */
export function sanitiseBatOptions(
  raw: unknown,
  categorySlug: string,
): Record<string, string> | undefined {
  if (!isConfigurableBat(categorySlug)) return undefined;

  const input =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  /* Base groups are always present and always valid: an unknown id becomes the
     group's default, so the four decisions the workshop needs are never missing. */
  const base = BAT_OPTION_GROUPS.map((group) => {
    const value = input[group.id];
    const match =
      typeof value === "string" && group.values.some((v) => v.id === value)
        ? value
        : group.defaultId;
    return [group.id, match] as [string, string];
  });

  /* Studio groups are pass-through-or-drop, never defaulted. A bat added from a
     product page has none of them, and must come out of here with none of them —
     defaulting would write a grip colour and an engraving position into an order
     nobody configured in 3D, and change the line key of every cart already saved
     in a browser. An id that is not in the list is dropped rather than corrected,
     which is the same guarantee the base groups give: what reaches the order is
     always something the workshop can build. */
  const studio = BAT_STUDIO_OPTION_GROUPS.flatMap((group) => {
    const value = input[group.id];
    return typeof value === "string" && group.values.some((v) => v.id === value)
      ? [[group.id, value] as [string, string]]
      : [];
  });

  return Object.fromEntries([...base, ...studio]);
}

/** Ids to readable pairs, for the cart, the order and the WhatsApp message. */
export function describeBatOptions(
  options: Record<string, string> | undefined,
): { label: string; value: string }[] {
  if (!options) return [];
  // Base spec first, then anything the 3D studio added, so the order reads in the
  // sequence the customer chose it in.
  return [...BAT_OPTION_GROUPS, ...BAT_STUDIO_OPTION_GROUPS].flatMap((group) => {
    const chosen = group.values.find((v) => v.id === options[group.id]);
    return chosen ? [{ label: group.label, value: chosen.label }] : [];
  });
}
