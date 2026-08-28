"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { diagnosisHotspots, repairCapabilities } from "@/data/bat-doctor";
import { cn } from "@/lib/utils";

/* ── §10 · Bat diagnosis ──────────────────────────────────────────────────────────
 *
 * The bat, with six tappable regions. The important design decision here is that this
 * is *not* a decorative diagram beside the form — tapping "TOE" selects the toe repair
 * category in exactly the same state the §7 cards write to. One selection, two ways in:
 * a customer who knows the word picks the card, a customer who does not points at the
 * bat.
 *
 * Layout: hotspots are positioned with percentages over the image box, so one set of
 * coordinates holds at every width with no breakpoint-specific values. Below `lg` the
 * labels would collide with each other and with the bat, so they collapse to numbered
 * pins and a list underneath — which is also the better touch target.
 *
 * The pulse animates a pseudo-element ring, never the button itself (`.bd-pulse` in
 * globals.css). Animating the button would move a 44px tap target under someone's
 * finger. `prefers-reduced-motion` stops it entirely. */

interface BatDiagnosisProps {
  /** Damage ids currently selected — a region reads as active when any of the ids it
   *  maps to is selected, which is what keeps it in sync with the cards above. */
  selected: string[];
  onSelectRegion: (damageIds: string[]) => void;
}

export function BatDiagnosis({ selected, onSelectRegion }: BatDiagnosisProps) {
  const isActive = (selects: string[]) => selects.some((id) => selected.includes(id));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
      {/* ── The bat ── */}
      <div className="min-w-0">
        <div className="relative mx-auto w-full max-w-[22rem] lg:max-w-[26rem]">
          {/* Warm floor glow, so the bat is lit rather than pasted onto the panel. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_50%,rgba(154,123,79,0.13),transparent_70%)]"
          />

          <div className="relative aspect-[431/1526]">
            <Image
              src="/hero/bat.png"
              alt="A cricket bat, with six inspectable areas marked: handle, grains, edge, split, structure and toe"
              fill
              sizes="(min-width: 1024px) 26rem, (min-width: 640px) 22rem, 80vw"
              className="object-contain"
            />

            {/* ── Region highlight ──────────────────────────────────────────────
                Lights up the actual part of the bat a selected region refers to, so
                "TOE" is not a word the customer has to map onto the picture themselves
                — the toe glows. That is the whole value: someone describing damage to a
                shop is usually unsure of the vocabulary, and pointing is easier than
                naming.

                Rendered under the pins and over the photograph, and always
                `pointer-events-none`: the glow must never intercept a tap meant for a
                hotspot or the image beneath it.

                The coordinates are the `area` measured off the bat asset’s alpha
                channel (see data/bat-doctor.ts), not hand-placed boxes, so the glow sits
                on the wood at every width. Shown at all breakpoints — on a phone the
                list below drives it, which is where it helps most. */}
            {diagnosisHotspots.map((spot) => {
              const active = isActive(spot.selects);

              return (
                <span
                  key={`glow-${spot.region}`}
                  aria-hidden="true"
                  style={{
                    left: `${spot.area.left}%`,
                    top: `${spot.area.top}%`,
                    width: `${spot.area.width}%`,
                    height: `${spot.area.height}%`,
                  }}
                  className={cn(
                    "bd-region pointer-events-none absolute rounded-[50%]",
                    active ? "bd-region-on" : "bd-region-off",
                  )}
                />
              );
            })}

            {/* Hotspots. `lg` and up only — below that the pins are in the list. */}
            {diagnosisHotspots.map((spot) => {
              const active = isActive(spot.selects);

              return (
                <button
                  key={spot.region}
                  type="button"
                  onClick={() => onSelectRegion(spot.selects)}
                  aria-pressed={active}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className={cn(
                    "absolute hidden -translate-x-1/2 -translate-y-1/2 lg:block",
                    "focus-visible:outline-none",
                  )}
                >
                  {/* 44px hit area around a 14px dot: the target is generous, the mark
                      is small. */}
                  <span className="flex size-11 items-center justify-center">
                    <span
                      className={cn(
                        "bd-pulse relative flex size-3.5 items-center justify-center rounded-full border transition-all duration-300",
                        active
                          ? "border-expert bg-expert"
                          : "border-white/45 bg-black/60 group-hover:border-expert",
                      )}
                    >
                      {active && (
                        <Check
                          className="size-2.5 text-[#171410]"
                          strokeWidth={3.5}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </span>

                  {/* The label, offset to whichever side the data says. */}
                  <span
                    className={cn(
                      "absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap",
                      spot.side === "left"
                        ? "right-full mr-1 flex-row-reverse"
                        : "left-full ml-1",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-px w-6 transition-colors duration-300",
                        active ? "bg-expert/70" : "bg-white/25",
                      )}
                    />
                    <span
                      className={cn(
                        "rounded-sm border px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300",
                        active
                          ? "border-expert/50 bg-accent-muted text-expert"
                          : "border-white/12 bg-black/55 text-white/65",
                      )}
                    >
                      {spot.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Below lg: the same six regions as a real list. Not a fallback — a better
            control on a phone, where a 14px pin over a 320px-wide image is a coin
            toss. */}
        <ul className="mt-8 grid grid-cols-2 gap-2.5 lg:hidden">
          {diagnosisHotspots.map((spot) => {
            const active = isActive(spot.selects);

            return (
              <li key={spot.region}>
                <button
                  type="button"
                  onClick={() => onSelectRegion(spot.selects)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert",
                    active
                      ? "border-expert/55 bg-accent-muted"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "border-expert bg-expert text-[#171410]"
                        : "border-white/25",
                    )}
                  >
                    {active && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-[13px] font-semibold uppercase tracking-[0.08em]",
                        active ? "text-white" : "text-white/80",
                      )}
                    >
                      {spot.label}
                    </span>
                    <span className="block text-[11.5px] leading-snug text-white/40">
                      {spot.caption}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── What we can and can't do ──
             The last line is the point of the panel: saying that not every bat comes
             back is what makes the six lines above it believable, and it is the same
             honesty §22 asks for about diagnosis. */}
      <aside className="bd-panel min-w-0 self-start rounded-xl p-6">
        <h3 className="text-[17px] font-semibold uppercase leading-tight tracking-[0.04em] text-white">
          Not every crack
          <br />
          means retirement
        </h3>

        <p className="mt-3 text-[13.5px] leading-relaxed text-white/55">
          Most bats that get replaced could have been repaired. What we do:
        </p>

        <ul className="mt-4 space-y-2.5">
          {repairCapabilities.map((capability) => (
            <li key={capability} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-expert"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="text-[13.5px] leading-snug text-white/75">{capability}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t border-white/8 pt-4 text-[12.5px] leading-relaxed text-white/40">
          And when a bat genuinely cannot be saved, we tell you that instead of taking
          the work.
        </p>
      </aside>
    </div>
  );
}
