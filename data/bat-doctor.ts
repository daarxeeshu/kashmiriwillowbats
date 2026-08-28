import { SUPPORTED_IMAGE_MIME_TYPES } from "@/lib/images";
import type {
  BatDoctorOption,
  DamageCategory,
  DiagnosisHotspot,
  RepairStatusMeta,
} from "@/types/bat-doctor";

/* ── Bat Doctor content, as data ─────────────────────────────────────────────────
 *
 * Every list the feature renders lives here rather than in JSX. The reason is the
 * one the brief gives twice: a new repair category must be an entry in an array, not
 * a rebuild of a component. Adding "WATER DAMAGE" to `damageCategories` puts a card
 * in the grid, a checkbox in the summary, a line in the request record and an option
 * in the technician's brief, with no component edited.
 *
 * It also keeps the workflow honest. `serviceTypes`, `purchaseAgeOptions` and the
 * rest are the *only* vocabulary the form can produce, so the values that reach the
 * request are a closed set the business defined — which is what makes server-side
 * validation possible at all (see `lib/bat-doctor/validate.ts`). */

/* ── §7 · The six headline damage cards ── */

export const damageCategories: DamageCategory[] = [
  {
    id: "toe-damage",
    number: "01",
    title: "Toe Repair",
    description: "Cracked, chipped or damaged toe",
    detail:
      "The toe is trimmed back to sound willow, re-bonded and sealed, then re-protected so moisture cannot get back in.",
    region: "toe",
    severity: "surface",
  },
  {
    id: "broken-handle",
    number: "02",
    title: "Broken Handle",
    description: "Handle cracked or completely broken",
    detail:
      "A full handle replacement — the old handle is drawn out of the splice and a new cane handle is fitted and bound.",
    region: "handle",
    severity: "structural",
  },
  {
    id: "broken-bat",
    number: "03",
    title: "Broken Bat",
    description: "Major structural damage or split",
    detail:
      "Assessed before anything else. Where the blade is sound either side of the break it is clamped, bonded and re-pressed.",
    region: "blade",
    severity: "structural",
  },
  {
    id: "broken-edge",
    number: "04",
    title: "Broken Edge",
    description: "Edge cracked, chipped or split",
    detail:
      "The edge is bonded under clamp pressure and the shoulder reshaped, then protected with a scuff sheet.",
    region: "edge",
    severity: "surface",
  },
  {
    id: "grain-explosion",
    number: "05",
    title: "Grain Explosion",
    description: "Willow grains separating or lifting",
    detail:
      "Lifted grains are worked back down and bonded, then the face is re-pressed to restore the fibre compression.",
    region: "grains",
    severity: "surface",
  },
  {
    id: "double-layer",
    number: "06",
    title: "Double Layer Bat",
    description: "Structural separation between willow layers",
    detail:
      "Separation is opened only as far as needed, bonded through the layer and clamped flat until fully cured.",
    region: "structure",
    severity: "structural",
  },
];

/** Value used for the "OTHER / I'M NOT SURE" path (§9). Kept as a constant rather
 *  than a string literal in three components, because it is also what the request
 *  record and the validator key off. */
export const OTHER_DAMAGE_ID = "other";

export function getDamageCategory(id: string): DamageCategory | undefined {
  return damageCategories.find((d) => d.id === id);
}

/** Human-readable label for anything that can land in `damageIds`, including the
 *  synthetic "other" entry. Used by the review summary and the technician brief. */
export function damageLabel(id: string): string {
  if (id === OTHER_DAMAGE_ID) return "Other / not sure";
  return getDamageCategory(id)?.title ?? id;
}

/* ── §10 · Diagnosis hotspots ──
 * Coordinates are percentages over `public/hero/bat.png`, which is a 431×1526 cutout
 * of a real bat — so `y` runs from the handle at the top to the toe at the bottom and
 * these are read off the asset, not guessed. `selects` is what a tap adds to the
 * damage selection, which is how this section feeds the workflow instead of being a
 * decorative diagram beside it. */

