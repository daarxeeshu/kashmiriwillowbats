import { NextResponse } from "next/server";
import type {
  CartLine,
  CheckoutDetails,
  CheckoutErrors,
  OrderReceipt,
} from "@/types/cart";
import { resolveCart } from "@/lib/cart/totals";
import { engravingError, normaliseEngraving } from "@/data/bat-options";
import { applyCoupon } from "@/lib/orders/coupon";
import { buildOrder, createOrderId, persistOrder } from "@/lib/orders/order";
import { assertOrderStoreIsDurable } from "@/lib/orders/store";
import { clientKey, isRateLimited } from "@/lib/db/rate-limit";
import { hasErrors, validateCheckout } from "@/lib/orders/validate";

/* ── POST /api/orders ─────────────────────────────────────────────────────────────
 *
 * Built to the same shape as /api/bat-doctor, because it is the same problem: a public
 * endpoint that accepts a form and creates a record.
 *
 *   1. Rate limit, before parsing.
 *   2. Bounded read — `text()` with a length check, so an oversized body is rejected
 *      before it is parsed rather than after.
 *   3. Coerce, do not cast. Every field is pulled out by name and forced to type.
 *   4. Validate with the same module the form uses.
 *   5. Re-price on the server. The client sends slugs and quantities; totals are
 *      computed here from `data/products.ts`, so a tampered payload cannot invent a
 *      price. `orderId`, `status` and `createdAt` are issued here for the same reason.
 */

export const runtime = "nodejs";

/** 32 KB. This payload is a short form plus a list of slugs — never file data. */
const MAX_BODY_BYTES = 32 * 1024;
/** A cart with more distinct products than this is not a person shopping. */
const MAX_LINES = 50;

/* Rate limiting moved to `lib/db/rate-limit.ts`.

   It used to be a module-level `Map` here. That is correct on one long-lived process
   and meaningless on a serverless host, where each instance holds its own copy and
   the cap becomes per-instance rather than per-person. The shared implementation
   counts against Postgres when Supabase is configured and falls back to the same
   in-memory behaviour when it is not. */
const RATE_LIMIT = { bucket: "orders", max: 12, windowMs: 10 * 60 * 1000 };

function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function readDetails(p: Record<string, unknown>): CheckoutDetails {
  return {
    fullName: str(p.fullName, 120),
    phone: str(p.phone, 32),
    email: str(p.email, 200),
    addressLine1: str(p.addressLine1, 200),
    addressLine2: str(p.addressLine2, 200),
    city: str(p.city, 100),
    state: str(p.state, 100),
    pin: str(p.pin, 16),
    notes: str(p.notes, 800),
    couponCode: str(p.couponCode, 32),
    engraving: normaliseEngraving(str(p.engraving, 64)),
  };
}

function readLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: CartLine[] = [];
  for (const raw of value.slice(0, MAX_LINES)) {
    if (typeof raw !== "object" || raw === null) continue;
    const { slug, qty, options, engraving } = raw as Record<string, unknown>;
    if (typeof slug !== "string" || !slug) continue;

    /* Keyed on slug plus spec, so a genuine two-configuration order survives while a
       duplicate of the same line does not. The option ids are passed through here and
       validated in `resolveCart`, which knows the product's category and therefore
       whether options apply — an unknown id resolves to that group's default and can
       never reach the order. */
    const spec =
      typeof options === "object" && options !== null
        ? Object.entries(options as Record<string, unknown>)
            .filter(([, v]) => typeof v === "string")
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => k.slice(0, 32) + ":" + String(v).slice(0, 32))
            .join(",")
        : "";
    const name = normaliseEngraving(
      typeof engraving === "string" ? engraving : "",
    );
    const key = slug + "|" + spec + "|" + name;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      slug: slug.slice(0, 120),
      qty: typeof qty === "number" ? qty : 1,
      options:
        typeof options === "object" && options !== null
          ? (options as Record<string, string>)
          : undefined,
      engraving: name || undefined,
    });
  }
  return out;
}

interface FailureBody {
  message: string;
  fieldErrors?: CheckoutErrors;
}

function fail(status: number, body: FailureBody) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (await isRateLimited(clientKey(request), RATE_LIMIT)) {
    return fail(429, {
      message:
        "That's several orders in a short time. Please wait a few minutes, or message us on WhatsApp and we'll take it from there.",
    });
  }

  /* Before anything else: if orders would be written to a filesystem this host
     throws away, stop here. The customer gets the honest failure below instead of a
     confirmation screen for an order that no longer exists. */
  try {
    assertOrderStoreIsDurable();
  } catch (error) {
    console.error("[orders] storage is not durable on this host", error);
    return fail(502, {
      message:
        "We couldn't file that order just now. Please send it to us on WhatsApp and we'll take it from there.",
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return fail(413, { message: "That order is larger than we can accept." });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, { message: "We couldn't read that order. Please try again." });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return fail(413, { message: "That order is larger than we can accept." });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(400, { message: "We couldn't read that order. Please try again." });
  }
  if (typeof parsed !== "object" || parsed === null) {
    return fail(400, { message: "We couldn't read that order. Please try again." });
  }

  const payload = parsed as Record<string, unknown>;
  const details = readDetails(payload);
  const lines = readLines(payload.lines);

  // Resolved against the server's own catalogue: unknown slugs simply vanish, so an
  // order can never contain a product this site does not sell.
  const entries = resolveCart(lines);
  if (entries.length === 0) {
    return fail(400, {
      message: "Your cart is empty, or none of its items are available any more.",
    });
  }

  const fieldErrors = validateCheckout(details);
  if (hasErrors(fieldErrors)) {
    return fail(400, {
      message: "A few details still need your attention.",
      fieldErrors,
    });
  }

  /* The coupon is re-checked here against the server's own cart and prices. The client
     sends a code and never an amount, so the discount recorded is the one this file
     computes - see lib/orders/coupon.ts.

     A code that no longer qualifies rejects the submission rather than being dropped
     quietly: the customer was shown a discounted total, and creating the order without
     it would mean the figure they agreed to is not the figure we recorded. */
  const subtotal = entries.reduce((sum, e) => sum + e.lineTotal, 0);
  let coupon = null;
  if (details.couponCode.trim()) {
    const result = applyCoupon(details.couponCode, entries, subtotal);
    if (!result.ok) {
      return fail(400, {
        message: "That discount code could not be applied.",
        fieldErrors: { couponCode: result.reason },
      });
    }
    coupon = result.coupon;
  }

  /* Engraving is re-checked here against the same rules the product page uses, so a
     payload cannot smuggle in text longer than the laser cuts or characters it does
     not have. `normaliseEngraving` already trimmed and capped it during coercion;
     this rejects anything still invalid rather than silently engraving something
     else onto a customer’s bat. */
  const engravingProblem = engravingError(details.engraving);
  if (engravingProblem) {
    return fail(400, {
      message: "That engraving text can’t be used.",
      fieldErrors: { engraving: engravingProblem },
    });
  }

  const now = new Date();
  const order = buildOrder(
    entries,
    details,
    coupon,
    details.engraving || null,
    createOrderId(now),
    now,
  );

  try {
    await persistOrder(order);
  } catch {
    return fail(502, {
      message:
        "We couldn't file that order just now. Please send it to us on WhatsApp and we'll take it from there.",
    });
  }

  const receipt: OrderReceipt = {
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt,
  };

  // The full order comes back, not just the receipt: the confirmation screen builds
  // the WhatsApp message from server-priced lines, so what the customer sends is what
  // the server recorded.
  return NextResponse.json({ ...receipt, order }, { status: 201 });
}
