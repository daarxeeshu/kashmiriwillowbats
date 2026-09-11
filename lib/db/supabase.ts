import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ── The Supabase connection ─────────────────────────────────────────────────────
 *
 * One client, created lazily, server-side only.
 *
 * ── Why the service-role key and not the anon key ──
 * Every read and write in this app goes through a route handler or a server
 * component that has already decided who is allowed to do it: `/api/orders` prices
 * the cart itself, `/admin/*` is behind the middleware's Basic auth. The browser
 * never talks to Supabase directly, so there is no client for row-level security to
 * constrain — using the anon key would mean writing RLS policies to re-authorise
 * requests that were already authorised, and getting them slightly wrong is how an
 * orders table full of names, phone numbers and home addresses ends up readable.
 *
 * So: RLS is enabled on every table with *no* policies, which denies the anon and
 * authenticated roles outright, and the service role (which bypasses RLS) is held
 * only here. See `supabase/migrations/0001_init.sql`.
 *
 * ── Why `server-only` ──
 * That import makes it a build error for any client component to pull this file in,
 * which is the one mistake that would put the service-role key in a browser bundle.
 * A comment asking people not to do it is not the same protection.
 */

/** Deliberately *not* `NEXT_PUBLIC_`. A key with this much authority must never be
 *  inlined into client JavaScript, and the prefix is what would do that. */
const URL_VAR = "SUPABASE_URL";
const KEY_VAR = "SUPABASE_SERVICE_ROLE_KEY";

/**
 * Is there a database to talk to?
 *
 * This is a real question rather than an assertion, because the file-backed stores
 * remain the fallback: the site has to run on a fresh clone with no Supabase project,
 * and a contributor should not have to provision one to see the homepage. Each store
 * asks this and picks its implementation accordingly.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env[URL_VAR] && process.env[KEY_VAR]);
}

let client: SupabaseClient | null = null;

/**
 * The shared client, or null when the project is not configured.
 *
 * Lazy, so importing a store does not require the environment to be complete — the
 * stores decide at call time, and `next build` can prerender pages that never touch
 * the database.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;

  client = createClient(process.env[URL_VAR]!, process.env[KEY_VAR]!, {
    auth: {
      // No user sessions on the server: nothing to persist, nothing to refresh, and
      // no reason to keep a token in whatever storage the SDK would reach for.
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: "public" },
  });
  return client;
}

/** The client, or a thrown error naming what is missing. For call sites that have
 *  already established the database is configured and would otherwise have to
 *  null-check a second time. */
export function requireSupabase(): SupabaseClient {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      `Supabase is not configured. Set ${URL_VAR} and ${KEY_VAR} in the environment.`,
    );
  }
  return supabase;
}

/** Table names in one place, so a rename is one edit rather than a search. */
export const TABLES = {
  orders: "orders",
  settings: "settings",
  rateLimits: "rate_limits",
} as const;
