"use client";

import Link from "next/link";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { repairStatusLadder } from "@/data/bat-doctor";
import {
  buildTechnicianBrief,
  buildTrackingMessage,
} from "@/lib/bat-doctor/summary";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { readyMedia } from "@/lib/bat-doctor/validate";
import type {
  BatDoctorFormState,
  MediaItem,
  RepairRequestReceipt,
} from "@/types/bat-doctor";
import { cn } from "@/lib/utils";

/* ── §25 / §26 · Confirmation and status ──────────────────────────────────────────
 *
 * The reference is the whole point of this screen, so it is the largest thing on it,
 * selectable, and copyable in one tap. A customer who loses it has to describe their bat
 * from memory to find their own request.
 *
 * There is one thing this screen must not do, and it shapes everything else: it must not
 * imply that photographs have been delivered when they have not. This project has no
 * object storage — the request record holds the file *metadata* and the seam where a
 * real upload goes is documented in `lib/bat-doctor/request.ts`. So the screen says
 * plainly that the photographs need sending, and hands over a WhatsApp message
 * pre-filled with the full technician brief and the reference, which is the channel this
 * site already uses for every other customer conversation. That is a real delivery path
 * described accurately, rather than a green tick over a gap.
 *
 * The ladder is rendered from `repairStatusLadder`, ten states with `submitted` current,
 * so the customer can see the whole road rather than one green tick and silence. */

interface ConfirmationProps {
  receipt: RepairRequestReceipt;
  state: BatDoctorFormState;
  images: MediaItem[];
  video: MediaItem | null;
}

export function Confirmation({ receipt, state, images, video }: ConfirmationProps) {
  const [copied, setCopied] = useState(false);

  /* Only the attachments that were actually submitted. This screen tells the customer how
     many photographs to send on WhatsApp and builds the technician's brief from the same
     list, so counting a rejected pick would ask them to send a file we refused and would
     leave the technician expecting one that never arrives. */
  const sentImages = readyMedia(images);
  const sentVideo = video?.status === "ready" ? video : null;

  const brief = buildTechnicianBrief(
    state,
    sentImages.map((i) => ({ name: i.name, size: i.size, mime: i.mime, kind: i.kind })),
    sentVideo
      ? {
          name: sentVideo.name,
          size: sentVideo.size,
          mime: sentVideo.mime,
          kind: sentVideo.kind,
        }
      : null,
    receipt.requestId,
  );

  const currentIndex = repairStatusLadder.findIndex((s) => s.id === receipt.status);
  const current = currentIndex === -1 ? 0 : currentIndex;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(receipt.requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard is blocked on insecure origins and in some in-app browsers. The
      // reference is selectable text either way, so there is nothing to recover from —
      // just don't claim it was copied.
      setCopied(false);
    }
  }

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-2xl text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-full border border-expert/40 bg-accent-muted"
        >
          <Check className="size-6 text-expert" strokeWidth={2.5} />
        </span>

        {/* `role="status"` so this is announced on arrival — the customer has just
            submitted and needs to hear that it worked. */}
        <h2
          role="status"
          className="mt-6 font-serif text-[clamp(1.75rem,6vw,2.5rem)] font-semibold leading-tight text-white"
        >
          Request received
        </h2>

        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          A technician will read through what you sent and come back with a diagnosis.
          Keep this reference — it&apos;s how we find your bat.
        </p>

        {/* ── The reference ── */}
        <div className="bd-panel mt-8 rounded-xl p-6">
          <p className="eyebrow">Your request ID</p>
          <p className="mt-2 select-all font-mono text-[clamp(1.5rem,7vw,2.25rem)] font-semibold tracking-[0.08em] text-expert">
            {receipt.requestId}
          </p>

          <button
            type="button"
            onClick={copyReference}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm border border-white/14 px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/80 transition-colors hover:border-expert/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
          >
            {copied ? (
              <Check className="size-3.5 text-expert" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span aria-live="polite">{copied ? "Copied" : "Copy reference"}</span>
          </button>
        </div>

        {/* ── The photographs still have to travel ──
               Said before the CTAs, not after, because it is the next action. */}
        <div className="mt-4 rounded-xl border border-expert/30 bg-accent-muted p-5 text-left">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-expert">
            One more step — send us the photographs
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
            Your details are filed against {receipt.requestId}. Open WhatsApp below — the
            full brief is already written — and attach the{" "}
            {sentImages.length === 1 ? "photograph" : `${sentImages.length} photographs`}
            {sentVideo ? " and the video" : ""} you just selected. That&apos;s what the
            technician works from.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={buildWhatsAppUrl(brief)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-expert px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#171410] transition-colors hover:bg-[#e4c37c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Send photographs
          </a>

          <a
            href={buildWhatsAppUrl(buildTrackingMessage(receipt.requestId))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-sm border border-white/18 px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/85 transition-colors hover:border-expert/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
          >
            Track my request
          </a>

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center px-7 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
          >
            Return home
          </Link>
        </div>
      </div>

      {/* ── §26 · The road ahead ── */}
      <section aria-labelledby="bd-status" className="mx-auto mt-14 max-w-2xl">
        <h3
          id="bd-status"
          className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45"
        >
          What happens next
        </h3>

        <ol className="mt-6 space-y-0">
          {repairStatusLadder.map((status, index) => {
            const done = index < current;
            const isCurrent = index === current;

            return (
              <li key={status.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Connector, drawn behind the markers and stopped on the last item. */}
                {index < repairStatusLadder.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-[0.6875rem] top-6 h-full w-px",
                      done ? "bg-expert/40" : "bg-white/10",
                    )}
                  />
                )}

                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                    isCurrent
                      ? "border-expert bg-expert text-[#171410]"
                      : done
                        ? "border-expert/45 bg-accent-muted text-expert"
                        : "border-white/14 bg-surface-dark",
                  )}
                >
                  {(done || isCurrent) && <Check className="size-3" strokeWidth={3} />}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "flex flex-wrap items-baseline gap-x-2 text-[13.5px] font-semibold uppercase tracking-[0.06em]",
                      isCurrent ? "text-expert" : done ? "text-white/70" : "text-white/45",
                    )}
                  >
                    {status.label}
                    {/* The current state is named in text, not only marked in gold. */}
                    {isCurrent && (
                      <span className="text-[10px] font-semibold tracking-[0.14em] text-expert/70">
                        · YOU ARE HERE
                      </span>
                    )}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[13px] leading-snug",
                      isCurrent ? "text-white/65" : "text-white/35",
                    )}
                  >
                    {status.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
