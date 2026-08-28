/* ── Bat Doctor domain types ─────────────────────────────────────────────────────
 *
 * Separate from `types/commerce.ts` because Bat Doctor is a service, not a product:
 * nothing here has a price, a slug or a cart. Kept in `types/` alongside it so the
 * project keeps one place where shared shapes live.
 *
 * The split that matters in this file is customer-supplied versus technician-supplied.
 * A `RepairRequest` carries both, and the technician half (`diagnosis`,
 * `technicianNotes`, `quote`) is deliberately nullable and never written by the
 * client submission path. That is what keeps §22's "preliminary assessment" honest:
 * the form can describe symptoms, only a person who has held the bat can fill in the
 * diagnosis. */

/** A choice in a radio group or select. `hint` renders as the second line on the
 *  wider option cards — used where a plain label would need cricket vocabulary the
 *  customer may not have (§9). */
export interface BatDoctorOption {
  value: string;
  label: string;
  hint?: string;
}

/** The six regions a bat can be diagnosed by. Shared between the damage cards (§7)
 *  and the diagnosis hotspots (§10) so that tapping "EDGE" on the bat and tapping
 *  the "BROKEN EDGE" card resolve to the same selection — one state, two ways in. */
export type BatRegion =
  | "toe"
  | "handle"
  | "blade"
  | "edge"
  | "grains"
  | "structure";

/** One of the headline damage cards. `id` is what gets stored in the request, so it
 *  is a stable slug rather than an index — reordering or inserting a card must not
 *  silently change what an existing request means. */
export interface DamageCategory {
  id: string;
  /** Rendered as the card's "01".."06". Explicit rather than derived from array
   *  position so the grid can be reordered without renumbering the design. */
  number: string;
  title: string;
  /** One line, on the card. */
  description: string;
  /** What the technician actually does — shown in the expanded/selected state. */
  detail: string;
  region: BatRegion;
  /** Drives the red accent weight: a chipped toe and a bat snapped through the
   *  blade should not read at the same severity (§32's "subtle red for damaged
   *  states" needs a scale, or every card shouts). */
  severity: "surface" | "structural";
}

/** A tappable point on the diagnosis bat. Coordinates are percentages of the bat
 *  image box so they hold at every breakpoint without a second set of values. */
export interface DiagnosisHotspot {
  region: BatRegion;
  label: string;
  caption: string;
  /** % across / % down the bat image. */
  x: number;
  /** % down. */
  y: number;
  /** The part of the bat this region covers, as percentages of the image box, used
   *  to light that area up when the region is selected.
   *
   *  Measured off the alpha channel of /hero/bat.png rather than estimated: the
   *  handle occupies x 43-59% down to y~30%, where the blade widens abruptly to
   *  x 30-72%. Percentages because the image is rendered `object-contain` in a box
   *  of its own aspect ratio, so these hold at every width with no breakpoints. */
  area: { left: number; top: number; width: number; height: number };
  /** Which side the label panel sits on at `lg` and up. Below that the panels
   *  stack under the bat and this is ignored. */
  side: "left" | "right";
  /** The damage categories this region selects. A region can map to more than one
   *  card — "STRUCTURE" covers both a snapped blade and layer separation. */
  selects: string[];
}

/** §26. Ordered: the array's index *is* the progression, so a timeline can render
 *  from it without a second ordering table. `CANCELLED` is deliberately not in the
 *  progression — it is a terminal state that can happen from anywhere, so it lives
 *  in the type but outside the ordered list. */
export type RepairStatus =
  | "submitted"
  | "under_review"
  | "diagnosis_complete"
  | "quote_ready"
  | "awaiting_approval"
  | "collection_scheduled"
  | "in_repair"
  | "quality_check"
  | "ready_to_return"
  | "completed"
  | "cancelled";

export interface RepairStatusMeta {
  id: RepairStatus;
  label: string;
  /** Customer-facing explanation. Written in the second person, because this is
   *  what a customer reads on a tracking screen — not an internal state name. */
  description: string;
}

