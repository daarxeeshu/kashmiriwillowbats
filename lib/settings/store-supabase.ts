import "server-only";
import {
  PROMO_TAPE_DEFAULTS,
  sanitisePromoTape,
  type PromoTapeSettings,
} from "@/data/promo-tape";
import { TABLES, requireSupabase } from "@/lib/db/supabase";
import type { SettingsStore } from "./store";

/* ── Editable settings, in Postgres ─────────────────────────────────────────────
 *
 * A key/value table. `promo_tape` is the only key today; see
 * `supabase/migrations/0001_init.sql`.
 */

const PROMO_TAPE_KEY = "promo_tape";

export const supabaseSettingsStore: SettingsStore = {
  async getPromoTape() {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from(TABLES.settings)
      .select("value")
      .eq("key", PROMO_TAPE_KEY)
      .maybeSingle();

    /* Swallowed, unlike an order read. This value decides whether a decorative strip
       appears on some cards; a database hiccup must not take the homepage down with
       it. Logged loudly enough to find, and the built-in copy stands in. */
    if (error) {
      console.warn("[settings] promo tape read failed, using defaults", error);
      return PROMO_TAPE_DEFAULTS;
    }
    // Sanitised on read as well as on write: a row edited by hand in the Supabase
    // dashboard, or written by an earlier version of this shape, resolves to
    // something renderable rather than reaching a component as `undefined.map`.
    return data ? sanitisePromoTape(data.value) : PROMO_TAPE_DEFAULTS;
  },

  async savePromoTape(settings) {
    const supabase = requireSupabase();
    const clean = sanitisePromoTape(settings);

    /* `upsert` on the primary key, so the first save creates the row and every later
       one replaces it. This also removes the read-modify-write the file store needed
       — two admins saving at the same moment can no longer have one overwrite the
       other's whole file, because each write touches one key. */
    const { error } = await supabase.from(TABLES.settings).upsert(
      {
        key: PROMO_TAPE_KEY,
        value: clean,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    /* Thrown, unlike the read. A save that silently did nothing would have the admin
       change the copy, watch the form confirm it, and find the storefront unchanged
       with nothing anywhere saying why. */
    if (error) {
      throw new Error(`[settings] promo tape save failed: ${error.message}`);
    }
    return clean;
  },
};

export type { PromoTapeSettings };
