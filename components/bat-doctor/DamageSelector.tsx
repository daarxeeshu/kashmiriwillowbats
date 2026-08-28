"use client";

import { ArrowRight, Check, HelpCircle } from "lucide-react";
import { OTHER_DAMAGE_ID, damageCategories } from "@/data/bat-doctor";
import { TextArea } from "./fields";
import { cn } from "@/lib/utils";

/* ── §7–§9 · What's wrong with your bat? ───────────────────────────────────────────
 *
 * Six cards, multi-select, plus an escape hatch for the customer who does not have the
 * vocabulary — which §9 is explicit about and which is the common case: someone knows
 * their bat sounds wrong, not that they have layer separation.
 *
 * These are `<button aria-pressed>` rather than checkboxes-styled-as-cards. A toggle
 * button is what this is — pressing it does not submit anything, and `aria-pressed`
 * announces "selected"/"not selected" without needing a visible tick to carry the whole
 * message. The tick is there too, plus a gold border, plus the number turning gold:
 * three signals, so selection never depends on colour alone (§35).
 *
 * `detail` is revealed on selection rather than on hover. Hover does not exist on the
 * device most of these submissions will come from, and the detail is the reassurance
 * that makes someone continue — "the old handle is drawn out of the splice and a new
 * cane handle is fitted" tells them this is a workshop, not a form. */

interface DamageSelectorProps {
  selected: string[];
  otherSelected: boolean;
  otherText: string;
  onToggle: (id: string) => void;
  onToggleOther: () => void;
  onOtherTextChange: (value: string) => void;
  otherError?: string;
  selectionError?: string;
  /** Rendered when the section is used as a standalone band with its own CTA (the page)
   *  and omitted inside the workflow, where the step footer owns the Continue. */
  continueHref?: string;
}

