import type {
  BatDoctorField,
  BatDoctorFormState,
  BatDoctorOption,
  MediaRef,
} from "@/types/bat-doctor";
import {
  batBrands,
  batGrades,
  batTypes,
  cricketTypeOptions,
  damageLabel,
  purchaseAgeOptions,
  serviceTypes,
  usageFrequencyOptions,
  yesNoUnsureOptions,
} from "@/data/bat-doctor";
import { OTHER_DAMAGE_ID } from "@/data/bat-doctor";

/* ── Turning form state into something a person reads ────────────────────────────
 *
 * Three consumers, one set of lookups:
 *
 *   · the preliminary assessment panel (§22)
 *   · the review-before-submit summary, with its per-section EDIT (§23)
 *   · the brief the technician receives (below)
 *
 * They existed as three separate mappings in the first draft and immediately drifted
 * — the review screen said "3–4 times a week" where the technician brief said
 * "3-4-week", because one of them had been written against the labels and the other
 * against the stored values. Everything resolves through `labelOf` now, so a customer
 * and a technician are always looking at the same words.
 *
 * No browser or server API in here: the review summary renders on the client and the
 * technician brief is assembled from the same functions. */

export function labelOf(options: BatDoctorOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Brand, resolving the free-text "Other" into the actual brand the customer typed —
 *  "Other" alone is not information a technician can use. */
export function brandLabel(state: BatDoctorFormState): string {
  if (state.brand === "other") {
    return state.brandOther.trim() || "Other (unspecified)";
  }
  return labelOf(batBrands, state.brand);
}

export function damageSummary(state: BatDoctorFormState): string[] {
  const items = state.damageIds
    .filter((id) => id !== OTHER_DAMAGE_ID)
    .map(damageLabel);

  if (state.otherDamageSelected) {
    const text = state.otherDamageText.trim();
    items.push(text ? `Other — ${text}` : "Other / not sure");
  }

  return items;
}

/** One row of the review summary. */
export interface SummaryRow {
  label: string;
  value: string;
  /** Rendered dimmer, for the rows the customer chose not to fill in. */
  empty?: boolean;
}

export interface SummarySection {
  title: string;
  /** Which workflow step the EDIT action jumps back to (§23). */
  step: number;
  rows: SummaryRow[];
}

function row(label: string, value: string): SummaryRow {
  const trimmed = value.trim();
  return trimmed
    ? { label, value: trimmed }
    : { label, value: "Not given", empty: true };
}

export function buildSummary(
  state: BatDoctorFormState,
  images: MediaRef[],
  video: MediaRef | null,
): SummarySection[] {
  const issues = damageSummary(state);

  return [
    {
      title: "The problem",
      step: 0,
      rows: [
        {
          label: "Issues",
          value: issues.length ? issues.join(" · ") : "None selected",
          empty: issues.length === 0,
        },
      ],
    },
    {
      title: "The bat",
      step: 1,
      rows: [
        row("Brand", brandLabel(state)),
        row("Type", labelOf(batTypes, state.batType)),
        row("Model", state.batModel),
        row("Grade", state.grade ? labelOf(batGrades, state.grade) : ""),
        row("Purchased", labelOf(purchaseAgeOptions, state.purchaseAge)),
        row("Exact date", state.purchaseDate),
        row("Use", labelOf(usageFrequencyOptions, state.usageFrequency)),
        row("Cricket", labelOf(cricketTypeOptions, state.cricketType)),
        row("Knocked in", labelOf(yesNoUnsureOptions, state.knockedIn)),
        row(
          "Repaired before",
          state.previouslyRepaired === "yes"
            ? `Yes — ${state.previousRepairDetail.trim() || "details not given"}`
            : labelOf(yesNoUnsureOptions, state.previouslyRepaired),
        ),
      ],
    },
    {
      title: "Photographs",
      step: 2,
      rows: [
        {
          label: "Photos",
          value: images.length
            ? `${images.length} attached`
            : "None attached",
          empty: images.length === 0,
        },
        row("Video", video ? video.name : ""),
      ],
    },
    {
      title: "What you'd like us to do",
      step: 3,
      rows: [
        row("Service", labelOf(serviceTypes, state.serviceType)),
        row("What happened", state.description),
      ],
    },
    {
      title: "You",
      step: 4,
      rows: [
        row("Name", state.fullName),
        row("Phone", state.phone),
        row("Email", state.email),
        row(
          "Address",
          [
            state.addressLine1,
            state.addressLine2,
            state.city,
            state.state,
            state.pin,
            state.country,
          ]
            .map((part) => part.trim())
            .filter(Boolean)
            .join(", "),
        ),
      ],
    },
  ];
}

/** Which step an error belongs to, so a failed submit can send the customer back to
 *  the earliest broken step instead of leaving them on the review screen guessing. */
const FIELD_STEP: Record<BatDoctorField, number> = {
  damageIds: 0,
  otherDamageSelected: 0,
  otherDamageText: 0,
  brand: 1,
  brandOther: 1,
  batType: 1,
  batModel: 1,
  grade: 1,
  purchaseAge: 1,
  purchaseDate: 1,
  usageFrequency: 1,
  cricketType: 1,
  knockedIn: 1,
  previouslyRepaired: 1,
  previousRepairDetail: 1,
  description: 3,
  serviceType: 3,
  fullName: 4,
  phone: 4,
  email: 4,
  addressLine1: 4,
  addressLine2: 4,
  city: 4,
  state: 4,
  pin: 4,
  country: 4,
};

export function stepForField(field: BatDoctorField): number {
  return FIELD_STEP[field] ?? 0;
}

export function earliestBrokenStep(fields: BatDoctorField[]): number {
  return fields.reduce(
    (earliest, field) => Math.min(earliest, stepForField(field)),
    Number.POSITIVE_INFINITY,
  );
}

/* ── The technician brief ──
 * The message that carries the request to the business. Plain text, because it is
 * delivered over WhatsApp — the only customer-contact channel this project has
 * (`lib/whatsapp.ts`, used by the product pages and the header's Bat Expert button).
 *
 * Deliberately structured rather than chatty: a technician reading it on a phone
 * should be able to find the bat, the issue and the photographs without scrolling
 * past pleasantries. The request ID leads, because that is what the photographs and
 * every later message get matched against. */

export function buildTechnicianBrief(
  state: BatDoctorFormState,
  images: MediaRef[],
  video: MediaRef | null,
  requestId: string,
): string {
  const issues = damageSummary(state);
  const lines: string[] = [
    `BAT DOCTOR REQUEST — ${requestId}`,
    "",
    "ISSUES",
    ...(issues.length ? issues.map((i) => `• ${i}`) : ["• Not specified"]),
    "",
    "BAT",
    `• Brand: ${brandLabel(state)}`,
    `• Type: ${labelOf(batTypes, state.batType)}`,
  ];

  if (state.batModel.trim()) lines.push(`• Model: ${state.batModel.trim()}`);
  if (state.grade) lines.push(`• Grade: ${labelOf(batGrades, state.grade)}`);

  lines.push(
    `• Purchased: ${labelOf(purchaseAgeOptions, state.purchaseAge)}${
      state.purchaseDate ? ` (${state.purchaseDate})` : ""
    }`,
    `• Use: ${labelOf(usageFrequencyOptions, state.usageFrequency)}, ${labelOf(
      cricketTypeOptions,
      state.cricketType,
    )}`,
    `• Knocked in: ${labelOf(yesNoUnsureOptions, state.knockedIn)}`,
    `• Repaired before: ${
      state.previouslyRepaired === "yes"
        ? `yes — ${state.previousRepairDetail.trim() || "details not given"}`
        : labelOf(yesNoUnsureOptions, state.previouslyRepaired)
    }`,
    "",
    "SERVICE REQUESTED",
    `• ${labelOf(serviceTypes, state.serviceType)}`,
  );

  if (state.description.trim()) {
    lines.push("", "WHAT HAPPENED", state.description.trim());
  }

  lines.push(
    "",
    "CUSTOMER",
    `• ${state.fullName.trim()}`,
    `• ${state.phone.trim()}`,
    `• ${state.email.trim()}`,
    "",
    "COLLECTION / RETURN",
    [
      state.addressLine1,
      state.addressLine2,
      state.city,
      state.state,
      state.pin,
      state.country,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", "),
    "",
    "PHOTOGRAPHS",
    `• ${images.length} photo${images.length === 1 ? "" : "s"} ready to send${
      video ? " + 1 video" : ""
    } — attaching now.`,
  );

  return lines.join("\n");
}

/** The follow-up a customer sends to ask where their bat is (§25's "TRACK MY
 *  REQUEST"). Short, and carries the ID so it can be answered without a back and
 *  forth. */
export function buildTrackingMessage(requestId: string): string {
  return `Hi, I'd like an update on my Bat Doctor request ${requestId}.`;
}
