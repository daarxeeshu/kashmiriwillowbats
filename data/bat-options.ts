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

  return Object.fromEntries(
    BAT_OPTION_GROUPS.map((group) => {
      const value = input[group.id];
      const match =
        typeof value === "string" && group.values.some((v) => v.id === value)
          ? value
          : group.defaultId;
      return [group.id, match];
    }),
  );
}

/** Ids to readable pairs, for the cart, the order and the WhatsApp message. */
export function describeBatOptions(
  options: Record<string, string> | undefined,
): { label: string; value: string }[] {
  if (!options) return [];
  return BAT_OPTION_GROUPS.flatMap((group) => {
    const chosen = group.values.find((v) => v.id === options[group.id]);
    return chosen ? [{ label: group.label, value: chosen.label }] : [];
  });
}
