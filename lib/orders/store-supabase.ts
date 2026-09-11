import "server-only";
import type { Order, OrderStatus } from "@/types/cart";
import { TABLES, requireSupabase } from "@/lib/db/supabase";
import type { OrderStore } from "./store";

/* ── Orders, in Postgres ─────────────────────────────────────────────────────────
 *
 * The same four methods the file-backed store implements, against Supabase. See
 * `supabase/migrations/0001_init.sql` for the table and why RLS denies everything
 * except the service role.
 *
 * ── Why `payload` is the source of truth ──
 * The full order goes in a JSONB column and the promoted columns exist only so the
 * dashboard can sort and filter with an index. Reads reconstruct from `payload`, not
 * from the columns — an order is a record of what was agreed, and rebuilding it from
 * columns would let a later schema change quietly reinterpret history. The columns
 * are a derived index, so if the two ever disagree, `payload` is right.
 */

interface OrderRow {
  order_id: string;
  created_at: string;
  status: string;
  whatsapp_opened_at: string | null;
  confirmed_at: string | null;
  item_count: number;
  subtotal: number;
  discount: number;
  total: number;
  payload: Order;
}

function toRow(order: Order) {
  return {
    order_id: order.orderId,
    created_at: order.createdAt,
    status: order.status,
    whatsapp_opened_at: order.whatsappOpenedAt,
    confirmed_at: order.confirmedAt,
    item_count: order.itemCount,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    payload: order,
  };
}

/**
 * Rebuild the order from the stored document, with the status columns layered on
 * top.
 *
 * Those three are the only fields that change after an order is created, and
 * `setStatus` updates the columns. Preferring the column for exactly those and the
 * payload for everything else means a status transition cannot be lost by a
 * concurrent write to the document — which is the one race this table can actually
 * have, since `save` and `setStatus` are the only writers.
 */
function fromRow(row: OrderRow): Order {
  return {
    ...row.payload,
    status: row.status as OrderStatus,
    whatsappOpenedAt: row.whatsapp_opened_at,
    confirmedAt: row.confirmed_at,
  };
}

export const supabaseOrderStore: OrderStore = {
  async save(order) {
    const supabase = requireSupabase();
    const { error } = await supabase.from(TABLES.orders).insert(toRow(order));
    /* Thrown, not swallowed. `persistOrder` is awaited before the route reports
       success, and the route turns a throw into a failure the customer sees — which
       is correct: an order that was not stored has not been placed, and telling
       someone otherwise is what this whole feature exists to stop. */
    if (error) {
      throw new Error(`[orders] insert failed: ${error.message}`);
    }
  },

  async get(orderId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from(TABLES.orders)
      .select("*")
      .eq("order_id", orderId)
      // `maybeSingle` rather than `single`: a missing order is a normal answer here
      // (someone mistyped a reference), and `single` would make it an error.
      .maybeSingle();

    if (error) throw new Error(`[orders] read failed: ${error.message}`);
    return data ? fromRow(data as OrderRow) : null;
  },

  async list(options) {
    const supabase = requireSupabase();
    let query = supabase
      .from(TABLES.orders)
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw new Error(`[orders] list failed: ${error.message}`);
    return (data as OrderRow[]).map(fromRow);
  },

  async setStatus(orderId, status, at) {
    const supabase = requireSupabase();

    /* Read first, because the timestamps are set-once: an order that is already
       `whatsapp_opened` keeps its original timestamp if the customer taps through a
       second time. `??` in the file store did this; here it needs the current row,
       and doing it in one statement would mean a `coalesce` expression per column
       for no gain at this volume. */
    const existing = await this.get(orderId);
    if (!existing) return null;

    const patch = {
      status,
      whatsapp_opened_at:
        status === "whatsapp_opened"
          ? (existing.whatsappOpenedAt ?? at)
          : existing.whatsappOpenedAt,
      confirmed_at:
        status === "confirmed" ? (existing.confirmedAt ?? at) : existing.confirmedAt,
    };

    const { data, error } = await supabase
      .from(TABLES.orders)
      .update(patch)
      .eq("order_id", orderId)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`[orders] status update failed: ${error.message}`);
    return data ? fromRow(data as OrderRow) : null;
  },
};
