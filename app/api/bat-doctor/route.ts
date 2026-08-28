import { NextResponse } from "next/server";
import type {
  BatDoctorErrors,
  BatDoctorFormState,
  MediaRef,
  RepairRequestReceipt,
} from "@/types/bat-doctor";
import {
  buildRepairRequest,
  createRequestId,
  persistRepairRequest,
} from "@/lib/bat-doctor/request";
import {
  hasErrors,
  validateAll,
  validateMediaRefs,
} from "@/lib/bat-doctor/validate";

/* ── POST /api/bat-doctor ─────────────────────────────────────────────────────────
 *
 * The first route handler in this project, and it exists for one reason: §29 asks for
 * server-side validation and says not to trust the client alone. A form that validates
 * only in the browser is validated by whoever controls the browser.
 *
 * The shape of the defence here, in order:
 *
 *   1. Rate limit, before parsing. A submission endpoint that accepts unlimited POSTs
 *      is the cheapest thing on a site to abuse.
 *   2. Bounded read. `request.text()` with a length check rather than `request.json()`
 *      straight off, so a 500 MB body is rejected before it is parsed rather than
 *      after.
 *   3. Coerce, do not cast. Every field is pulled out of the payload by name and
 *      forced to the type it must be. Nothing arrives in the record because it
 *      happened to be in the JSON — which is also what stops `status`, `diagnosis` or
 *      `quote` being smuggled in (see `buildRepairRequest`).
 *   4. Validate with the same module the form uses, so the answers cannot disagree.
 *   5. Only then issue an ID and hand the record to the storage seam.
 *
 * Runs on the Node runtime because `crypto.getRandomValues` and the seam's eventual
 * database client both want it; nothing here is edge-specific. */

export const runtime = "nodejs";

/** 128 KB. The payload is form fields plus file *metadata* — names, sizes, MIME types
 *  — never file bytes, so anything near this is not a real submission. */
const MAX_BODY_BYTES = 128 * 1024;

/* ── Rate limiting ──
 * In-process and therefore per-instance: it resets on redeploy and does not span
 * replicas. Said plainly because the alternative is pretending otherwise — a real
 * limiter needs shared state (Redis, Upstash, the platform's own), and that is a
 * dependency this project has not chosen yet. What this does do is stop a single
 * client hammering the endpoint, which is the case it is here for. */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_MAX) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }

  return false;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/* ── Coercion ──
 * `unknown` in, known types out. Strings are capped, because a field with no ceiling
 * is a storage and rendering problem regardless of what the validator thinks of its
 * contents. */

function str(value: unknown, max = 400): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function strArray(value: unknown, maxItems = 24): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .slice(0, maxItems)
    .map((v) => v.slice(0, 64));
}

function bool(value: unknown): boolean {
  return value === true;
}

function readFormState(payload: Record<string, unknown>): BatDoctorFormState {
  return {
    damageIds: strArray(payload.damageIds),
    otherDamageSelected: bool(payload.otherDamageSelected),
    otherDamageText: str(payload.otherDamageText, 1200),

    brand: str(payload.brand, 64),
    brandOther: str(payload.brandOther, 80),
    batType: str(payload.batType, 64),
    batModel: str(payload.batModel, 120),
    grade: str(payload.grade, 64),
    purchaseAge: str(payload.purchaseAge, 64),
    purchaseDate: str(payload.purchaseDate, 32),
    usageFrequency: str(payload.usageFrequency, 64),
    cricketType: str(payload.cricketType, 64),
    knockedIn: str(payload.knockedIn, 32),
    previouslyRepaired: str(payload.previouslyRepaired, 32),
    previousRepairDetail: str(payload.previousRepairDetail, 600),

    description: str(payload.description, 2000),
    serviceType: str(payload.serviceType, 64),

    fullName: str(payload.fullName, 120),
    phone: str(payload.phone, 32),
    email: str(payload.email, 200),
    addressLine1: str(payload.addressLine1, 200),
    addressLine2: str(payload.addressLine2, 200),
    city: str(payload.city, 100),
    state: str(payload.state, 100),
    pin: str(payload.pin, 16),
    country: str(payload.country, 100),
  };
}

function readMediaRef(value: unknown): MediaRef | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const kind = raw.kind === "video" ? "video" : "image";
  const size = typeof raw.size === "number" && Number.isFinite(raw.size) ? raw.size : 0;

  return {
    name: str(raw.name, 200),
    size: Math.max(0, Math.floor(size)),
    mime: str(raw.mime, 100),
    kind,
  };
}

function readMediaRefs(value: unknown, maxItems: number): MediaRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map(readMediaRef)
    .filter((ref): ref is MediaRef => ref !== null);
}

/* ── Responses ──
 * One shape for failure, so the client has one thing to render: a sentence, plus
 * per-field messages where they exist. No stack traces, no codes, nothing a customer
 * would have to decode (§35). */

interface FailureBody {
  message: string;
  fieldErrors?: BatDoctorErrors;
}

function fail(status: number, body: FailureBody) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return fail(429, {
      message:
        "That's several requests in a short time. Please wait a few minutes, or message us on WhatsApp and we'll pick it up there.",
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return fail(413, {
      message: "That submission is larger than we can accept. Try trimming the description.",
    });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, {
      message: "We couldn't read that submission. Please try sending it again.",
    });
  }

  if (raw.length > MAX_BODY_BYTES) {
    return fail(413, {
      message: "That submission is larger than we can accept. Try trimming the description.",
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(400, {
      message: "We couldn't read that submission. Please try sending it again.",
    });
  }

  if (typeof parsed !== "object" || parsed === null) {
    return fail(400, {
      message: "We couldn't read that submission. Please try sending it again.",
    });
  }

  const payload = parsed as Record<string, unknown>;
  const state = readFormState(payload);
  const images = readMediaRefs(payload.images, 8);
  const video = readMediaRef(payload.video);

  const fieldErrors = validateAll(state);
  if (hasErrors(fieldErrors)) {
    return fail(400, {
      message: "A few details still need your attention.",
      fieldErrors,
    });
  }

  const mediaProblem = validateMediaRefs(images, video);
  if (mediaProblem) {
    return fail(400, { message: mediaProblem });
  }

  const now = new Date();
  const requestId = createRequestId(now);
  const record = buildRepairRequest(state, images, video, requestId, now);

  try {
    await persistRepairRequest(record);
  } catch {
    // The customer is not the right person to debug a storage failure, and the
    // reference has already been issued — so say what is true and give them the
    // path that does not depend on this endpoint.
    return fail(502, {
      message:
        "We couldn't file that request just now. Please send it to us on WhatsApp and we'll take it from there.",
    });
  }

  const receipt: RepairRequestReceipt = {
    requestId: record.requestId,
    status: record.status,
    createdAt: record.createdAt,
  };

  return NextResponse.json(receipt, { status: 201 });
}