export function DamageSelector({
  selected,
  otherSelected,
  otherText,
  onToggle,
  onToggleOther,
  onOtherTextChange,
  otherError,
  selectionError,
  continueHref,
}: DamageSelectorProps) {
  const count = selected.filter((id) => id !== OTHER_DAMAGE_ID).length + (otherSelected ? 1 : 0);

  return (
    <div className="min-w-0">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {damageCategories.map((damage) => {
          const isSelected = selected.includes(damage.id);

          return (
            <li key={damage.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onToggle(damage.id)}
                aria-pressed={isSelected}
                className={cn(
                  "bd-card group/dmg relative flex h-full w-full flex-col rounded-xl p-5 text-left",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert",
                  isSelected && "bd-card-selected",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "font-mono text-[12px] tracking-[0.1em] transition-colors",
                      isSelected ? "text-expert" : "text-white/30",
                    )}
                  >
                    {damage.number}
                  </span>

                  {/* Selected → a tick. Not selected → the arrow indicator §7 asks for.
                      One slot, so the card does not change height on selection. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-expert bg-expert text-[#171410]"
                        : "border-white/15 text-white/35 group-hover/dmg:border-white/30 group-hover/dmg:text-white/60",
                    )}
                  >
                    {isSelected ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      <ArrowRight className="size-3.5" />
                    )}
                  </span>
                </div>

                {/* The image slot. A diagram derived from the damage's own region and
                    severity — no invented photography (§6), and it changes per card so
                    six cards do not look like one card repeated. */}
                <DamageGlyph
                  region={damage.region}
                  severity={damage.severity}
                  active={isSelected}
                />

                <h3
                  className={cn(
                    "mt-4 text-[15px] font-semibold uppercase tracking-[0.06em] transition-colors",
                    isSelected ? "text-white" : "text-white/85",
                  )}
                >
                  {damage.title}
                </h3>

                <p className="mt-1.5 text-[13px] leading-snug text-white/50">
                  {damage.description}
                </p>

                {/* Detail on selection. `grid-rows` rather than `height: auto` so the
                    transition is animatable, and `overflow-hidden` so the collapsed
                    state cannot be tabbed into. */}
                <span
                  className={cn(
                    "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300",
                    isSelected ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <span className="min-h-0">
                    <span className="block border-t border-expert/25 pt-3 text-[12.5px] leading-relaxed text-white/60">
                      {damage.detail}
                    </span>
                  </span>
                </span>

                {/* Severity, as a word rather than only as a red tint. */}
                <span
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]",
                    damage.severity === "structural" ? "text-danger/85" : "text-white/35",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      damage.severity === "structural" ? "bg-danger" : "bg-white/30",
                    )}
                  />
                  {damage.severity === "structural" ? "Structural" : "Surface"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* ── §9 · Other / I'm not sure ── */}
      <div className="mt-3">
        <button
          type="button"
          onClick={onToggleOther}
          aria-pressed={otherSelected}
          aria-expanded={otherSelected}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors duration-200",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert",
            otherSelected
              ? "border-expert/55 bg-accent-muted"
              : "border-white/10 bg-white/[0.02] hover:border-white/20",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
              otherSelected
                ? "border-expert bg-expert text-[#171410]"
                : "border-white/15 text-white/40",
            )}
          >
            {otherSelected ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : (
              <HelpCircle className="size-3.5" />
            )}
          </span>

          <span className="min-w-0">
            <span className="block text-[14px] font-semibold uppercase tracking-[0.06em] text-white/90">
              Other / I&apos;m not sure
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-white/45">
              Describe it however makes sense to you — no cricket terminology needed.
            </span>
          </span>
        </button>

        {otherSelected && (
          <div className="mt-3">
            <TextArea
              label="Describe the problem"
              value={otherText}
              onChange={onOtherTextChange}
              error={otherError}
              rows={4}
              placeholder="For example: it makes a hollow sound when I hit the ball, and there's a line near the bottom that wasn't there before."
            />
          </div>
        )}
      </div>

      {/* ── Selection state + §8's Continue ──
             `aria-live` so a selection made with the keyboard is confirmed audibly, not
             only by a border changing colour. */}
      {selectionError && (
        <p role="alert" className="mt-4 flex items-start gap-1.5 text-[13px] text-danger">
          <span aria-hidden="true" className="mt-px font-semibold">
            !
          </span>
          {selectionError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-[13px] text-white/50">
          {count === 0
            ? "Select everything that applies — a bat often has more than one problem."
            : `${count} selected${count > 1 ? " — we'll assess them together." : "."}`}
        </p>

        {continueHref && (
          <a
            href={continueHref}
            className={cn(
              "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm px-7 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert",
              count > 0
                ? "bg-expert text-[#171410] hover:bg-[#e4c37c]"
                : "border border-white/18 text-white/70 hover:border-expert/50 hover:text-white",
            )}
          >
            Continue to diagnosis
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ── The card diagram ─────────────────────────────────────────────────────────────
 *
 * §7 asks each card for an image. There is no damage photography in this project and §6
 * forbids inventing any, so each card gets a small bat silhouette with the damaged
 * region marked — drawn from the same `region`/`severity` data the rest of the feature
 * uses, so it cannot fall out of step with the card it sits on.
 *
 * Inline SVG rather than six files: it is a few hundred bytes, it inherits
 * `currentColor` so the selected state costs nothing extra, and it stays crisp at any
 * size. `aria-hidden` because the heading and description already say what it shows. */

const REGION_MARK: Record<string, { x: number; y: number; w: number; h: number }> = {
  handle: { x: 20, y: 4, w: 8, h: 22 },
  grains: { x: 14, y: 40, w: 20, h: 16 },
  edge: { x: 30, y: 38, w: 5, h: 30 },
  blade: { x: 21, y: 44, w: 6, h: 30 },
  structure: { x: 13, y: 34, w: 22, h: 44 },
  toe: { x: 14, y: 74, w: 20, h: 8 },
};

function DamageGlyph({
  region,
  severity,
  active,
}: {
  region: string;
  severity: "surface" | "structural";
  active: boolean;
}) {
  const mark = REGION_MARK[region] ?? REGION_MARK.structure!;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-5 flex h-24 items-center justify-center rounded-lg border transition-colors duration-300",
        active
          ? "border-expert/25 bg-[radial-gradient(80%_100%_at_50%_0%,rgba(216,180,106,0.14),transparent_70%)]"
          : "border-white/8 bg-black/25",
      )}
    >
      <svg viewBox="0 0 48 88" className="h-[5.25rem] w-auto" fill="none">
        {/* Handle */}
        <rect
          x="21"
          y="3"
          width="6"
          height="24"
          rx="3"
          className={active ? "fill-white/25" : "fill-white/12"}
        />
        {/* Blade */}
        <path
          d="M14 27h20a2 2 0 0 1 2 2v48a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V29a2 2 0 0 1 2-2Z"
          className={active ? "fill-white/16 stroke-white/30" : "fill-white/8 stroke-white/16"}
          strokeWidth="1"
        />
        {/* Grain lines — three, enough to read as willow at this size. */}
        {[19, 24, 29].map((x) => (
          <line
            key={x}
            x1={x}
            y1="31"
            x2={x}
            y2="76"
            className={active ? "stroke-white/14" : "stroke-white/8"}
            strokeWidth="0.75"
          />
        ))}
        {/* The damaged region. Dashed for surface damage, solid and heavier for
            structural — the severity scale the types file describes. */}
        <rect
          x={mark.x}
          y={mark.y}
          width={mark.w}
          height={mark.h}
          rx="1.5"
          strokeWidth={severity === "structural" ? 1.6 : 1.1}
          strokeDasharray={severity === "structural" ? undefined : "3 2"}
          className={cn(
            severity === "structural" ? "stroke-danger" : "stroke-danger/70",
            active ? "fill-danger/16" : "fill-danger/8",
          )}
        />
      </svg>
    </span>
  );
}
