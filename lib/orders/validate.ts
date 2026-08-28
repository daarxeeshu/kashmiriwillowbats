import type { CheckoutDetails, CheckoutErrors } from "@/types/cart";

/* Shared by the form and the route handler, so the browser and the server can never
 * disagree about what a valid order looks like. Same discipline as
 * `lib/bat-doctor/validate.ts`, and for the same reason: a form validated only in the
 * browser is validated by whoever controls the browser. */

const t = (v: string) => v.trim();

/** Ten digits, optionally +91 / 0 prefixed, spaces and dashes tolerated. Deliberately
 *  loose: this is an Indian mobile number that a human will dial, not an identifier we
 *  key anything on, and a strict pattern rejects real numbers. */
function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export const EMPTY_ERRORS: CheckoutErrors = {};

export function validateCheckout(details: CheckoutDetails): CheckoutErrors {
  const e: CheckoutErrors = {};

  if (!t(details.fullName)) e.fullName = "Please enter your name.";
  else if (t(details.fullName).length < 2) e.fullName = "That name looks too short.";

  if (!t(details.phone)) e.phone = "We need a phone number to confirm the order.";
  else if (!looksLikePhone(details.phone))
    e.phone = "Please enter a valid phone number.";

  // Optional — the order is confirmed on WhatsApp, so a phone number is the only
  // contact detail that is actually required. Validated only when supplied.
  if (t(details.email) && !looksLikeEmail(t(details.email)))
    e.email = "That email address doesn't look right.";

  if (!t(details.addressLine1)) e.addressLine1 = "Please enter a delivery address.";
  if (!t(details.city)) e.city = "Please enter a city.";
  if (!t(details.state)) e.state = "Please enter a state.";

  if (!t(details.pin)) e.pin = "Please enter a PIN code.";
  else if (!/^\d{6}$/.test(t(details.pin))) e.pin = "An Indian PIN code is 6 digits.";

  return e;
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.keys(errors).length > 0;
}
