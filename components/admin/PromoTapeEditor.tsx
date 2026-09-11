"use client";

import { useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import {
  PROMO_TAPE_MAX_LENGTH,
  PROMO_TAPE_MAX_MESSAGES,
  PROMO_TAPE_MAX_INTERVAL,
  PROMO_TAPE_MIN_INTERVAL,
  promoMessageError,
  type PromoTapeSettings,
} from "@/data/promo-tape";
import { cn } from "@/lib/utils";

/* ── Editing the promo tape ──────────────────────────────────────────────────────
 *
 * The switch, the copy and the speed. Seeded from the server on first render and
 * redrawn from whatever the save actually stored — not from what was typed — so the
 * form can never show a message that the storefront is not showing. `sanitisePromoTape`
 * trims and caps on the way in, and this is where that becomes visible.
 */

interface PromoTapeEditorProps {
  initial: PromoTapeSettings;
}

type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

export function PromoTapeEditor({ initial }: PromoTapeEditorProps) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [messages, setMessages] = useState<string[]>(initial.messages);
  const [intervalMs, setIntervalMs] = useState(initial.intervalMs);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  /* "Saved" is not independent state — it is the question "is what is on screen still
     what I saved?". Comparing the two means editing a field clears the confirmation
     without an effect to reset it. */
  const [savedSpec, setSavedSpec] = useState(() =>
    JSON.stringify([initial.enabled, initial.messages, initial.intervalMs]),
  );
  const currentSpec = JSON.stringify([enabled, messages, intervalMs]);
  const dirty = currentSpec !== savedSpec;

  const errors = messages.map(promoMessageError);
  const firstError = errors.find(Boolean) ?? null;
  const filled = messages.filter((m) => m.trim().length > 0);
  // The switch is how the tape is turned off, so "on with nothing to say" is a
  // configuration the server would silently replace with the defaults. Say so here
  // instead of letting the save surprise them.
  const noMessages = enabled && filled.length === 0;

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const response = await fetch("/admin/api/promo-tape", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled, messages: filled, intervalMs }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: body?.message ?? "Could not save those settings.",
        });
        return;
      }
      // Redraw from the stored value: trimming, capping and the empty-list fallback
      // all happen server-side, and the form must agree with the storefront.
      const saved = body as PromoTapeSettings;
      setEnabled(saved.enabled);
      setMessages(saved.messages);
      setIntervalMs(saved.intervalMs);
      setSavedSpec(
        JSON.stringify([saved.enabled, saved.messages, saved.intervalMs]),
      );
      setStatus({ kind: "saved" });
    } catch {
      setStatus({
        kind: "error",
        message: "Could not reach the server. Check the dev server is running.",
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* ── The switch ── */}
      <div className="flex items-start justify-between gap-6 rounded-sm border border-border bg-surface-card p-5">
        <div>
          <p className="text-sm font-semibold text-white">Show the tape</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-white/50">
            Turns the strip on every brand card on and off. Off removes it completely —
            the copy below is kept, so switching back on restores exactly what is set
            here.
          </p>
        </div>
        {/* A real checkbox under the skin: it arrives with the role, the focus ring,
            the space-bar behaviour and the label association already correct, which a
            div with an onClick does not. */}
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <span className="sr-only">Show the promo tape</span>
          <span
            aria-hidden="true"
            className={cn(
              "h-6 w-11 rounded-full transition-colors duration-200",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest",
              enabled ? "bg-forest" : "bg-white/15",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              enabled && "translate-x-5",
            )}
          />
        </label>
      </div>

      {/* ── The copy ── */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-white">Messages</p>
          <p className="text-xs text-white/40">
            {messages.length} of {PROMO_TAPE_MAX_MESSAGES}
          </p>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-white/50">
          Shown in this order, cycling. One message on its own simply stays put.
        </p>

        <ul className="mt-3 space-y-2">
          {messages.map((message, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  value={message}
                  maxLength={PROMO_TAPE_MAX_LENGTH}
                  onChange={(e) =>
                    setMessages((list) =>
                      list.map((m, j) => (j === i ? e.target.value : m)),
                    )
                  }
                  aria-label={`Message ${i + 1}`}
                  aria-invalid={errors[i] ? true : undefined}
                  className={cn(
                    "w-full rounded-sm border bg-background px-3 py-2 text-sm text-white outline-none transition-colors",
                    errors[i]
                      ? "border-danger/60 focus:border-danger"
                      : "border-border focus:border-accent/50",
                  )}
                />
                {errors[i] && (
                  <p className="mt-1 text-[11px] text-danger">{errors[i]}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMessages((list) => list.filter((_, j) => j !== i))}
                aria-label={`Remove message ${i + 1}`}
                className="mt-1 rounded-sm border border-border p-2 text-white/40 transition-colors hover:border-danger/50 hover:text-danger"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>

        {messages.length < PROMO_TAPE_MAX_MESSAGES && (
          <button
            type="button"
            onClick={() => setMessages((list) => [...list, ""])}
            className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-border-strong hover:text-white"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            Add a message
          </button>
        )}

        {noMessages && (
          <p className="mt-3 text-[11px] text-danger">
            The tape is on with nothing to say. Add a message, or switch it off.
          </p>
        )}
      </div>

      {/* ── The speed ── */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="promo-interval" className="text-sm font-semibold text-white">
            Hold each message for
          </label>
          <span className="text-xs tabular-nums text-white/60">
            {(intervalMs / 1000).toFixed(1)}s
          </span>
        </div>
        <input
          id="promo-interval"
          type="range"
          min={PROMO_TAPE_MIN_INTERVAL}
          max={PROMO_TAPE_MAX_INTERVAL}
          step={100}
          value={intervalMs}
          onChange={(e) => setIntervalMs(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--color-forest-light)]"
        />
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={save}
          disabled={
            status.kind === "saving" || Boolean(firstError) || noMessages || !dirty
          }
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-sm px-5 text-sm font-semibold transition-colors",
            "h-11 bg-forest text-white hover:bg-forest-hover disabled:opacity-40",
          )}
        >
          {status.kind === "saving" ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Saving…
            </>
          ) : !dirty && status.kind === "saved" ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>

        {status.kind === "error" && (
          <p role="alert" className="text-xs text-danger">
            {status.message}
          </p>
        )}
        {!dirty && status.kind === "saved" && (
          <p className="text-xs text-white/50">
            Live on the storefront — reload a page to see it.
          </p>
        )}
      </div>
    </div>
  );
}
