"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── The coupon code, as something you can take ──────────────────────────────────
 *
 * This was a line of monospaced text. On a desktop that is enough — a code beside a
 * cursor is a code you can select and copy. On a phone it is not: selecting text
 * inside a card means a long-press, a pair of drag handles and a system menu, which
 * is several deliberate gestures to acquire eight characters that the page could
 * simply hand over.
 *
 * So the code *is* the button rather than sitting beside one. It reads the same as
 * before at a glance, the whole cell is the target rather than a separate 44px
 * control competing for width in a card that is about 170px wide on a phone, and
 * there is no second thing to label.
 */

interface CopyCodeButtonProps {
  code: string;
  /** Names which offer this code belongs to, for the button's accessible name.
   *  "Copy code KISSAVE10" is ambiguous in a list of five; "…for Buy Any 3" is not. */
  offerTitle: string;
  className?: string;
}

/** How long the confirmation holds. Long enough to be read, short enough that the
 *  button is back to its resting state before a reader looks again. */
const FEEDBACK_MS = 2000;

export function CopyCodeButton({ code, offerTitle, className }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A component unmounted inside the feedback window would otherwise set state on a
  // dead component — and a reader who taps two codes in quick succession would have
  // the first one's timer reset the second.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function copy() {
    let ok = false;

    /* `navigator.clipboard` is undefined outside a secure context and can reject even
       inside one when the document is not focused or permission is refused. The
       execCommand path is deprecated and still the only fallback that works in those
       cases, so it is tried second rather than not at all. */
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) {
      try {
        const field = document.createElement("textarea");
        field.value = code;
        // Kept out of the layout and off screen: a visible field would scroll the
        // page to itself when focused.
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.top = "-1000px";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        ok = document.execCommand("copy");
        document.body.removeChild(field);
      } catch {
        ok = false;
      }
    }

    // Only confirm what actually happened. A "Copied" that did not copy is worse
    // than no feedback, because the reader stops trying.
    if (!ok) return;

    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), FEEDBACK_MS);
  }

  return (
    <div className={cn("mt-4", className)}>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        Code
      </p>

      <button
        type="button"
        onClick={copy}
        aria-label={
          copied
            ? `Code ${code} copied`
            : `Copy code ${code} for ${offerTitle}`
        }
        className={cn(
          "mt-1.5 flex w-full items-center justify-between gap-2 rounded-sm border border-dashed px-2.5 py-2",
          "font-mono text-xs font-semibold tracking-wide transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
          copied
            ? "border-accent/60 bg-accent/10 text-accent"
            : "border-border text-foreground hover:border-accent/40 hover:bg-accent/5",
        )}
      >
        {/* `truncate` needs a min-width floor: a flex item's automatic minimum is its
            content width, so without this the longest code widens the card instead of
            ellipsing inside it. */}
        <span className="min-w-0 truncate">{code}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
        )}
      </button>

      {/* The visual confirmation is a colour and an icon swap, neither of which a
          screen reader reports. The button's own name changes too, but that is only
          announced if focus moves — so the state is mirrored here, where a polite
          live region will read it out where it happens. */}
      <span aria-live="polite" className="sr-only">
        {copied ? `Code ${code} copied to clipboard` : ""}
      </span>
    </div>
  );
}
