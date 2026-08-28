"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
  batBrands,
  batGrades,
  batTypes,
  cricketTypeOptions,
  purchaseAgeOptions,
  serviceTypes,
  usageFrequencyOptions,
  yesNoUnsureOptions,
} from "@/data/bat-doctor";
import {
  validateBat,
  validateContact,
  validateDamage,
  validatePhotoCount,
  validateService,
  hasErrors,
  NO_ERRORS,
  readyMedia,
} from "@/lib/bat-doctor/validate";
import { earliestBrokenStep } from "@/lib/bat-doctor/summary";
import { submitRepairRequest } from "@/lib/bat-doctor/submit";
import type {
  BatDoctorErrors,
  BatDoctorField,
  BatDoctorFormState,
  MediaItem,
  RepairRequestReceipt,
} from "@/types/bat-doctor";
import { DamageSelector } from "./DamageSelector";
import { PhotoUpload } from "./PhotoUpload";
import { ReviewSummary } from "./ReviewSummary";
import { FieldGroup, OptionGroup, SelectInput, TextArea, TextInput } from "./fields";
import { cn } from "@/lib/utils";

/* ── §11–§24, §31 · The request workflow ──────────────────────────────────────────
 *
 * Six steps, one per screen, because §30/§31 are explicit that this is a mobile workflow
 * designed as one — not a desktop form stacked narrow. A single long page asking for
 * twenty-five fields is the version people abandon halfway through with a broken bat
 * still in the cupboard.
 *
 * Four decisions worth knowing:
 *
 * Validation runs on Continue, not on keystroke. Marking a field red while someone is
 * still typing their email is hostile, and it is the reason forms feel like they are
 * arguing with you. Once a step has been attempted, though, its errors clear as they are
 * fixed — so the page rewards correction immediately without ever pre-judging.
 *
 * The step is the unit of validation, and the same functions run server-side
 * (`lib/bat-doctor/validate.ts`). A submit that fails on the server sends the customer
 * back to the *earliest* broken step via `earliestBrokenStep`, not the last — otherwise
 * fixing step 5 reveals a problem in step 2 and the form feels bottomless.
 *
 * Focus moves to the step heading on every transition. Without it a keyboard or screen
 * reader user presses Continue and nothing appears to happen: the content changed but
 * the focus ring is still on a button that has moved.
 *
 * Progress is announced as text ("Step 2 of 6"), not conveyed by a bar alone (§35). */

const STEPS = [
  { number: "01", title: "The damage", caption: "What's wrong with your bat" },
  { number: "02", title: "Your bat", caption: "What it is and how it's been used" },
  { number: "03", title: "Photographs", caption: "Show us the damage" },
  { number: "04", title: "The work", caption: "What you'd like us to do" },
  { number: "05", title: "Your details", caption: "Where the bat travels" },
  { number: "06", title: "Review", caption: "Check before it goes to the bench" },
] as const;

const TOTAL = STEPS.length;

const clampStep = (next: number) => Math.max(0, Math.min(TOTAL - 1, next));

/** Every step index. Used when a submit fails: at that point the customer has been
 *  through the whole form, so every step is fair game to mark. */
const ALL_STEPS: ReadonlySet<number> = new Set(STEPS.map((_, index) => index));

export const EMPTY_FORM: BatDoctorFormState = {
  damageIds: [],
  otherDamageSelected: false,
  otherDamageText: "",

  brand: "",
  brandOther: "",
  batType: "",
  batModel: "",
  grade: "",
  purchaseAge: "",
  purchaseDate: "",
  usageFrequency: "",
  cricketType: "",
  knockedIn: "",
  previouslyRepaired: "",
  previousRepairDetail: "",

  description: "",
  serviceType: "",

  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pin: "",
  // Pre-filled because this is a Kashmir-based workshop shipping within India, and a
  // required field with one overwhelmingly likely answer should arrive answered.
  country: "India",
};

interface RepairWorkflowProps {
  state: BatDoctorFormState;
  images: MediaItem[];
  video: MediaItem | null;
  onField: <K extends BatDoctorField>(field: K, value: BatDoctorFormState[K]) => void;
  onToggleDamage: (id: string) => void;
  onToggleOtherDamage: () => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onSetVideo: (file: File | null) => void;
  onSubmitted: (receipt: RepairRequestReceipt) => void;
}

