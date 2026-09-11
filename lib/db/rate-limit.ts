import "server-only";
import { createHmac } from "node:crypto";
import { TABLES, getSupabase } from "@/lib/db/supabase";

/* ── Rate limiting ───────────────────────────────────────────────────────────────
 *
 * Replaces a module-level `Map` in `app/api/orders/route.ts`. On a serverless host
 * each instance holds its own copy of that map, so "12 orders per 10 minutes" was
 * enforced per instance — which, with any concurrency at all, is not a limit.
 *
 * ── The caller is stored as an HMAC, never as an address ──
 * The table only needs to answer "have I seen this caller in the last ten minutes",
 * and a keyed hash answers that. A plain SHA-256 would not have been enough: the
 * whole IPv4 space is 4.3 billion values, so an unkeyed digest of an IP is
 * recoverable by brute force in minutes and would not be anonymous in any
 * meaningful sense. HMAC with a secret key is, because an attacker holding the table
 * cannot enumerate without the key.
 *
 * ── Fail open, deliberately ──
 * If the database is unreachable the limiter allows the request. The alternative is
 * that a Supabase blip stops the shop taking orders — trading a real, immediate loss
 * of business against a hypothetical flood. Abuse is the lesser problem, and it is
 * visible in the orders table afterwards; a checkout that refuses everyone is not.
 */

/** Prefer a dedicated secret. Falling back to the service-role key keeps the digest
 *  keyed and stable across instances without demanding another variable be set — the
 *  cost is that rotating that key re-buckets every in-flight window, which for a
 *  ten-minute limiter is not a cost worth another env var to avoid. */
function hmacKey(): string | null {
  return (
    process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? null
  );
}

function hashCaller(caller: string): string {
  const key = hmacKey();
  // No key means no Supabase either, so this value is only ever a `Map` key in the
  // in-memory fallback and never leaves the process.
  if (!key) return caller;
  return createHmac("sha256", key).update(caller).digest("hex");
}

/** The caller's identity, from whichever header the host puts in front. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitOptions {
  /** Which limiter. One table serves all of them. */
  bucket: string;
  /** How many hits are allowed inside the window. */
  max: number;
  windowMs: number;
}

/* ── In-memory fallback ────────────────────────────────────────────────────────
 * Correct on a single long-lived process, which is what `next dev` and a
 * self-hosted Node server are. Wrong on serverless, which is exactly why the
 * Supabase path exists. */
const memory = new Map<string, number[]>();

function limitedInMemory(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const mapKey = `${options.bucket}:${key}`;
  const recent = (memory.get(mapKey) ?? []).filter(
    (t) => now - t < options.windowMs,
  );

  if (recent.length >= options.max) {
    memory.set(mapKey, recent);
    return true;
  }
  recent.push(now);
  memory.set(mapKey, recent);

  // Opportunistic sweep, so a long-running process does not accumulate a key per
  // visitor for the life of the server.
  if (memory.size > 5000) {
    for (const [k, v] of memory) {
      if (v.every((t) => now - t >= options.windowMs)) memory.delete(k);
    }
  }
  // The hit was recorded above and the window was not full: not limited.
  return false;
}

/**
 * Has this caller used up the window?
 *
 * Records the hit as a side effect when the answer is no, so one call per request is
 * both the check and the increment.
 */
export async function isRateLimited(
  caller: string,
  options: RateLimitOptions,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return limitedInMemory(caller, options);

  const keyHash = hashCaller(caller);
  const since = new Date(Date.now() - options.windowMs).toISOString();

  try {
    const { count, error } = await supabase
      .from(TABLES.rateLimits)
      .select("id", { count: "exact", head: true })
      .eq("bucket", options.bucket)
      .eq("key_hash", keyHash)
      .gte("hit_at", since);

    if (error) throw new Error(error.message);
    if ((count ?? 0) >= options.max) return true;

    const { error: insertError } = await supabase
      .from(TABLES.rateLimits)
      .insert({ bucket: options.bucket, key_hash: keyHash });
    if (insertError) throw new Error(insertError.message);

    /* Prune rarely rather than every request: this is a write on the checkout path,
       and at 2% it still runs often enough to keep the table small while costing
       almost nothing per order. `pg_cron` is the better answer at volume — see the
       note at the foot of the migration. */
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase.from(TABLES.rateLimits).delete().lt("hit_at", cutoff);
    }

    return false;
  } catch (error) {
    /* Fail open. See the note at the top: a database blip must not become a shop
       that cannot take orders. */
    console.warn("[rate-limit] check failed, allowing request", error);
    return false;
  }
}
