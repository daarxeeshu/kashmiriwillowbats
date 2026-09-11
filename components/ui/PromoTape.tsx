"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PromoTapeSettings } from "@/data/promo-tape";

/* ── The angled promo tape ───────────────────────────────────────────────────────
 *
 * A strip across the top corner of a card that cycles through the shop's selling
 * lines — "High on demand", "Hot selling", "Most liked". What it says, whether it
 * shows, and how fast it turns over all come from the admin panel; see
 * `data/promo-tape.ts`.
 *
 * ── Why the messages are stacked rather than swapped ──
 * Every message is rendered, all in the same CSS grid cell, with only the active one
 * visible. That makes the tape as wide as its *longest* message and keeps it there,
 * so the strip does not resize and re-tilt each time the copy turns over — which is
 * what a plain `{messages[index]}` does, and it reads as a glitch rather than a
 * ticker. The inactive copies are `aria-hidden` so a screen reader is not handed
 * three slogans at once.
 *
 * ── Why one fetch per card is not a problem ──
 * Several cards mount this at once and each calls `/api/promo-tape`. The browser
 * coalesces identical in-flight GETs to the same URL, and the response is three
 * short strings — so this is one request in practice. Lifting it into a provider
 * would buy nothing and put a storefront-wide context in the way of a decoration.
 */

interface PromoTapeProps {
  /** Slight tilt in degrees. Alternate the sign across a row of cards so the tapes
   *  do not read as a printed template. */
  tilt?: number;
  className?: string;
}

export function PromoTape({ tilt = -6, className }: PromoTapeProps) {
  const [settings, setSettings] = useState<PromoTapeSettings | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/promo-tape", { signal: controller.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object") setSettings(data as PromoTapeSettings);
      })
      // Any failure means no tape. It is decoration, and a card must not show an
      // error state because a slogan did not load.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const messages = settings?.messages ?? [];
  const cycling = Boolean(settings?.enabled) && messages.length > 1;

  useEffect(() => {
    if (!cycling) return;
    /* Someone who has asked for less motion still gets the tape and still gets the
       copy — it simply stops turning over, rather than the strip disappearing. */
    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const interval = setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      settings!.intervalMs,
    );
    return () => clearInterval(interval);
  }, [cycling, messages.length, settings]);

  // Not loaded yet, switched off, or nothing to say: render nothing at all rather
  // than an empty element that still has to be reasoned about in the layout.
  if (!settings?.enabled || messages.length === 0) return null;

  const active = messages[index % messages.length];

  return (
    <div
      className={cn(
        "pointer-events-none absolute -right-3 top-5 z-20 select-none",
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* One live region for the whole tape, so the copy is announced once when it
          changes rather than three times on mount. `polite` because nothing here is
          urgent and it must not interrupt. */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "grid rounded-sm bg-[#12110f]/95 px-3 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.45)]",
          "ring-1 ring-inset ring-white/10",
        )}
      >
        {messages.map((message, i) => (
          <span
            key={`${message}-${i}`}
            aria-hidden={message === active ? undefined : true}
            className={cn(
              // Same grid cell for every message: the tape sizes to the longest.
              "col-start-1 row-start-1 whitespace-nowrap text-center",
              "text-[11px] font-bold uppercase tracking-[0.14em] text-expert",
              "transition-all duration-500 ease-out motion-reduce:transition-none",
              message === active
                ? "translate-y-0 opacity-100"
                : "-translate-y-1 opacity-0",
            )}
          >
            {message}
          </span>
        ))}
      </p>
    </div>
  );
}
