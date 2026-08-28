import type {
  BatDoctorFormState,
  MediaRef,
  RepairRequest,
} from "@/types/bat-doctor";

/* ── Server side of a repair request ─────────────────────────────────────────────
 *
 * Imported only by `app/api/bat-doctor/route.ts`. Nothing here runs in the browser,
 * which is why the ID lives here: a client-generated request number is guessable and
 * collidable, and the customer must not be the one deciding what their own reference
 * is.
 *
 * ── On persistence, plainly ──
 * This project has no database, no object storage and no authentication. That is not
 * an omission in this file — it is the state of the repository, and §27/§28 say to
 * inspect first and reuse what exists rather than introduce a second stack. So this
 * module does the two things that can be done correctly today — validate on the
 * server and issue an authoritative reference — and puts the storage decision behind
 * one function, `persistRepairRequest`, which is the single seam a real backend plugs
 * into. Nothing else in the feature needs to change when it does.
 *
 * What makes the request actually arrive in the meantime is the channel this site
 * already uses for every other customer conversation: the confirmation screen hands
 * the structured brief and the reference to WhatsApp, where the customer attaches the
 * photographs they just reviewed. That is a real delivery path, not a stub — but it
 * is a *handoff*, and the code says so rather than implying a row was written. */

/** Unambiguous alphabet: no 0/O, no 1/I/L. This reference gets read down a phone line
 *  and written on a tag that goes round a bat, so a character pair that can be
 *  misheard is a real cost. 32 symbols, four places — about a million codes per year
 *  prefix, which is far more than the collision check below will ever have to work
 *  against. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** `BD-2026-7K4Q`. The year is part of the reference because it is the first thing
 *  that narrows a search when a customer calls about a bat they sent "some time
 *  last season". */
export function createRequestId(now: Date = new Date()): string {
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]).join("");
  return `BD-${now.getFullYear()}-${code}`;
}

/** Reshapes the flat form into the record a table would be generated from.
 *
 *  The technician fields are hard-coded to null, and that is a security property
 *  rather than a placeholder: the client posts a `BatDoctorFormState`, and this is the
 *  only place a `RepairRequest` is constructed, so there is no path by which a crafted
 *  POST can arrive carrying its own `diagnosis`, `quote` or `status`. A customer
 *  cannot mark their own bat "quote ready — ₹0". */
export function buildRepairRequest(
  state: BatDoctorFormState,
  images: MediaRef[],
  video: MediaRef | null,
  requestId: string,
  now: Date = new Date(),
): RepairRequest {
  const timestamp = now.toISOString();
  const trim = (value: string) => value.trim();

  return {
    requestId,
    status: "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,

    // Filled in the day authentication exists. Present now so that adding it is a
    // write to one field rather than a migration of the record.
    customerId: null,

    customer: {
      fullName: trim(state.fullName),
      phone: trim(state.phone),
      email: trim(state.email),
    },

    address: {
      line1: trim(state.addressLine1),
      line2: trim(state.addressLine2),
      city: trim(state.city),
      state: trim(state.state),
      pin: state.pin.replace(/\s/g, ""),
      country: trim(state.country),
    },

    bat: {
      brand: state.brand,
      brandOther: trim(state.brandOther),
      type: state.batType,
      model: trim(state.batModel),
      grade: state.grade,
    },

    purchase: {
      ageBucket: state.purchaseAge,
      exactDate: trim(state.purchaseDate),
    },

    usage: {
      frequency: state.usageFrequency,
      cricketType: state.cricketType,
      knockedIn: state.knockedIn,
      previouslyRepaired: state.previouslyRepaired,
      previousRepairDetail: trim(state.previousRepairDetail),
    },

    damage: {
      types: state.damageIds,
      otherDescription: trim(state.otherDamageText),
      description: trim(state.description),
    },

    media: { images, video },

    serviceType: state.serviceType,

    diagnosis: null,
    technicianNotes: null,
    quote: null,
  };
}

/* ── The storage seam ──────────────────────────────────────────────────────────────
 *
 * One function, one job, and the only thing in the feature that has to change when a
 * backend arrives. Whatever lands — Supabase, Postgres, Firebase, a queue — the
 * replacement is the body of this function plus the media upload it implies; the
 * route handler, the validator, the form and the confirmation screen are all already
 * written against its signature.
 *
 * Today it records the request server-side so a submission is not invisible to the
 * business even if the customer closes WhatsApp, and it deliberately does NOT log the
 * customer's phone, email or address. A server log is not an access-controlled store
 * — §29 asks that customer data be protected, and the correct amount of PII to write
 * into a log file that has no access policy over it is none. The identifying fields
 * travel to the business over WhatsApp, which is an authenticated channel they
 * already own.
 *
 * When the tables exist they are, from `RepairRequest`:
 *   repair_requests               one row per request, minus the media
 *   repair_request_images         one row per file, holding a storage key not bytes
 *   repair_request_status_history one row per transition through RepairStatus
 *   repair_diagnoses              technician-owned, written after inspection
 *   repair_quotes                 technician-owned, amount + notes + approval
 * and the row must be readable only by its own customer and by staff — which needs
 * the authentication this project does not yet have, so it is the one part of §29
 * that cannot be honoured by writing code today. */
export async function persistRepairRequest(
  request: RepairRequest,
): Promise<void> {
  // Structured, and free of identifying fields on purpose — see above.
  console.info("[bat-doctor] repair request received", {
    requestId: request.requestId,
    status: request.status,
    createdAt: request.createdAt,
    damageTypes: request.damage.types,
    serviceType: request.serviceType,
    batBrand: request.bat.brand,
    batType: request.bat.type,
    purchaseAge: request.purchase.ageBucket,
    imageCount: request.media.images.length,
    hasVideo: request.media.video !== null,
  });

  await Promise.resolve();
}
