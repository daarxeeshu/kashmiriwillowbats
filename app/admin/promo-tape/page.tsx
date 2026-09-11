import { PromoTapeEditor } from "@/components/admin/PromoTapeEditor";
import { settingsStore, settingsStoreKind } from "@/lib/settings/store";

/* Read on the server and handed to the form as its starting values, so the page
 * arrives already showing what is live rather than flashing empty fields and then
 * filling them in. Dynamic because it reads a file that an admin is about to change —
 * a cached settings page would show yesterday's copy. */
export const dynamic = "force-dynamic";

export default async function PromoTapePage() {
  const promoTape = await settingsStore.getPromoTape();
  const kind = settingsStoreKind();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-lg font-semibold text-white">Promo tape</h1>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/55">
        The angled strip on the brand cards. Changes take effect on the next page load
        — there is nothing to rebuild or redeploy.
      </p>

      <div className="mt-8">
        <PromoTapeEditor initial={promoTape} />
      </div>

      {/* Where the save is going, said plainly on the screen that does the saving.
          Someone editing copy needs to know whether their change will outlive a
          restart, and the honest answer depends on the environment. */}
      {kind === "supabase" ? (
        <p className="mt-10 border-t border-border pt-5 text-[11px] leading-relaxed text-white/40">
          Saved to Supabase. Changes are live for every visitor on their next page
          load and survive restarts and deploys.
        </p>
      ) : (
        <p className="mt-10 border-t border-border pt-5 text-[11px] leading-relaxed text-expert">
          <strong className="font-semibold">Saving to a local file.</strong>{" "}
          <code className="text-white/55">SUPABASE_URL</code> and{" "}
          <code className="text-white/55">SUPABASE_SERVICE_ROLE_KEY</code> are not
          set, so settings go to{" "}
          <code className="text-white/55">.data/settings.json</code> on this machine.
          That is fine for local work. On a serverless host the file is discarded
          between requests and the tape silently reverts to its built-in copy — set
          both variables before relying on this screen in production.
        </p>
      )}
    </main>
  );
}
