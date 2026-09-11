import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ── Guarding /admin ─────────────────────────────────────────────────────────────
 *
 * The dashboard lists every customer's name, phone number and home address. That is
 * the entire reason this file exists, and why the gate is here in middleware rather
 * than inside the page: middleware runs before the route does, so there is no render
 * path, no data fetch and no cached page that can be reached without passing it.
 *
 * ── Why HTTP Basic and not a login form ──
 * A form means a session, and a session means signing cookies, comparing them safely
 * and setting the right flags — hand-rolled crypto on the one surface in this project
 * that leaks personal data if it is subtly wrong. Basic auth hands all of that to the
 * browser. It is unglamorous and it is correct, and it is replaced wholesale by
 * Supabase Auth when that arrives.
 *
 * Basic sends the password on every request, so it is only as safe as the transport:
 * fine over localhost and over HTTPS, which is what Vercel serves. It must not be
 * used over plain HTTP on a public host.
 *
 * ── Closed by default ──
 * With no credentials configured the dashboard returns 503 and serves nothing. The
 * tempting alternative — open when unconfigured, so it "just works" in development —
 * is how an unprotected customer database ends up deployed.
 */

function unauthorised() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Kashmiri Willow Bats admin", charset="UTF-8"',
    },
  });
}

/** Length-independent, value-independent comparison. `a === b` on a secret returns as
 *  soon as two bytes differ, and the time that takes is a measurement of how much of
 *  the prefix was right. Web Crypto's timingSafeEqual is not available in the edge
 *  runtime, so this is the equivalent constant-time fold. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const left = enc.encode(a);
  const right = enc.encode(b);
  // Compare a fixed number of bytes regardless of input length, then require the
  // lengths to have matched too.
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    return new NextResponse(
      "The admin dashboard is not configured. Set ADMIN_USER and ADMIN_PASSWORD in .env.local.",
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorised();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorised();
  }

  // Split once: a password may legitimately contain a colon.
  const separator = decoded.indexOf(":");
  if (separator === -1) return unauthorised();

  /* Both halves are always compared, with no early return between them, so the
   * response time does not reveal whether the username alone was right. */
  const userOk = safeEqual(decoded.slice(0, separator), user);
  const passwordOk = safeEqual(decoded.slice(separator + 1), password);
  if (!userOk || !passwordOk) return unauthorised();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