export const diagnosisHotspots: DiagnosisHotspot[] = [
  {
    region: "handle",
    label: "Handle",
    caption: "Inspect handle condition",
    x: 50,
    y: 13,
    side: "right",
    area: { left: 41, top: 1, width: 20, height: 29 },
    selects: ["broken-handle"],
  },
  {
    region: "grains",
    label: "Grains",
    caption: "Inspect grain condition",
    x: 46,
    y: 46,
    side: "left",
    area: { left: 29, top: 32, width: 44, height: 25 },
    selects: ["grain-explosion"],
  },
  {
    region: "edge",
    label: "Edge",
    caption: "Inspect edge damage",
    x: 68,
    y: 58,
    side: "left",
    area: { left: 59, top: 44, width: 16, height: 30 },
    selects: ["broken-edge"],
  },
  {
    region: "blade",
    label: "Split",
    caption: "Inspect structural split",
    x: 50,
    y: 68,
    side: "right",
    area: { left: 29.5, top: 54, width: 43, height: 24 },
    selects: ["broken-bat"],
  },
  {
    region: "structure",
    label: "Structure",
    caption: "Overall structural check",
    x: 32,
    y: 78,
    side: "right",
    area: { left: 28, top: 29, width: 46, height: 70 },
    selects: ["broken-bat", "double-layer"],
  },
  {
    region: "toe",
    label: "Toe",
    caption: "Inspect toe damage",
    x: 50,
    y: 93,
    side: "left",
    area: { left: 28, top: 84, width: 46, height: 16 },
    selects: ["toe-damage"],
  },
];

/* ── §11 · Bat details ── */

export const batBrands: BatDoctorOption[] = [
  { value: "kis", label: "KIS" },
  { value: "ss", label: "SS" },
  { value: "sg", label: "SG" },
  { value: "mrf", label: "MRF" },
  { value: "gm", label: "GM" },
  { value: "gray-nicolls", label: "Gray-Nicolls" },
  { value: "new-balance", label: "New Balance" },
  { value: "other", label: "Other" },
];

export const batTypes: BatDoctorOption[] = [
  { value: "kashmir-willow", label: "Kashmir Willow" },
  { value: "english-willow", label: "English Willow" },
  { value: "unknown", label: "I'm not sure" },
];

export const batGrades: BatDoctorOption[] = [
  { value: "grade-1", label: "Grade 1" },
  { value: "grade-2", label: "Grade 2" },
  { value: "grade-3", label: "Grade 3" },
  { value: "unknown", label: "Unknown" },
];

/* ── §12 · Purchase age ── */

export const purchaseAgeOptions: BatDoctorOption[] = [
  { value: "lt-3m", label: "Under 3 months" },
  { value: "3-6m", label: "3–6 months" },
  { value: "6-12m", label: "6–12 months" },
  { value: "1-2y", label: "1–2 years" },
  { value: "2-3y", label: "2–3 years" },
  { value: "gt-3y", label: "Over 3 years" },
  { value: "unknown", label: "I don't remember" },
];

/* ── §13 · Usage ── */

export const usageFrequencyOptions: BatDoctorOption[] = [
  { value: "occasional", label: "Occasionally" },
  { value: "1-2-week", label: "1–2 times a week" },
  { value: "3-4-week", label: "3–4 times a week" },
  { value: "daily", label: "Almost every day" },
  { value: "professional", label: "Professional / match use" },
];

export const cricketTypeOptions: BatDoctorOption[] = [
  { value: "leather", label: "Leather ball" },
  { value: "tennis", label: "Tennis ball" },
  { value: "practice", label: "Practice only" },
  { value: "club", label: "Club" },
  { value: "district", label: "District" },
  { value: "state", label: "State level" },
  { value: "professional", label: "Professional" },
  { value: "other", label: "Other" },
];

/* ── §14 · History ── */

export const yesNoUnsureOptions: BatDoctorOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

/* ── §19 · Service type ──
 * `recommend` is last and carries the `hint`, because it is the option for a customer
 * who does not know what they need — which the brief asks to be reassuring rather
 * than a fallback buried at the bottom of a list. */

export const serviceTypes: BatDoctorOption[] = [
  {
    value: "diagnose",
    label: "Diagnose only",
    hint: "Tell me what's wrong and what it would take",
  },
  {
    value: "repair",
    label: "Repair my bat",
    hint: "Fix the damage and return it game-ready",
  },
  {
    value: "restoration",
    label: "Full restoration",
    hint: "Structural repair, re-press, refinish, re-grip",
  },
  {
    value: "repair-refinish",
    label: "Repair + refinish",
    hint: "Repair the damage and bring the finish back",
  },
  {
    value: "recommend",
    label: "Not sure — recommend for me",
    hint: "Our technicians will advise after inspection",
  },
];

