import { NextResponse } from "next/server";
import { settingsStore } from "@/lib/settings/store";

/* ── PUT /admin/api/promo-tape ───────────────────────────────────────────────────
 *
 * Saves the tape settings. Read by nobody; the storefront reads `/api/promo-tape`.
 *
 * ── Why it lives under /admin ──
 * `middleware.ts` guards `/admin/:path*`, so this path is already behind basic auth
 * with no change to the matcher and no second copy of the credential check. Putting
 * the write at `/api/promo-tape` instead would have left a public endpoint that
 * rewrites site copy — the page it is called from being password-protected does not
 * protect the endpoint, which is reachable directly.
 *
 * Everything is coerced rather than trusted: `sanitisePromoTape` runs inside the
 * store, and the sanitised value is what comes back, so the form redraws from what
 * was actually stored instead of from what it hoped to store.
 */

export const runtime = "nodejs";

/** Three short strings and a number. Anything approaching this is not a save. */
const MAX_BODY_BYTES = 4 * 1024;

export async function PUT(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "That payload is too large." }, { status: 413 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ message: "Could not read that request." }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "That payload is too large." }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: "Could not read that request." }, { status: 400 });
  }

  try {
    const saved = await settingsStore.savePromoTape(parsed);
    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    /* Reported, unlike the read. A save that silently did nothing would have the
     * admin change the copy, see the form redraw, and find the storefront unchanged
     * with nothing anywhere saying why. */
    console.error("[promo-tape] could not save settings", error);
    return NextResponse.json(
      { message: "Could not save. The settings file may not be writable." },
      { status: 502 },
    );
  }
}
