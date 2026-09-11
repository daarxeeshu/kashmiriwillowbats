import "server-only";
import type { PromoTapeSettings } from "@/data/promo-tape";
import { isSupabaseConfigured } from "@/lib/db/supabase";
import { fileSettingsStore } from "./store-file";
import { supabaseSettingsStore } from "./store-supabase";

/* ── Editable site settings ──────────────────────────────────────────────────────
 *
 * The same seam as `lib/orders/store.ts`, for the same reason: four call sites
 * import `settingsStore` from here and none of them know which implementation
 * answers.
 *
 *   Supabase   when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
 *   JSON file  otherwise — `.data/settings.json`.
 *
 * ── Why this is not the orders table ──
 * Orders are customer data: names, phone numbers, addresses. These are three lines
 * of marketing copy with nothing private in them. Keeping them in separate tables
 * means the settings can be inspected, copied between environments, or exported one
 * day without dragging personal data along.
 *
 * Unlike orders, there is no durability assertion here. A lost setting falls back to
 * the built-in copy, which is a visibly wrong strapline — annoying, self-evident,
 * and costs nobody an order. A lost order is invisible and costs a sale, which is
 * why only that one fails loudly.
 */

export interface SettingsStore {
  getPromoTape(): Promise<PromoTapeSettings>;
  /** Returns what was actually stored, which is the sanitised value rather than the
   *  one supplied — so the caller can render the truth instead of what it asked for. */
  savePromoTape(settings: unknown): Promise<PromoTapeSettings>;
}

/** Which implementation is answering. Surfaced on the admin page, so whoever is
 *  editing the copy can see whether their change will outlive a restart. */
export function settingsStoreKind(): "supabase" | "file" {
  return isSupabaseConfigured() ? "supabase" : "file";
}

export const settingsStore: SettingsStore = {
  getPromoTape: () =>
    isSupabaseConfigured()
      ? supabaseSettingsStore.getPromoTape()
      : fileSettingsStore.getPromoTape(),
  savePromoTape: (settings) =>
    isSupabaseConfigured()
      ? supabaseSettingsStore.savePromoTape(settings)
      : fileSettingsStore.savePromoTape(settings),
};
