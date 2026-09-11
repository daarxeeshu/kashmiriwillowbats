/* ── The promo tape ─────────────────────────────────────────────────────────────
 *
 * The angled strip across the corner of a brand card that cycles "High on demand",
 * "Hot selling", "Most liked".
 *
 * It is the only piece of copy on the site the shop can change without a deploy, so
 * everything about it is data: whether it shows at all, what it says, and how fast it
 * turns over. The admin panel writes this shape; `PromoTape` reads it.
 *
 * ── Why it is validated like a form and not trusted like a config file ──
 * The values arrive from a browser over HTTP. Basic auth gates *who* can write, not
 * *what* they can write, and a 400-character message would not wrap — it would run off
 * the card and across the photograph beside it. So there are limits, `sanitisePromoTape`
 * enforces them on the way in, and a value that cannot be honoured is replaced by the
 * default rather than rejected: the tape is decoration, and a broken save must never
 * be able to take a storefront page down with it.
 */

export interface PromoTapeSettings {
  /** The on/off switch. `false` renders nothing at all — not a hidden element. */
  enabled: boolean;
  /** Shown in order, cycling. One message is legal and simply never changes. */
  messages: string[];
  /** How long each message is held, in milliseconds. */
  intervalMs: number;
}

export const PROMO_TAPE_DEFAULTS: PromoTapeSettings = {
  enabled: true,
  messages: ["High on demand", "Hot selling", "Most liked"],
  intervalMs: 2600,
};

/** More than this and the cycle is longer than anyone watches a card for. */
export const PROMO_TAPE_MAX_MESSAGES = 6;

/* The tape is rotated and anchored to the card's top corner, and it sizes itself to
 * its longest message. Past about this length the strip reaches the far edge of the
 * card on a 2-up phone grid and starts covering the photograph rather than sitting on
 * it. "High on demand" is 14. */
export const PROMO_TAPE_MAX_LENGTH = 22;

export const PROMO_TAPE_MIN_INTERVAL = 1200;
export const PROMO_TAPE_MAX_INTERVAL = 10000;

/** Letters, numbers, spaces and the light punctuation a shop slogan uses. Deliberately
 *  no angle brackets or ampersands: this string is rendered as text, and keeping the
 *  character set to what a tape would actually say means there is nothing to escape. */
const ALLOWED = /^[A-Za-z0-9 .,!'%-]*$/;

export function normalisePromoMessage(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, PROMO_TAPE_MAX_LENGTH);
}

/** The message a form field shows, or null when the value is fine. Empty is fine —
 *  an empty row is how a message is removed. */
export function promoMessageError(raw: string): string | null {
  const value = normalisePromoMessage(raw);
  if (!value) return null;
  if (!ALLOWED.test(value))
    return "Letters, numbers, spaces and . , ! ' % - only.";
  return null;
}

function clampInterval(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return PROMO_TAPE_DEFAULTS.intervalMs;
  return Math.min(
    PROMO_TAPE_MAX_INTERVAL,
    Math.max(PROMO_TAPE_MIN_INTERVAL, Math.round(n)),
  );
}

/**
 * Coerce anything to settings that can be rendered.
 *
 * Called on the way into the store *and* on the way out of it, so a file edited by
 * hand, or written by an older version of this shape, resolves to something valid
 * rather than reaching a component as `undefined.map`.
 *
 * An empty message list falls back to the defaults rather than to no messages: the
 * switch is how the tape is turned off, and a tape that is "on" with nothing to say
 * would be an invisible element that nobody could diagnose from the admin panel.
 */
export function sanitisePromoTape(raw: unknown): PromoTapeSettings {
  const input =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  const messages = (Array.isArray(input.messages) ? input.messages : [])
    .filter((m): m is string => typeof m === "string")
    .map(normalisePromoMessage)
    .filter((m) => m.length > 0 && ALLOWED.test(m))
    .slice(0, PROMO_TAPE_MAX_MESSAGES);

  return {
    // Only an explicit `false` turns it off, so a file missing the key keeps the
    // tape rather than silently hiding it.
    enabled: input.enabled !== false,
    messages: messages.length > 0 ? messages : PROMO_TAPE_DEFAULTS.messages,
    intervalMs: clampInterval(input.intervalMs),
  };
}
