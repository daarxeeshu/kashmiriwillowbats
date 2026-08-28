import type {
  BatDoctorErrors,
  BatDoctorFormState,
  MediaRef,
} from "@/types/bat-doctor";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  OTHER_DAMAGE_ID,
  batBrands,
  batGrades,
  batTypes,
  cricketTypeOptions,
  damageCategories,
  purchaseAgeOptions,
  serviceTypes,
  usageFrequencyOptions,
  yesNoUnsureOptions,
} from "@/data/bat-doctor";

/* ── Validation, written once and run twice ──────────────────────────────────────
 *
 * This module imports nothing from `next`, nothing from React and touches no browser
 * API, which is the whole point: the same functions run in the form as the customer
 * types and again in the route handler before anything is accepted. §29 asks for
 * server-side validation and says not to trust the client alone — the cheapest way to
 * honour that without two rulebooks drifting apart is one rulebook, called from both
 * ends.
 *
 * Two things follow from that, and both are deliberate:
 *
 * 1. Every message is a sentence a customer can act on. There is no error *code*
 *    anywhere in here, so no component has to translate one into prose and none can
 *    accidentally render "ERR_PHONE_INVALID" (§35).
 *
 * 2. Every enumerated field is checked against the arrays in `data/bat-doctor.ts`
 *    rather than against a regex or a length. A hand-typed POST with
 *    `serviceType: "free"` is rejected because "free" is not a service the business
 *    defined — which is also why those lists live in data. */

const EMPTY_ERRORS: BatDoctorErrors = {};

/** Trim once, at the boundary. Everything downstream can then assume "" means absent
 *  rather than having to distinguish "" from "   ". */
function t(value: string): string {
  return value.trim();
}

function isOneOf(value: string, options: { value: string }[]): boolean {
  return options.some((o) => o.value === value);
}

/** Deliberately permissive on shape and strict on nothing else. A validator that
 *  rejects unusual-but-real addresses is worse than one that lets a typo through and
 *  gets corrected by a human — a technician reads every one of these before anyone
 *  touches a bat. The only thing being caught here is a genuinely unusable value. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Indian mobile numbers, with or without the country code, and tolerant of the
 *  spaces, dashes and brackets people actually type. */
function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return /^[6-9]/.test(digits);
  if (digits.length === 12) return digits.startsWith("91") && /^[6-9]/.test(digits.slice(2));
  if (digits.length === 11) return digits.startsWith("0") && /^[6-9]/.test(digits.slice(1));
  return false;
}

/* ── Step 1 · What's wrong (§7–§9) ── */

export function validateDamage(
  state: BatDoctorFormState,
): BatDoctorErrors {
  const errors: BatDoctorErrors = {};

  const known = state.damageIds.filter((id) =>
    damageCategories.some((d) => d.id === id),
  );
  const unknown = state.damageIds.filter(
    (id) => id !== OTHER_DAMAGE_ID && !known.includes(id),
  );

  if (unknown.length > 0) {
    errors.damageIds = "One of the selected problems isn't recognised. Please reselect.";
  } else if (known.length === 0 && !state.otherDamageSelected) {
    errors.damageIds =
      "Pick at least one problem — or choose “Other / I'm not sure” and tell us in your own words.";
  }

  if (state.otherDamageSelected && t(state.otherDamageText).length < 10) {
    errors.otherDamageText =
      "Tell us a little about what's happening — even one sentence helps.";
  }

  return errors;
}

/* ── Step 2 · The bat (§11–§14) ── */

