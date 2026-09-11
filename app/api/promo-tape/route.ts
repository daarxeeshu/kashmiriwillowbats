import { NextResponse } from "next/server";
import { settingsStore } from "@/lib/settings/store";

/* ── GET /api/promo-tape ─────────────────────────────────────────────────────────
 *
 * What the tape should say, read by `PromoTape` on the client.
 *
 * ── Why the client fetches this instead of the page rendering it ──
 * The homepage and `/brands` are statically prerendered, which is most of why they
 * are fast. Reading the settings in those server components would make both dynamic
 * — every visitor would wait on a file read to be told a slogan — and, worse, a
 * prerendered page would bake in whichever value was current at build time, so the
 * admin switch would not take effect until the next deploy. That is the opposite of
 * what the switch is for.
 *
 * So the pages stay static and the tape asks. It is an absolutely positioned
 * decoration, so arriving a moment late costs no layout shift, and "off" renders
 * nothing rather than something that has to be hidden.
 *
 * Public and unauthenticated on purpose: it is marketing copy already visible on
 * every card. The *write* is a separate route under `/admin`, where the middleware
 * gate already is.
 */

export const runtime = "nodejs";
/* Never cached, at any layer. A cached toggle is a toggle that does not work, and
 * the whole point of this endpoint is that the shop can turn the tape off and see it
 * gone on the next page load. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const promoTape = await settingsStore.getPromoTape();
    return NextResponse.json(promoTape, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    /* Decoration must not be able to log an error on a storefront page. The client
     * treats any non-ok response as "no tape", so failing quietly here means a
     * settings problem costs a strip of copy and nothing else. */
    console.warn("[promo-tape] could not read settings", error);
    return NextResponse.json(
      { enabled: false, messages: [], intervalMs: 2600 },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
