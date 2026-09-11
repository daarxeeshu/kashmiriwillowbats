import { NextResponse } from "next/server";
import { orderStore } from "@/lib/orders/store";

/* ── "The customer tapped through to WhatsApp" ───────────────────────────────────
 *
 * Called when the Send on WhatsApp link is clicked, so the dashboard can tell an
 * order that was abandoned on the confirmation screen from one that reached WhatsApp.
 *
 * ── What it does not prove ──
 * That the message was sent. WhatsApp opens with the text prefilled and the customer
 * still has to press send inside an app this site cannot see. So the state it writes
 * is `whatsapp_opened`, never anything claiming contact was made — that remains a
 * human judgement, made from the inbox, through the dashboard.
 *
 * ── Why it takes no status ──
 * This endpoint is unauthenticated: it has to be, because the person clicking is a
 * customer with no account. So it accepts one thing, an order id, and performs one
 * hard-coded transition. If it read a status from the body, anyone who could guess an
 * order id could mark orders confirmed and they would vanish from the shop's list of
 * things to chase.
 *
 * Only new -> whatsapp_opened. A confirmed order is never walked backwards by a
 * customer re-opening their tab.
 */

const MAX_BODY_BYTES = 512;

// Server memory, like the orders limiter: enough to blunt a script, gone on restart,
// and replaced by whatever the database offers when this moves to Supabase.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 60;
const hits = new Map<string, number[]>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) return true;
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let orderId: unknown;
  try {
    ({ orderId } = (await request.json()) as { orderId?: unknown });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof orderId !== "string" || !/^KWB-\d{4}-[A-Z0-9]{4}$/.test(orderId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const existing = await orderStore.get(orderId);
  /* A deliberately flat response either way. An endpoint that answered "no such
     order" differently from "already opened" would let someone probe which order ids
     are real, and order ids are the reference customers quote. */
  if (!existing || existing.status !== "new") {
    return NextResponse.json({ ok: true });
  }

  await orderStore.setStatus(orderId, "whatsapp_opened", new Date().toISOString());
  return NextResponse.json({ ok: true });
}
