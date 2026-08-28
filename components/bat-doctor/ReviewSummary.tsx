"use client";

import { Pencil } from "lucide-react";
import { OTHER_DAMAGE_ID, damageCategories, getDamageCategory } from "@/data/bat-doctor";
import { buildSummary } from "@/lib/bat-doctor/summary";
import type { BatDoctorFormState, MediaItem } from "@/types/bat-doctor";
import { cn } from "@/lib/utils";

/* ── §22 / §23 · Preliminary assessment, then review ──────────────────────────────
 *
 * §22 has a hard constraint attached to it: "Do NOT claim that the website can
 * definitively diagnose a bat from a form." So this panel does two things and refuses a
 * third. It repeats back what the customer selected, it says what that kind of damage
 * usually involves — from `DamageCategory.detail`, which is written as process rather
 * than as a verdict — and it never states a cause, a cost or a prognosis. The label the
 * brief asks for is rendered as the panel's own subheading, not as small print at the
 * bottom where it would read as a disclaimer bolted on.
 *
 * §23's per-section EDIT jumps to the step from `buildSummary`, which carries the step
 * index in the data. That is deliberate: an EDIT button whose target is hard-coded in
 * JSX drifts the moment a step is inserted. */

interface ReviewSummaryProps {
  state: BatDoctorFormState;
  images: MediaItem[];
  video: MediaItem | null;
  onEdit: (step: number) => void;
}

/** The honest half of an assessment: what the selected damage typically involves, and
 *  how much of it is structural. No verdict — that needs a technician holding the bat. */
function assessment(state: BatDoctorFormState) {
  const chosen = state.damageIds
    .map(getDamageCategory)
    .filter((d): d is (typeof damageCategories)[number] => d !== undefined);

  const structural = chosen.filter((d) => d.severity === "structural");
  const unsure = state.damageIds.includes(OTHER_DAMAGE_ID) || state.otherDamageSelected;

  let outlook: string;
  if (chosen.length === 0 && unsure) {
    outlook =
      "You've told us something isn't right without naming it, which is fine — that's what the photographs and the inspection are for.";
  } else if (structural.length === 0) {
    outlook =
      "Everything you've selected is surface damage. That is usually the most straightforward kind to put right, and the kind that gets worse fastest if it's left.";
  } else if (structural.length === chosen.length) {
    outlook =
      "What you've selected is structural. Bats like this are often repairable, but the assessment matters more than usual — a technician needs to see how far the damage runs before committing to a method.";
  } else {
    outlook =
      "You've selected a mix of surface and structural damage. Those get repaired in order — structure first, finish last — so the bat comes back sound rather than just tidy.";
  }

  return { chosen, structural, unsure, outlook };
}

export function ReviewSummary({ state, images, video, onEdit }: ReviewSummaryProps) {
  const sections = buildSummary(
    state,
    images.map((i) => ({ name: i.name, size: i.size, mime: i.mime, kind: i.kind })),
    video ? { name: video.name, size: video.size, mime: video.mime, kind: video.kind } : null,
  );

  const { chosen, outlook } = assessment(state);

  return (
    <div className="min-w-0 space-y-6">
      {/* ── §22 ── */}
      <section
        aria-labelledby="bd-assessment"
        className="rounded-xl border border-expert/25 bg-[linear-gradient(152deg,rgba(216,180,106,0.09),rgba(255,255,255,0.02)_55%,rgba(216,180,106,0.06))] p-5 sm:p-6"
      >
        <h3
          id="bd-assessment"
          className="text-[15px] font-semibold uppercase tracking-[0.1em] text-expert"
        >
          Initial assessment
        </h3>
        {/* The required wording, in the position where it is actually read. */}
        <p className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">
          Preliminary assessment — final diagnosis requires technician inspection
        </p>

        <p className="mt-4 text-[14px] leading-relaxed text-white/75">{outlook}</p>

        {chosen.length > 0 && (
          <dl className="mt-5 space-y-4 border-t border-expert/20 pt-4">
            {chosen.map((damage) => (
              <div key={damage.id}>
                <dt className="flex items-baseline gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-white/90">
                  <span aria-hidden="true" className="font-mono text-[11px] text-expert/70">
                    {damage.number}
                  </span>
                  {damage.title}
                  <span
                    className={cn(
                      "ml-auto shrink-0 text-[10px] font-semibold tracking-[0.12em]",
                      damage.severity === "structural" ? "text-danger/85" : "text-white/35",
                    )}
                  >
                    {damage.severity === "structural" ? "STRUCTURAL" : "SURFACE"}
                  </span>
                </dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-white/55">
                  {damage.detail}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* ── §23 ── */}
      {sections.map((section) => (
        <section
          key={section.title}
          aria-label={section.title}
          className="bd-panel rounded-xl p-5 sm:p-6"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/85">
              {section.title}
            </h3>

            <button
              type="button"
              onClick={() => onEdit(section.step)}
              className="-mr-2 -mt-2 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-expert transition-colors hover:bg-expert/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              <Pencil className="size-3" aria-hidden="true" />
              Edit
              {/* Which section, for anyone hearing the button rather than seeing it
                  beside a heading. */}
              <span className="sr-only"> {section.title}</span>
            </button>
          </div>

          <dl className="mt-4 space-y-2.5">
            {section.rows.map((row) => (
              <div
                key={row.label}
                className="grid gap-0.5 border-t border-white/6 pt-2.5 first:border-0 first:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-4"
              >
                <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "min-w-0 break-words text-[14px] leading-snug",
                    row.empty ? "italic text-white/30" : "text-white/85",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
