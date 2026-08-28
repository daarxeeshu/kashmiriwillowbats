import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BatDoctorExperience } from "@/components/bat-doctor/BatDoctorExperience";
import { BatDoctorHero } from "@/components/bat-doctor/BatDoctorHero";
import { RepairProcess } from "@/components/bat-doctor/RepairProcess";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/* ── /bat-doctor ───────────────────────────────────────────────────────────────────
 *
 * A real page, not an anchor into an existing section (§4). Composed of server components
 * throughout except `BatDoctorExperience`, which owns the shared selection state — so the
 * hero, the process band and the closing band cost no JavaScript.
 *
 * Heading order is h1 (hero) → h2 (each band) → h3 (cards, steps, panels), with no level
 * skipped, which is what §34's "proper heading hierarchy" comes down to in practice. */

export const metadata: Metadata = {
  title: "Bat Doctor | Cricket Bat Repair & Restoration",
  description:
    "Professional cricket bat repair, restoration and structural recovery. Toe repair, handle replacement, edge and grain restoration — diagnosed by technicians in Kashmir, booked from your phone.",
  alternates: { canonical: "/bat-doctor" },
  openGraph: {
    title: "Bat Doctor | Cricket Bat Repair & Restoration",
    description:
      "Your bat is injured. We know how to fix it. Professional repair, restoration and structural recovery for cricket bats.",
    url: "/bat-doctor",
    type: "website",
  },
};

export default function BatDoctorPage() {
  return (
    <>
      <BatDoctorHero />

      {/* The interactive core: damage selection, the diagnosis bat, and the six-step
          request. One client component so all three write to one selection. */}
      <BatDoctorExperience />

      <RepairProcess />

      {/* ── Closing band ──
             The line the whole page is arguing for. Placed last because by this point the
             reader has seen what can be repaired and what the process is, which is what
             turns "don't retire your bat" from a slogan into a claim. */}
      <section
        aria-labelledby="bd-closing-heading"
        className="bd-stage relative overflow-hidden border-t border-border"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_100%,rgba(154,123,79,0.15),transparent_60%)]"
        />

        <div className="container-main relative py-20 text-center sm:py-24">
          <h2
            id="bd-closing-heading"
            className="mx-auto max-w-2xl font-serif text-[clamp(1.875rem,7vw,3rem)] font-semibold leading-tight text-white"
          >
            Don&apos;t retire your bat yet.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/55">
            Most bats that get replaced could have been repaired. Send us photographs and
            find out which one yours is — the diagnosis costs you nothing.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#book-a-repair"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-expert px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              Book a repair
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <a
              href={buildWhatsAppUrl(
                "Hi, I'd like to ask about repairing my cricket bat.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-white/18 px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/85 transition-colors hover:border-expert/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              Ask a technician
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