/* ── §16 · Recommended photographs ──
 * Short, because a nine-item checklist in front of a camera button is a reason not to
 * upload anything. These four cover what a technician needs to triage. */

export const photoGuide: { label: string; hint: string }[] = [
  { label: "Full bat", hint: "Front, whole length in frame" },
  { label: "Close-up", hint: "The damage itself, filling the frame" },
  { label: "Opposite side", hint: "The back of the same area" },
  { label: "Toe, edge, handle", hint: "Even if they look fine" },
];

/* ── §26 · Status architecture ──
 * Ordered — index is the progression, so the timeline renders straight from this and
 * there is no second table to keep in step. `cancelled` is excluded on purpose: it is
 * terminal and reachable from anywhere, so it is in the type but not in the ladder. */

export const repairStatusLadder: RepairStatusMeta[] = [
  {
    id: "submitted",
    label: "Submitted",
    description: "We have your request and your photographs.",
  },
  {
    id: "under_review",
    label: "Under review",
    description: "A technician is reading through what you sent.",
  },
  {
    id: "diagnosis_complete",
    label: "Diagnosis complete",
    description: "We know what is wrong and what it will take.",
  },
  {
    id: "quote_ready",
    label: "Quote ready",
    description: "Costs and turnaround confirmed for your approval.",
  },
  {
    id: "awaiting_approval",
    label: "Awaiting your approval",
    description: "Nothing happens to your bat until you say yes.",
  },
  {
    id: "collection_scheduled",
    label: "Collection scheduled",
    description: "Pickup or drop-off arranged.",
  },
  {
    id: "in_repair",
    label: "In repair",
    description: "On the bench with a technician.",
  },
  {
    id: "quality_check",
    label: "Quality check",
    description: "Checked for structure, finish and balance.",
  },
  {
    id: "ready_to_return",
    label: "Ready to return",
    description: "Packed and ready to come back to you.",
  },
  {
    id: "completed",
    label: "Completed",
    description: "Back in your hands and back in the game.",
  },
];

export const cancelledStatus: RepairStatusMeta = {
  id: "cancelled",
  label: "Cancelled",
  description: "This request was cancelled and no work was carried out.",
};

/* ── The repair process, as shown on the page ── */

export const repairProcessSteps: {
  number: string;
  title: string;
  description: string;
}[] = [
  {
    number: "01",
    title: "Diagnose",
    description: "We inspect the damage thoroughly, by hand and under light.",
  },
  {
    number: "02",
    title: "Disassemble",
    description: "The damaged area is opened up and prepared, no further.",
  },
  {
    number: "03",
    title: "Restore",
    description: "Precision repair using the techniques the break calls for.",
  },
  {
    number: "04",
    title: "Return",
    description: "Your bat comes back stronger, sealed and game-ready.",
  },
];

/** What we do and do not claim. Sits beside the diagnosis section, and the last line
 *  is the point: not every bat is repairable, and saying so is what makes the rest
 *  of the list credible. */
export const repairCapabilities: string[] = [
  "Toe repair",
  "Handle replacement",
  "Edge restoration",
  "Grain repair",
  "Structural restoration",
  "Refinishing & re-gripping",
];

/* ── Upload constraints ──
 * Duplicated nowhere: the client validator, the server validator and the file input's
 * `accept` attribute all read these, so a limit cannot be enforced in one place and
 * missed in another. */

/* Re-exported from lib/images.ts rather than restated here: the formats this site
   will deliver and the formats an upload may be are the same list, and two copies of
   it drift the moment one is edited. That module is where the reasoning lives -
   including why SVG is absent and must stay absent. */
export const ACCEPTED_IMAGE_TYPES = SUPPORTED_IMAGE_MIME_TYPES;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

/** 10 MB. A phone photograph of a bat is 2–5 MB; this leaves headroom without
 *  letting a 60 MB burst frame through. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** 60 MB, and the video is optional (§17) — a short clip of a handle flexing, not
 *  match footage. */
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

export const MAX_IMAGES = 8;
