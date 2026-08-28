import { siteConfig } from "@/data/site-config";

/* ── The one place a WhatsApp number lives ───────────────────────────────────────
 *
 * Every WhatsApp CTA on this site — header Bat Expert, Bat Doctor, checkout, returns,
 * refunds, warranty, contact, footer — resolves its destination through this module.
 * Nothing else builds a wa.me URL, so the real number is a single environment value
 * away from being live everywhere at once.
 *
 * ── When it is not usable ──
 * The business number is configured, so every CTA is live. The guard below stays
 * because the value is still overridable per environment, and an empty or malformed
 * override must not become a `wa.me/` link that looks like a working button and opens
 * a WhatsApp error.
 *
 * With no usable number, `whatsappHref` falls back to `/contact`, where the published
 * email is, and `isWhatsAppConfigured` lets a page word itself honestly rather than
 * offering a button that goes nowhere.
 *
 *   NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX   (country code first, digits only)
 */

/** Digits only, country code included. */
export function getWhatsAppNumber(): string {
  /* Environment first, so a staging deploy can point at a test line without editing
     code; the configured business number is the default, which is why this site works
     with no env file at all. */
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteConfig.whatsappNumber;
  return raw.replace(/\D/g, "");
}

export function isWhatsAppConfigured(): boolean {
  // A country code plus a subscriber number is at least 10 digits; anything shorter
  // is a typo or a leftover placeholder, and following it would be a dead end.
  return getWhatsAppNumber().length >= 10;
}

/** The wa.me URL, or `/contact` when no number is configured. */
export function whatsappHref(message: string): string {
  const number = getWhatsAppNumber();
  if (number.length < 10) return "/contact";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Kept as the older name used across the app; identical behaviour. */
export const buildWhatsAppUrl = whatsappHref;

/** Attributes for a WhatsApp CTA, so callers do not open an internal route in a new
 *  tab when the fallback kicks in. */
export function whatsappLinkProps(message: string) {
  const external = isWhatsAppConfigured();
  return {
    href: whatsappHref(message),
    ...(external
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {}),
  };
}

/* Pre-filled openings. Each one names what the customer wants, so the first message in
 * the thread already tells support which queue it belongs to. Deliberately not
 * pre-filled with an order number the page cannot know — the copy asks for it. */
export const whatsappMessages = {
  general:
    "Hi, I need help choosing cricket equipment from Kashmiri Willow Bats.",
  batExpert:
    "Hi, I'd like to speak with a bat expert. Can you help me choose the right Kashmir Willow bat?",
  videoCall:
    "Hi, I'd like to schedule a video call to see available bats — weight, grains, pickup, and ping. Please assist.",
  engraving:
    "Hi, I'm interested in laser name engraving on my bat. Can you share details?",
  support: "Hi, I need help with an order from Kashmiri Willow Bats.",
  returns:
    "Hi, I would like to request a return for my order. Please help me with the return process.",
  refund:
    "Hi, I would like to request a refund. I can share my order number, the reason, and photographs if required.",
  warranty:
    "Hi, I would like to make a warranty claim. I can share my order details and photographs of the bat.",
  tracking:
    "Hi, I'd like an update on my order. My order number is ",
  store: "Hi, I'd like to visit one of your stores. Could you share the details?",
} as const;

/** Tracking, with the reference already in the message. */
export function trackingMessage(orderId: string): string {
  return `${whatsappMessages.tracking}${orderId}`;
}
