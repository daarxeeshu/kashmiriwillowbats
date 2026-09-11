"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* Marks an order as actually received in the shop's WhatsApp.
 *
 * A client component only so the button can show it is working — the write itself is
 * the Server Action passed in, which runs behind the same middleware that guards the
 * page. `useTransition` keeps the pending state tied to the server round trip rather
 * than a local boolean that can disagree with it.
 *
 * The wording matters: this is the one status a person sets, and it should read as a
 * statement about the inbox rather than about the website. */
export function ConfirmButton({
  orderId,
  action,
  className,
}: {
  orderId: string;
  action: (orderId: string) => Promise<void>;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action(orderId).then(() => undefined))}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Saving
        </>
      ) : (
        <>
          <Check className="size-4" aria-hidden="true" />
          I&apos;ve received this on WhatsApp
        </>
      )}
    </button>
  );
}
