import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

/* ── Bat Doctor, on the home page ──────────────────────────────────────────────────
 *
 * §33's first of exactly two entry points elsewhere on the site. One band, one call to
 * action, no repeat lower down the page — the brief's words are "do not spam the user
 * with CTAs", and a service the customer only needs when something has gone wrong earns
 * one honest mention, not three.
 *
 * Placed after `EngravingSection` so the three service bands sit together and read in
 * the order a bat is actually lived with: choose it (Bat Expert), personalise it
 * (Engraving), repair it (Bat Doctor).
 *
 * `.bd-stage` is the same surface the /bat-doctor page uses, which is deliberate — the
 * band should feel like a door into somewhere, not another product shelf. It is the only
 * thing borrowed; type, spacing and the accent are the site's own. */

export function BatDoctorBand() {
  return (
    <section
      aria-labelledby="home-bat-doctor-heading"
      className="bd-stage relative overflow-hidden border-b border-border"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_82%_50%,rgba(154,123,79,0.14),transparent_65%)]"
      />

      <div className="container-main relative grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:py-16">
        <FadeIn>
          <p className="eyebrow text-accent">Bat Doctor</p>

          {/* Sized here rather than via `heading-lg`, matching the /bat-doctor page so a
              visitor arriving from this band lands on the same typography. */}
          <h2
            id="home-bat-doctor-heading"
            className="mt-4 max-w-xl font-serif text-[clamp(1.75rem,6vw,2.5rem)] font-semibold leading-tight text-white"
          >
            Don&apos;t retire your bat yet.
          </h2>

          <p className="mt-4 text-[15px] font-medium uppercase tracking-[0.14em] text-expert/85">
            Repair. Restore. Return to the game.
          </p>

          <p className="mt-5 max-w-prose text-[14.5px] leading-relaxed text-white/55 sm:text-[15px]">
            A cracked toe, a loose handle, a split edge — most of it is repairable.
            Send our technicians photographs and get a preliminary assessment before
            you spend anything on a replacement.
          </p>

          <div className="mt-8">
            <Link
              href="/bat-doctor"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-expert px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors duration-200 hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              Book a repair
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </FadeIn>

        {/* The same damaged/restored pair as the page hero, at band scale. Two treatments
            of one cutout — see the `.bd-bat-*` rules in globals.css for why there is no
            second photograph. Decorative: the copy beside it already says all of this,
            so both images carry empty alt text and the labels are the caption. */}
        <FadeIn delay={0.1} className="hidden lg:block">
          <div className="relative mx-auto flex max-w-sm items-end justify-center gap-10">
            {(
              [
                { key: "damaged", label: "Damaged", filter: "bd-bat-damaged", dot: "bg-danger" },
                { key: "restored", label: "Restored", filter: "bd-bat-restored", dot: "bg-success" },
              ] as const
            ).map((state) => (
              <figure key={state.key} className="flex flex-col items-center gap-4">
                <div className="relative h-52 w-[3.7rem]">
                  <Image
                    src="/hero/bat.png"
                    alt=""
                    fill
                    sizes="60px"
                    className={`object-contain ${state.filter}`}
                  />
                </div>
                <figcaption className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${state.dot}`}
                  />
                  {state.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
