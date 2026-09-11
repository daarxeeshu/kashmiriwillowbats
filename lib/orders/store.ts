import "server-only";
import type { Order, OrderStatus } from "@/types/cart";
import { isSupabaseConfigured } from "@/lib/db/supabase";
import { fileOrderStore } from "./store-file";
import { supabaseOrderStore } from "./store-supabase";

/* ── Where orders live ───────────────────────────────────────────────────────────
 *
 * This file is the seam. Nine call sites across the app import `orderStore` from
 * here and none of them know or care which implementation answers — which is what
 * made swapping a JSON file for Postgres a change to this directory and nothing
 * else.
 *
 * ── Two implementations, chosen by the environment ──
 *
 *   Supabase   when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. This is
 *              the one that must be configured in production.
 *
 *   JSON file  otherwise. `.data/orders.json`, gitignored.
 *
 * The fallback is not a hedge, it is what makes the repo runnable: a fresh clone has
 * no Supabase project, and nobody should have to provision one to see the homepage
 * or to work on the studio. It is also why `isSupabaseConfigured` is a question
 * rather than an assertion.
 *
 * ── The failure this arrangement is designed to make loud ──
 * A serverless filesystem is per-request and discarded, so the JSON store on a
 * deployed host silently writes every order and loses it — the dashboard stays
 * permanently empty and nothing anywhere reports a fault. That is the worst kind of
 * bug: invisible, and it costs real orders. So `assertOrderStoreIsDurable` exists
 * below and the order route calls it, turning a misconfigured deployment into an
 * error at the moment an order is placed instead of a mystery three weeks later.
 */

export interface OrderStore {
  save(order: Order): Promise<void>;
  get(orderId: string): Promise<Order | null>;
  /** Newest first. `limit` caps the page; the dashboard asks for a page at a time
   *  rather than the table. */
  list(options?: { limit?: number }): Promise<Order[]>;
  /** Returns the updated order, or null when there is no such order. The caller
   *  decides which transitions are legal — this only writes. */
  setStatus(
    orderId: string,
    status: OrderStatus,
    at: string,
  ): Promise<Order | null>;
}

/** Which implementation is answering. Read at call time, not at import time, so a
 *  route is not bound to whatever the environment looked like during the build. */
export function orderStoreKind(): "supabase" | "file" {
  return isSupabaseConfigured() ? "supabase" : "file";
}

export const orderStore: OrderStore = {
  save: (order) =>
    isSupabaseConfigured()
      ? supabaseOrderStore.save(order)
      : fileOrderStore.save(order),
  get: (orderId) =>
    isSupabaseConfigured()
      ? supabaseOrderStore.get(orderId)
      : fileOrderStore.get(orderId),
  list: (options) =>
    isSupabaseConfigured()
      ? supabaseOrderStore.list(options)
      : fileOrderStore.list(options),
  setStatus: (orderId, status, at) =>
    isSupabaseConfigured()
      ? supabaseOrderStore.setStatus(orderId, status, at)
      : fileOrderStore.setStatus(orderId, status, at),
};

/**
 * Throw if orders are about to be written somewhere they will not survive.
 *
 * `VERCEL`, `NETLIFY` and `AWS_LAMBDA_FUNCTION_NAME` are set by those platforms and
 * are the reliable signal that the filesystem is ephemeral. `NODE_ENV=production`
 * alone is not: a self-hosted Node server or a container with a mounted volume is a
 * perfectly good home for the JSON file, and failing there would be wrong.
 *
 * Called by `POST /api/orders`, so the customer gets the route's honest "we couldn't
 * file that order, please send it on WhatsApp" instead of a confirmation for an
 * order that no longer exists.
 */
export function assertOrderStoreIsDurable(): void {
  if (isSupabaseConfigured()) return;

  const ephemeralHost =
    process.env.VERCEL ??
    process.env.NETLIFY ??
    process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (ephemeralHost) {
    throw new Error(
      "Orders would be written to a filesystem that this host discards between " +
        "requests, so they would be lost immediately. Set SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY. See supabase/migrations/0001_init.sql.",
    );
  }
}
