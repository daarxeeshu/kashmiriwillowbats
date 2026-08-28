"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MAX_IMAGES, OTHER_DAMAGE_ID } from "@/data/bat-doctor";
import { readyMedia } from "@/lib/bat-doctor/validate";
import type {
  BatDoctorField,
  BatDoctorFormState,
  MediaItem,
  RepairRequestReceipt,
} from "@/types/bat-doctor";
import { BatDiagnosis } from "./BatDiagnosis";
import { Confirmation } from "./Confirmation";
import { DamageSelector } from "./DamageSelector";
import { toMediaItem } from "./PhotoUpload";
import { EMPTY_FORM, RepairWorkflow } from "./RepairWorkflow";

/* ── The one place Bat Doctor's state lives ────────────────────────────────────────
 *
 * Three interactive sections share a single selection, which is the whole reason this
 * component exists: the §7 damage cards, the §10 bat hotspots and step 01 of the workflow
 * are three doors into the same `damageIds`. Tap "TOE" on the bat, scroll down, and the
 * TOE REPAIR card is already selected — because there is nothing to synchronise.
 *
 * State is deliberately in memory only. Nothing here is written to `localStorage`, and
 * that is a decision rather than an omission: this object ends up holding a name, a phone
 * number, an email address and a home address, and §29 asks that customer information be
 * protected. Persisting all of it to a device store that every script on the origin can
 * read — to save re-typing on a page most people fill in once — is a bad trade.
 *
 * The static sections around this (hero, process, closing band) stay server components.
 * Only the parts that respond to a tap are client-side. */