/** Everything the customer fills in. One flat object on purpose: it is the unit that
 *  gets validated, summarised for review (§23) and serialised to the API, and a
 *  nested shape would need a path-walker for each of those. It is reshaped into the
 *  nested `RepairRequest` once, server-side. */
export interface BatDoctorFormState {
  /* 01 — damage (§7–§9) */
  damageIds: string[];
  otherDamageSelected: boolean;
  otherDamageText: string;

  /* 02 — bat (§11–§14) */
  brand: string;
  brandOther: string;
  batType: string;
  batModel: string;
  grade: string;
  purchaseAge: string;
  purchaseDate: string;
  usageFrequency: string;
  cricketType: string;
  knockedIn: string;
  previouslyRepaired: string;
  previousRepairDetail: string;

  /* 04 — what happened + service (§18–§19) */
  description: string;
  serviceType: string;

  /* 05 — customer + address (§20–§21) */
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

export type BatDoctorField = keyof BatDoctorFormState;

/** Field-level errors, keyed by field name. Values are the sentence shown under the
 *  input — already human-readable at the point of creation, so no component ever has
 *  to translate a code into prose (§35). */
export type BatDoctorErrors = Partial<Record<BatDoctorField, string>>;

/** A file the customer has attached. Held separately from `BatDoctorFormState`
 *  because a `File` is not serialisable and because each one carries its own status:
 *  the spec asks for per-item thumbnail, remove, upload state and error state (§15),
 *  which a bare `File[]` cannot express. */
export interface MediaItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  kind: "image" | "video";
  /** `blob:` URL for the thumbnail. Revoked on removal — an un-revoked object URL
   *  pins the whole file in memory for the life of the document, and a customer
   *  photographing a bat on a phone is uploading multi-megabyte files. */
  previewUrl: string;
  status: "ready" | "error";
  error?: string;
}

/** What the client POSTs. Files are described, not embedded: there is no object
 *  storage in this project (see `lib/bat-doctor/submit.ts`), so the request records
 *  what the customer selected and the photographs travel over the channel the site
 *  actually has. When storage lands, these gain a `url` and nothing else moves. */
export interface MediaRef {
  name: string;
  size: number;
  mime: string;
  kind: "image" | "video";
  /** Set once object storage exists. */
  url?: string;
}

/** §27 — the repair-request record. This is the shape a database table would be
 *  generated from, and the shape the API route builds after validating. Nested
 *  because these are the natural rows/columns of the thing: customer, bat, purchase,
 *  usage, damage, media, service, then the technician-owned fields. */
export interface RepairRequest {
  requestId: string;
  status: RepairStatus;
  createdAt: string;
  updatedAt: string;

  /** Null until authentication exists. Present in the shape now so that adding auth
   *  is a matter of filling it in, not migrating the record. */
  customerId: string | null;

  customer: {
    fullName: string;
    phone: string;
    email: string;
  };

  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pin: string;
    country: string;
  };

  bat: {
    brand: string;
    brandOther: string;
    type: string;
    model: string;
    grade: string;
  };

  purchase: {
    ageBucket: string;
    /** ISO date, or "" when the customer did not give one. Optional by design (§12). */
    exactDate: string;
  };

  usage: {
    frequency: string;
    cricketType: string;
    knockedIn: string;
    previouslyRepaired: string;
    previousRepairDetail: string;
  };

  damage: {
    /** `DamageCategory.id[]`. */
    types: string[];
    /** Free text from "OTHER / I'M NOT SURE" (§9). */
    otherDescription: string;
    /** "Tell us what happened" (§18). */
    description: string;
  };

  media: {
    images: MediaRef[];
    video: MediaRef | null;
  };

  serviceType: string;

  /* ── Technician-owned. Never set by a customer submission. ── */
  diagnosis: string | null;
  technicianNotes: string | null;
  quote: {
    amount: number | null;
    currency: "INR";
    notes: string | null;
  } | null;
}

/** What the API route returns on success. */
export interface RepairRequestReceipt {
  requestId: string;
  status: RepairStatus;
  createdAt: string;
}