export function validateBat(state: BatDoctorFormState): BatDoctorErrors {
  const errors: BatDoctorErrors = {};

  if (!state.brand) {
    errors.brand = "Choose the brand, or “Other” if it isn't listed.";
  } else if (!isOneOf(state.brand, batBrands)) {
    errors.brand = "That brand isn't one of the options. Please choose again.";
  } else if (state.brand === "other" && t(state.brandOther).length < 2) {
    errors.brandOther = "Which brand is it?";
  }

  if (!state.batType) {
    errors.batType = "Kashmir willow, English willow, or not sure — any answer is fine.";
  } else if (!isOneOf(state.batType, batTypes)) {
    errors.batType = "That bat type isn't one of the options. Please choose again.";
  }

  if (state.grade && !isOneOf(state.grade, batGrades)) {
    errors.grade = "That grade isn't one of the options. Please choose again.";
  }

  if (!state.purchaseAge) {
    errors.purchaseAge = "Roughly how long have you had it?";
  } else if (!isOneOf(state.purchaseAge, purchaseAgeOptions)) {
    errors.purchaseAge = "That option isn't recognised. Please choose again.";
  }

  if (state.purchaseDate) {
    const parsed = new Date(state.purchaseDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.purchaseDate = "That date doesn't look right.";
    } else if (parsed.getTime() > Date.now()) {
      errors.purchaseDate = "That date is in the future — check the year.";
    }
  }

  if (!state.usageFrequency) {
    errors.usageFrequency = "How often do you use it?";
  } else if (!isOneOf(state.usageFrequency, usageFrequencyOptions)) {
    errors.usageFrequency = "That option isn't recognised. Please choose again.";
  }

  if (!state.cricketType) {
    errors.cricketType = "What kind of cricket do you play with it?";
  } else if (!isOneOf(state.cricketType, cricketTypeOptions)) {
    errors.cricketType = "That option isn't recognised. Please choose again.";
  }

  if (!state.knockedIn) {
    errors.knockedIn = "Was it knocked in before you used it?";
  } else if (!isOneOf(state.knockedIn, yesNoUnsureOptions)) {
    errors.knockedIn = "That option isn't recognised. Please choose again.";
  }

  if (!state.previouslyRepaired) {
    errors.previouslyRepaired = "Has this bat been repaired before?";
  } else if (!isOneOf(state.previouslyRepaired, yesNoUnsureOptions)) {
    errors.previouslyRepaired = "That option isn't recognised. Please choose again.";
  } else if (
    state.previouslyRepaired === "yes" &&
    t(state.previousRepairDetail).length < 3
  ) {
    errors.previousRepairDetail = "What was repaired last time?";
  }

  return errors;
}

/* ── Step 3 · Photographs (§15–§17) ──
 * Takes counts rather than the media array, so the server can run the identical rule
 * against the metadata it received. */

/** The attachments that actually count.
 *
 *  `PhotoUpload` deliberately keeps rejected picks in the list — a file that silently
 *  vanishes is how a request arrives with no photograph of the break — so every question
 *  about how many are attached has to be asked of this, never of `images.length`.
 *  Without it, two unusable files read as "2 of 8 attached", satisfied the
 *  at-least-one-photograph gate, and were POSTed to a server that runs `validateMedia`
 *  over every one: a single bad pick left on screen failed an otherwise-complete
 *  submission, and the message named the file rather than the step. */
export function readyMedia<T extends { status: "ready" | "error" }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.status === "ready");
}

export function validatePhotoCount(imageCount: number): string | null {
  if (imageCount === 0) {
    return "At least one photograph, please — our technicians can't diagnose a bat they can't see.";
  }
  if (imageCount > MAX_IMAGES) {
    return `That's more than we can take at once. Please keep it to ${MAX_IMAGES} photographs.`;
  }
  return null;
}

/* ── Step 4 · What happened + service (§18–§19) ──
 * The description is optional on purpose: a customer who has selected "broken handle"
 * and photographed it has already told us what we need, and a required essay is the
 * step people abandon. */

export function validateService(state: BatDoctorFormState): BatDoctorErrors {
  const errors: BatDoctorErrors = {};

  if (!state.serviceType) {
    errors.serviceType =
      "Tell us what you'd like us to do — “Not sure” is a perfectly good answer.";
  } else if (!isOneOf(state.serviceType, serviceTypes)) {
    errors.serviceType = "That service isn't one of the options. Please choose again.";
  }

  return errors;
}