export function BatDoctorExperience() {
  const [form, setForm] = useState<BatDoctorFormState>(EMPTY_FORM);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [video, setVideo] = useState<MediaItem | null>(null);
  const [receipt, setReceipt] = useState<RepairRequestReceipt | null>(null);

  const bookRef = useRef<HTMLDivElement>(null);

  /** Every object URL this component has handed out. Revoked on unmount — a `blob:` URL
   *  keeps its file alive in memory for the life of the document, and these are phone
   *  photographs. Removal revokes eagerly; this is the net that catches navigation. */
  const urls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const created = urls.current;
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
      created.clear();
    };
  }, []);

  const setField = useCallback(
    <K extends BatDoctorField>(field: K, value: BatDoctorFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const toggleDamage = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      damageIds: prev.damageIds.includes(id)
        ? prev.damageIds.filter((existing) => existing !== id)
        : [...prev.damageIds, id],
    }));
  }, []);

  const toggleOtherDamage = useCallback(() => {
    setForm((prev) => {
      const next = !prev.otherDamageSelected;
      return {
        ...prev,
        otherDamageSelected: next,
        // Deselecting clears the text. Leaving orphaned prose behind means a technician
        // reads a description of a problem the customer decided not to report.
        otherDamageText: next ? prev.otherDamageText : "",
        damageIds: next
          ? [...prev.damageIds.filter((id) => id !== OTHER_DAMAGE_ID), OTHER_DAMAGE_ID]
          : prev.damageIds.filter((id) => id !== OTHER_DAMAGE_ID),
      };
    });
  }, []);

  /** A hotspot maps to one or more categories (§10). Tapping toggles the whole group: if
   *  everything it covers is already selected, the tap clears it — otherwise it selects
   *  the rest. Anything else makes a second tap on the same region do nothing, which
   *  reads as broken. */
  const selectRegion = useCallback((ids: string[]) => {
    setForm((prev) => {
      const allSelected = ids.every((id) => prev.damageIds.includes(id));
      return {
        ...prev,
        damageIds: allSelected
          ? prev.damageIds.filter((id) => !ids.includes(id))
          : [...prev.damageIds, ...ids.filter((id) => !prev.damageIds.includes(id))],
      };
    });
  }, []);

  const addImages = useCallback((files: File[]) => {
    setImages((prev) => {
      // Room is measured in usable photographs. Rejected cards stay on screen so the
      // customer can see why a file didn't take, but they must not consume one of the
      // eight slots — otherwise a few bad picks lock out the good ones.
      const room = MAX_IMAGES - readyMedia(prev).length;
      if (room <= 0) return prev;

      const added = files.slice(0, room).map((file) => {
        const item = toMediaItem(file, "image");
        if (item.previewUrl) urls.current.add(item.previewUrl);
        return item;
      });

      return [...prev, ...added];
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        urls.current.delete(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const changeVideo = useCallback((file: File | null) => {
    setVideo((prev) => {
      // Replacing or clearing revokes the outgoing one first, or a customer who tries
      // three clips leaks two of them.
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
        urls.current.delete(prev.previewUrl);
      }
      if (!file) return null;

      const item = toMediaItem(file, "video");
      if (item.previewUrl) urls.current.add(item.previewUrl);
      return item;
    });
  }, []);

  const handleSubmitted = useCallback((next: RepairRequestReceipt) => {
    setReceipt(next);
    // The confirmation replaces a long form in place, so without this the customer is
    // left looking at the middle of a screen whose content just changed entirely.
    bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* ── §7–§9 · What's wrong with your bat? ── */}
      <section
        id="check-your-bat"
        aria-labelledby="bd-damage-heading"
        className="section-padding scroll-mt-20 border-t border-border"
      >
        <div className="container-main">
          <p className="eyebrow">Step one</p>
          <h2
            id="bd-damage-heading"
            className="mt-3 max-w-2xl font-serif text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-tight text-white"
          >
            What&apos;s wrong with your bat?
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/50">
            Select the damage. We&apos;ll diagnose the repair. Choose everything that
            applies — bats rarely break in one place only.
          </p>

          <div className="mt-10">
            <DamageSelector
              selected={form.damageIds}
              otherSelected={form.otherDamageSelected}
              otherText={form.otherDamageText}
              onToggle={toggleDamage}
              onToggleOther={toggleOtherDamage}
              onOtherTextChange={(value) => setField("otherDamageText", value)}
              continueHref="#bat-diagnosis"
            />
          </div>
        </div>
      </section>

      {/* ── §10 · Diagnosis ── */}
      <section
        id="bat-diagnosis"
        aria-labelledby="bd-diagnosis-heading"
        className="bd-stage section-padding scroll-mt-20 border-t border-border"
      >
        <div className="container-main">
          <div className="max-w-2xl">
            <p className="eyebrow">Bat diagnosis</p>
            <h2
              id="bd-diagnosis-heading"
              className="mt-3 font-serif text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-tight text-white"
            >
              Select an area to inspect
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-white/50">
              Point at the part of the bat that&apos;s giving you trouble. Whatever you
              choose here carries straight into your repair request.
            </p>
          </div>

          <div className="mt-12">
            <BatDiagnosis selected={form.damageIds} onSelectRegion={selectRegion} />
          </div>

          <div className="bd-rule mt-14" />

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[14px] leading-relaxed text-white/50">
              Ready when you are. The next part takes a few minutes and needs a couple of
              photographs — you can do all of it from your phone.
            </p>
            <a
              href="#book-a-repair"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-expert px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              Get a repair quote
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* ── §11–§25 · The request ── */}
      <section
        id="book-a-repair"
        aria-labelledby="bd-request-heading"
        className="section-padding scroll-mt-20 border-t border-border"
      >
        <div className="container-main">
          <div ref={bookRef} className="mx-auto max-w-3xl scroll-mt-24">
            {receipt ? (
              <Confirmation
                receipt={receipt}
                state={form}
                images={images}
                video={video}
              />
            ) : (
              <>
                <div className="mb-10">
                  <p className="eyebrow">Book a repair</p>
                  <h2
                    id="bd-request-heading"
                    className="mt-3 font-serif text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-tight text-white"
                  >
                    Send your bat to the bench
                  </h2>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-white/50">
                    Six short steps. Nothing happens to your bat — and nothing is charged
                    — until you&apos;ve seen the diagnosis and agreed to the work.
                  </p>
                </div>

                <RepairWorkflow
                  state={form}
                  images={images}
                  video={video}
                  onField={setField}
                  onToggleDamage={toggleDamage}
                  onToggleOtherDamage={toggleOtherDamage}
                  onAddImages={addImages}
                  onRemoveImage={removeImage}
                  onSetVideo={changeVideo}
                  onSubmitted={handleSubmitted}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
