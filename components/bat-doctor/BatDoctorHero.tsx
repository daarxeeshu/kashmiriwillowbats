import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ── §5 / §6 · Hero ───────────────────────────────────────────────────────────────
 *
 * A server component: nothing here is interactive beyond two links, so none of it needs
 * to ship as JavaScript.
 *
 * §6 says to reuse the project's assets and not to invent images. There is no damage
 * photography anywhere in this repository — `public/hero/` holds one real bat cutout
 * (`bat.png`, 431×1526) and three lifestyle JPEGs, and `public/products/` is placeholder
 * SVGs. So the DAMAGED → RESTORED story is told with the asset that exists, shown twice
 * under two CSS filter treatments (`.bd-bat-damaged` / `.bd-bat-restored` in
 * globals.css). That is honest — it is the same bat, and the page never implies these
 * are photographs of a specific repair — it costs no new bytes, and it stays sharp at
 * every width. When real before/after photography exists, the two `<Image>` sources
 * change and nothing else does.
 *
 * The four spec lines on the right are the reference design's glass panel. They are real
 * text at a readable size, not the 10px decorative labels used in the site's product
 * hero. */

const specs = [
  { label: "Expert technicians", detail: "Bats repaired by hand, in Kashmir" },
  { label: "Premium materials", detail: "Cane, willow and bonding agents that hold" },
  { label: "Structural precision", detail: "Repaired to play, not just to look mended" },
  { label: "Performance restored", detail: "Re-pressed so the middle comes back" },
];

export function BatDoctorHero() {
  return (
    <section className="bd-stage relative overflow-hidden">
      {/* Warm gold wash from the top-left, so the bat reads as sitting under a workshop
          lamp rather than in a product studio. Decorative, hidden from the tree. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,rgba(154,123,79,0.16),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"
      />

      <div className="container-main relative py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ── Copy ── */}
          <div className="min-w-0">
            <p className="eyebrow">Repair · Restoration · Structural recovery</p>

            {/* Sized explicitly rather than through `heading-xl`, because this headline
                breaks across two lines by design and needs its own leading. */}
            <h1 className="mt-4 font-serif text-[clamp(2.75rem,11vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.02em] text-white">
              BAT
              <br />
              <span className="text-expert">DOCTOR</span>
            </h1>

            <p className="mt-6 max-w-md text-[clamp(1.0625rem,3.4vw,1.375rem)] font-medium leading-snug text-white/85">
              Your bat is injured.
              <br />
              We know how to fix it.
            </p>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/55">
              Professional cricket bat repair, restoration and structural recovery —
              performed with precision to bring damaged bats back into the game.
            </p>

            {/* Both CTAs are in-page anchors to real sections further down, so the
                primary action works before any JavaScript has loaded. */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#book-a-repair"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-expert px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors duration-200 hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
              >
                Book a repair
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>

              <Link
                href="#check-your-bat"
                className="inline-flex h-12 items-center justify-center rounded-sm border border-white/18 px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/85 transition-colors duration-200 hover:border-expert/50 hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
              >
                Check your bat
              </Link>
            </div>
          </div>

          {/* ── Damaged / restored (§6) ── */}
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {(
                [
                  {
                    state: "Damaged",
                    tone: "danger" as const,
                    filter: "bd-bat-damaged",
                    caption: "Cracked, split, retired early",
                  },
                  {
                    state: "Restored",
                    tone: "gold" as const,
                    filter: "bd-bat-restored",
                    caption: "Bonded, re-pressed, back in the game",
                  },
                ] as const
              ).map((panel) => (
                <figure
                  key={panel.state}
                  className="bd-panel relative overflow-hidden rounded-xl p-3 sm:p-4"
                >
                  <div className="relative mx-auto aspect-[431/1000] w-full max-w-[8.5rem] sm:max-w-[10rem]">
                    <Image
                      src="/hero/bat.png"
                      // The alt text describes what the reader is being shown and why
                      // there are two of them — not "bat.png".
                      alt={
                        panel.state === "Damaged"
                          ? "A cricket bat shown in a dulled, cold treatment to represent a damaged bat"
                          : "The same cricket bat shown warm and clean to represent a restored bat"
                      }
                      fill
                      sizes="(min-width: 640px) 10rem, 8.5rem"
                      className={`object-contain object-bottom ${panel.filter}`}
                      priority={panel.state === "Restored"}
                    />
                  </div>

                  <figcaption className="mt-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                        panel.tone === "danger" ? "text-danger" : "text-expert"
                      }`}
                    >
                      {/* A dot as well as the colour, so the two states differ by more
                          than hue (§35). */}
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${
                          panel.tone === "danger" ? "bg-danger" : "bg-expert"
                        }`}
                      />
                      {panel.state}
                    </span>
                    <span className="mt-1.5 block text-[12px] leading-snug text-white/45">
                      {panel.caption}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* ── Spec panel ── */}
            <dl className="bd-panel mt-3 grid gap-px overflow-hidden rounded-xl sm:mt-4 sm:grid-cols-2">
              {specs.map((spec) => (
                <div key={spec.label} className="px-4 py-3.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-expert/85">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-[12.5px] leading-snug text-white/50">
                    {spec.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