export function RepairWorkflow({
  state,
  images,
  video,
  onField,
  onToggleDamage,
  onToggleOtherDamage,
  onAddImages,
  onRemoveImage,
  onSetVideo,
  onSubmitted,
}: RepairWorkflowProps) {
  const [step, setStep] = useState(0);
  /** Which steps the customer has tried to leave. Errors only show for these, so
   *  nothing is red before it has been attempted. */
  const [attempted, setAttempted] = useState<ReadonlySet<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step's heading — but not on first mount, where stealing focus
  // would scroll the page away from wherever the customer arrived.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const stepErrors = useCallback(
    (index: number): BatDoctorErrors => {
      switch (index) {
        case 0:
          return validateDamage(state);
        case 1:
          return validateBat(state);
        case 3:
          return validateService(state);
        case 4:
          return validateContact(state);
        default:
          return NO_ERRORS;
      }
    },
    [state],
  );

  /* What's visibly wrong right now — derived, never stored.
   *
   * These are a pure function of the form, the photo count, and whether this step has
   * been attempted, so holding them in state meant an effect had to keep two copies of
   * the same truth in step. That effect was both a cascading render and a source of
   * stale red: any path that changed `state` without re-running it left the previous
   * step's errors on screen. Computing them here is what makes an error disappear the
   * instant it is fixed, with nothing to keep in sync.
   *
   * The server's own field errors need no separate slot: client and server call the
   * identical validators from `lib/bat-doctor/validate.ts`, so a rejection the server
   * reports is one these lines reproduce. Media problems come back as a message, not a
   * field, and surface through `submitError` below. */
  const showErrors = attempted.has(step);
  const errors: BatDoctorErrors = showErrors ? stepErrors(step) : NO_ERRORS;

  /* Usable photographs, not attached cards. A rejected pick stays visible with its reason
     on it, so `images` is the wrong thing to count: two unusable files would otherwise
     clear the at-least-one gate here and then be rejected by the server, which validates
     every ref it receives. Counting the same thing both sides do is what keeps the client
     from promising something the route will refuse. */
  const readyImages = readyMedia(images);
  const readyVideo = video?.status === "ready" ? video : null;

  const photoError =
    showErrors && step === 2 ? validatePhotoCount(readyImages.length) : null;

  /** Customer-initiated navigation. Clears any submit error, because they have moved on
   *  from the screen it belonged to. */
  const goTo = useCallback((next: number) => {
    setSubmitError(null);
    setStep(clampStep(next));
  }, []);

  /* Validation-initiated navigation, and a separate function rather than
     `setSubmitError(msg)` beside `goTo(target)` — React applies queued updates in order,
     so `goTo`'s clear would land last and the message would never be seen. */
  const routeToProblem = useCallback((next: number, message: string) => {
    setStep(clampStep(next));
    setSubmitError(message);
  }, []);

  function attemptContinue() {
    // Marking the step attempted is what makes its errors visible; the derived values
    // above pick it up on this same render, so there is nothing to set twice.
    setAttempted((prev) => new Set(prev).add(step));

    if (step === 2) {
      if (validatePhotoCount(readyImages.length)) return;
      goTo(step + 1);
      return;
    }

    if (hasErrors(stepErrors(step))) return;

    goTo(step + 1);
  }

  async function attemptSubmit() {
    // Every step, in order — the review screen is the last place a gap can be caught
    // before a technician is waiting on a bat that has no address attached.
    const all: BatDoctorErrors = {
      ...validateDamage(state),
      ...validateBat(state),
      ...validateService(state),
      ...validateContact(state),
    };
    const photoProblem = validatePhotoCount(readyImages.length);

    if (hasErrors(all) || photoProblem) {
      setAttempted(new Set(ALL_STEPS));

      const brokenFieldStep = hasErrors(all)
        ? earliestBrokenStep(Object.keys(all) as BatDoctorField[])
        : Number.POSITIVE_INFINITY;
      const target = Math.min(brokenFieldStep, photoProblem ? 2 : Number.POSITIVE_INFINITY);

      routeToProblem(
        Number.isFinite(target) ? target : 0,
        photoProblem ??
          "A few details still need your attention — we've taken you back to them.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Usable attachments only. The route validates every ref it is given, so sending a
    // pick the customer already saw rejected would fail the whole request over a file
    // they had been told was ignored.
    const result = await submitRepairRequest(state, readyImages, readyVideo);

    setSubmitting(false);

    if (!result.ok) {
      // The server disagreed. Trust it over the client — it is the authority — and route
      // back to the earliest field it named. It runs the same validators, so the derived
      // errors above will already be showing the same fields when we arrive.
      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        const fields = Object.keys(result.fieldErrors) as BatDoctorField[];
        const target = earliestBrokenStep(fields);
        setAttempted(new Set(ALL_STEPS));
        routeToProblem(Number.isFinite(target) ? target : 0, result.message);
        return;
      }

      // No field was named — a rate limit, an oversized upload, or the network. The
      // message is the whole story and the customer stays where they are.
      setSubmitError(result.message);
      return;
    }

    onSubmitted(result.receipt);
  }

  const meta = STEPS[step]!;
  const isLast = step === TOTAL - 1;

  return (
    <div className="min-w-0">
      {/* ── Progress (§31) ──
             Text first, bar second. The bar is `aria-hidden` because the sentence beside
             it already carries the information, and a progressbar role here would have
             a screen reader announce the same fact twice. */}
      <div className="mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-expert">
            Step {step + 1} of {TOTAL}
          </p>
          <p className="text-[12px] uppercase tracking-[0.1em] text-white/40">
            {meta.title}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="mt-3 h-px w-full overflow-hidden bg-white/10"
        >
          <div
            className="h-full bg-expert transition-[width] duration-500 ease-out"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>

        {/* The full ladder, on screens with room for it. Steps already completed are
            clickable, so review → edit → back is two taps rather than five Continues. */}
        <ol className="mt-4 hidden gap-1 md:flex">
          {STEPS.map((s, index) => {
            const reachable = index <= step || attempted.has(index);

            return (
              <li key={s.number} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => reachable && goTo(index)}
                  disabled={!reachable}
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "w-full border-t-2 pt-2 text-left transition-colors duration-200",
                    index === step
                      ? "border-expert"
                      : index < step
                        ? "border-expert/40 hover:border-expert/70"
                        : "border-white/10",
                    !reachable && "cursor-default",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert",
                  )}
                >
                  <span
                    className={cn(
                      "block font-mono text-[10.5px] tracking-[0.1em]",
                      index === step
                        ? "text-expert"
                        : index < step
                          ? "text-white/50"
                          : "text-white/25",
                    )}
                  >
                    {s.number}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[11.5px] font-medium uppercase tracking-[0.06em]",
                      index === step ? "text-white" : "text-white/40",
                    )}
                  >
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Step heading ──
             `tabIndex={-1}` so it can receive programmatic focus without joining the tab
             order, and `key` so React remounts it per step — which is what makes the
             screen reader re-announce it. */}
      <h3
        key={step}
        ref={headingRef}
        tabIndex={-1}
        className="scroll-mt-24 font-serif text-[clamp(1.5rem,5.5vw,2rem)] font-semibold leading-tight text-white outline-none"
      >
        {meta.title}
      </h3>
      <p className="mt-1.5 text-[14px] text-white/50">{meta.caption}</p>

      <div className="mt-8">
        {/* ── 01 · Damage (§7–§9) ── */}
        {step === 0 && (
          <DamageSelector
            selected={state.damageIds}
            otherSelected={state.otherDamageSelected}
            otherText={state.otherDamageText}
            onToggle={onToggleDamage}
            onToggleOther={onToggleOtherDamage}
            onOtherTextChange={(value) => onField("otherDamageText", value)}
            otherError={errors.otherDamageText}
            selectionError={errors.damageIds}
          />
        )}

        {/* ── 02 · The bat (§11–§14) ── */}
        {step === 1 && (
          <div className="space-y-10">
            <FieldGroup title="Tell us about your bat">
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectInput
                  label="Brand"
                  options={batBrands}
                  value={state.brand}
                  onChange={(value) => onField("brand", value)}
                  error={errors.brand}
                  placeholder="Choose a brand"
                />

                {state.brand === "other" && (
                  <TextInput
                    label="Which brand?"
                    value={state.brandOther}
                    onChange={(value) => onField("brandOther", value)}
                    error={errors.brandOther}
                    placeholder="Brand name"
                  />
                )}

                <TextInput
                  label="Bat model"
                  value={state.batModel}
                  onChange={(value) => onField("batModel", value)}
                  error={errors.batModel}
                  optional
                  placeholder="If you know it"
                />
              </div>

              <OptionGroup
                label="Bat type"
                options={batTypes}
                value={state.batType}
                onChange={(value) => onField("batType", value)}
                error={errors.batType}
                columns={3}
              />

              <OptionGroup
                label="Grade"
                options={batGrades}
                value={state.grade}
                onChange={(value) => onField("grade", value)}
                error={errors.grade}
                optional
                columns={3}
              />
            </FieldGroup>

            <FieldGroup title="When did you buy your bat?">
              <OptionGroup
                label="Roughly how long have you had it?"
                options={purchaseAgeOptions}
                value={state.purchaseAge}
                onChange={(value) => onField("purchaseAge", value)}
                error={errors.purchaseAge}
                columns={2}
              />

              <TextInput
                label="Exact date"
                type="date"
                value={state.purchaseDate}
                onChange={(value) => onField("purchaseDate", value)}
                error={errors.purchaseDate}
                optional
                hint="Only if you happen to have it — a receipt date helps us judge wear."
                className="max-w-xs"
              />
            </FieldGroup>

            <FieldGroup title="How is it used?">
              <OptionGroup
                label="How often do you play with it?"
                options={usageFrequencyOptions}
                value={state.usageFrequency}
                onChange={(value) => onField("usageFrequency", value)}
                error={errors.usageFrequency}
                columns={2}
              />

              <OptionGroup
                label="What kind of cricket?"
                options={cricketTypeOptions}
                value={state.cricketType}
                onChange={(value) => onField("cricketType", value)}
                error={errors.cricketType}
                columns={2}
              />
            </FieldGroup>

            <FieldGroup title="History">
              <OptionGroup
                label="Was it knocked in?"
                options={yesNoUnsureOptions}
                value={state.knockedIn}
                onChange={(value) => onField("knockedIn", value)}
                error={errors.knockedIn}
                hint="Knocking in compresses the fibres before use. “Not sure” is common and perfectly fine."
                columns={3}
              />

              <OptionGroup
                label="Has it been repaired before?"
                options={yesNoUnsureOptions}
                value={state.previouslyRepaired}
                onChange={(value) => onField("previouslyRepaired", value)}
                error={errors.previouslyRepaired}
                columns={3}
              />

              {state.previouslyRepaired === "yes" && (
                <TextArea
                  label="What was repaired?"
                  value={state.previousRepairDetail}
                  onChange={(value) => onField("previousRepairDetail", value)}
                  error={errors.previousRepairDetail}
                  rows={3}
                  placeholder="For example: the toe was rebuilt last season."
                />
              )}
            </FieldGroup>
          </div>
        )}

        {/* ── 03 · Photographs (§15–§17) ── */}
        {step === 2 && (
          <PhotoUpload
            images={images}
            video={video}
            onAddImages={onAddImages}
            onRemoveImage={onRemoveImage}
            onSetVideo={onSetVideo}
            error={photoError ?? undefined}
          />
        )}

        {/* ── 04 · The work (§18–§19) ── */}
        {step === 3 && (
          <div className="space-y-10">
            <FieldGroup title="Tell us what happened">
              <TextArea
                label="What happened to your bat?"
                value={state.description}
                onChange={(value) => onField("description", value)}
                error={errors.description}
                optional
                rows={6}
                placeholder="Tell our technicians when you noticed the problem, how it happened, and anything else we should know."
              />
            </FieldGroup>

            <FieldGroup title="What would you like us to do?">
              <OptionGroup
                label="Service"
                options={serviceTypes}
                value={state.serviceType}
                onChange={(value) => onField("serviceType", value)}
                error={errors.serviceType}
                // One column: every option carries a second line, and two columns of
                // wrapped explanation is where a premium form starts looking cramped.
                columns={1}
              />

              <p className="text-[13px] leading-relaxed text-white/45">
                If you&apos;re not sure, say so — that&apos;s the answer most people give,
                and it costs nothing. We&apos;ll tell you what the bat needs and what it
                would take before anything happens to it.
              </p>
            </FieldGroup>
          </div>
        )}

        {/* ── 05 · You (§20–§21) ── */}
        {step === 4 && (
          <div className="space-y-10">
            <FieldGroup title="Your details">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextInput
                  label="Full name"
                  value={state.fullName}
                  onChange={(value) => onField("fullName", value)}
                  error={errors.fullName}
                  autoComplete="name"
                  placeholder="Your name"
                />
                <TextInput
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  value={state.phone}
                  onChange={(value) => onField("phone", value)}
                  error={errors.phone}
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                />
                <TextInput
                  label="Email"
                  type="email"
                  inputMode="email"
                  value={state.email}
                  onChange={(value) => onField("email", value)}
                  error={errors.email}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="sm:col-span-2"
                />
              </div>
            </FieldGroup>

            <FieldGroup title="Collection / return address">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextInput
                  label="Address line 1"
                  value={state.addressLine1}
                  onChange={(value) => onField("addressLine1", value)}
                  error={errors.addressLine1}
                  autoComplete="address-line1"
                  placeholder="House, street"
                  className="sm:col-span-2"
                />
                <TextInput
                  label="Address line 2"
                  value={state.addressLine2}
                  onChange={(value) => onField("addressLine2", value)}
                  error={errors.addressLine2}
                  autoComplete="address-line2"
                  optional
                  placeholder="Area, landmark"
                  className="sm:col-span-2"
                />
                <TextInput
                  label="City"
                  value={state.city}
                  onChange={(value) => onField("city", value)}
                  error={errors.city}
                  autoComplete="address-level2"
                />
                <TextInput
                  label="State"
                  value={state.state}
                  onChange={(value) => onField("state", value)}
                  error={errors.state}
                  autoComplete="address-level1"
                />
                <TextInput
                  label="PIN code"
                  inputMode="numeric"
                  maxLength={6}
                  value={state.pin}
                  onChange={(value) => onField("pin", value)}
                  error={errors.pin}
                  autoComplete="postal-code"
                  placeholder="6 digits"
                />
                <TextInput
                  label="Country"
                  value={state.country}
                  onChange={(value) => onField("country", value)}
                  error={errors.country}
                  autoComplete="country-name"
                />
              </div>
            </FieldGroup>
          </div>
        )}

        {/* ── 06 · Review (§22–§23) ──
               Only the usable attachments: this screen is a statement of what is about to
               be sent, so counting a file the customer has been told is unreadable would
               make the review a promise the submission does not keep. */}
        {step === 5 && (
          <ReviewSummary
            state={state}
            images={readyImages}
            video={readyVideo}
            onEdit={(target) => goTo(target)}
          />
        )}
      </div>

      {/* ── Footer (§24, §31) ──
             Sticky, because the primary action must stay reachable without scrolling to
             the bottom of a long step on a phone. */}
      {submitError && (
        <p
          role="alert"
          className="mt-8 flex items-start gap-2 rounded-lg border border-danger/45 bg-danger-muted px-4 py-3 text-[13.5px] leading-snug text-danger"
        >
          <span aria-hidden="true" className="mt-px font-semibold">
            !
          </span>
          {submitError}
        </p>
      )}

      <div className="sticky bottom-0 z-10 mt-10 -mx-4 border-t border-white/10 bg-[linear-gradient(to_top,rgba(10,9,8,0.98),rgba(10,9,8,0.92))] px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || submitting}
            className={cn(
              "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm border border-white/15 px-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/70 transition-colors sm:px-6",
              "hover:border-white/30 hover:text-white",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert",
              (step === 0 || submitting) && "pointer-events-none opacity-30",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
            <span className="sr-only sm:hidden">Back</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={attemptSubmit}
              disabled={submitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-sm bg-expert px-6 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  Submit bat for diagnosis
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={attemptContinue}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-sm bg-expert px-6 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