/* ── Step 5 · You and your address (§20–§21) ── */

export function validateContact(state: BatDoctorFormState): BatDoctorErrors {
  const errors: BatDoctorErrors = {};

  if (t(state.fullName).length < 2) {
    errors.fullName = "We need a name for the bat's paperwork.";
  }

  if (!t(state.phone)) {
    errors.phone = "A phone number, so we can reach you about the diagnosis.";
  } else if (!looksLikePhone(state.phone)) {
    errors.phone = "That doesn't look like a 10-digit mobile number.";
  }

  if (!t(state.email)) {
    errors.email = "An email address for your diagnosis and quote.";
  } else if (!looksLikeEmail(state.email)) {
    errors.email = "That email address looks incomplete — check for a typo.";
  }

  if (t(state.addressLine1).length < 4) {
    errors.addressLine1 = "Where should the bat be collected from and returned to?";
  }

  if (t(state.city).length < 2) errors.city = "Which city?";
  if (t(state.state).length < 2) errors.state = "Which state?";

  const pin = state.pin.replace(/\s/g, "");
  if (!pin) {
    errors.pin = "PIN code, please.";
  } else if (!/^\d{6}$/.test(pin)) {
    errors.pin = "An Indian PIN code is six digits.";
  }

  if (t(state.country).length < 2) errors.country = "Which country?";

  return errors;
}

/* ── The whole thing ──
 * Used by the review step and by the route handler. Merged in step order so that when
 * something upstream is wrong the customer is sent back to the earliest broken step
 * rather than the last one. */

export const BAT_DOCTOR_STEP_VALIDATORS = [
  validateDamage,
  validateBat,
  validateService,
  validateContact,
] as const;

export function validateAll(state: BatDoctorFormState): BatDoctorErrors {
  return {
    ...validateDamage(state),
    ...validateBat(state),
    ...validateService(state),
    ...validateContact(state),
  };
}

export function hasErrors(errors: BatDoctorErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const NO_ERRORS = EMPTY_ERRORS;

/* ── Media (§15, §17, §28) ──
 * Works on metadata rather than a `File`, so the identical check runs client-side
 * against the picked file and server-side against what was actually posted. A client
 * that skips this gets the same answer from the route handler. */

export interface MediaMeta {
  name: string;
  size: number;
  mime: string;
}

function prettyBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(mb >= 10 ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Returns a customer-readable reason, or null when the file is acceptable. */
export function validateMedia(
  meta: MediaMeta,
  kind: "image" | "video",
): string | null {
  if (kind === "image") {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(meta.mime)) {
      return "That file isn't a photo we can read. JPG, PNG or WebP, please.";
    }
    if (meta.size > MAX_IMAGE_BYTES) {
      return `That photo is ${prettyBytes(meta.size)} — a little large. Please keep photos under ${prettyBytes(MAX_IMAGE_BYTES)}.`;
    }
    if (meta.size === 0) {
      return "That file came through empty. Try selecting it again.";
    }
    return null;
  }

  if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(meta.mime)) {
    return "That video format isn't one we can read. MP4, MOV or WebM, please.";
  }
  if (meta.size > MAX_VIDEO_BYTES) {
    return `That video is ${prettyBytes(meta.size)} — please keep it under ${prettyBytes(MAX_VIDEO_BYTES)}. A few seconds is plenty.`;
  }
  if (meta.size === 0) {
    return "That file came through empty. Try selecting it again.";
  }
  return null;
}

/** Server-side sweep over the media the client claims to have attached. Returns the
 *  first problem found, phrased for the customer. */
export function validateMediaRefs(
  images: MediaRef[],
  video: MediaRef | null,
): string | null {
  const countError = validatePhotoCount(images.length);
  if (countError) return countError;

  for (const image of images) {
    const problem = validateMedia(image, "image");
    if (problem) return problem;
  }

  if (video) {
    const problem = validateMedia(video, "video");
    if (problem) return problem;
  }

  return null;
}
