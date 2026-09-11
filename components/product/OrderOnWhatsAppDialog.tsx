"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MessageCircle, X } from "lucide-react";
import type { CheckoutDetails, CheckoutErrors, Order } from "@/types/cart";
import { validateCheckout, hasErrors } from "@/lib/orders/validate";
import { normaliseEngraving } from "@/data/bat-options";
import { buildOrderMessage } from "@/lib/orders/message";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* Order a single bat over WhatsApp, with the details collected first.
 *
 * The button this replaces opened WhatsApp with two lines — a product name and a
 * price — which told the shop what was wanted but nothing about who wanted it, what
 * spec, or where it was going. Every one of those conversations then had to be had by
 * hand. This asks the same questions the checkout asks, creates the same order, and
 * hands over the same message.
 *
 * ── It is not a second checkout ──
 * The address fields are re-declared here, but nothing that decides anything is:
 * `validateCheckout` and `/api/orders` are the shared pieces, so the rules about what
 * a valid phone number is, and what an order costs, have exactly one definition. The
 * server re-prices from its own catalogue — this request carries a slug and a
 * quantity, never a figure — so nothing here can be talked into a discount.
 *
 * ── Why the order exists before WhatsApp opens ──
 * Same reason as checkout: WhatsApp may never open. It can be missing, blocked, or
 * simply closed on the way. An order that exists on the server first survives all
 * three, and the customer still has a reference to quote.
 *
 * ── Why it does not auto-open WhatsApp ──
 * `window.open()` after an `await` has lost the user's click gesture and iOS Safari
 * blocks it, which would strand the customer on a spinner having already been
 * charged nothing but having placed a real order. So success renders the reference
 * and a link they tap themselves — one deliberate gesture, no popup blocker, and the
 * order number stays on screen if they never tap it.
 */

const EMPTY: CheckoutDetails = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pin: "",
  notes: "",
  couponCode: "",
  engraving: "",
};

interface Props {
  slug: string;
  name: string;
  /** The configured spec, when the product has one. Passed straight to the server,
   *  which validates every option id against its own catalogue. */
  options?: Record<string, string>;
  engraving?: string;
  className?: string;
}

export function OrderOnWhatsAppDialog({
  slug,
  name,
  options,
  engraving = "",
  className,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  // showModal() rather than the open attribute: it is what puts the dialog in the top
  // layer, traps focus and makes the page behind it inert, none of which are worth
  // rebuilding by hand.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  const set = (key: keyof CheckoutDetails) => (value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);

    const local = validateCheckout(details);
    if (hasErrors(local)) {
      setErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          engraving: normaliseEngraving(engraving),
          /* One line, no price. Identical in shape to what the checkout sends, so the
             server cannot tell the two paths apart and neither can drift. */
          lines: [
            {
              slug,
              qty: 1,
              options,
              engraving: normaliseEngraving(engraving),
            },
          ],
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (body?.fieldErrors) setErrors(body.fieldErrors);
        setFailure(body?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setOrder(body.order as Order);
    } catch {
      setFailure(
        "We couldn't reach the server. Check your connection, or message us on WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "outline", size: "lg", className })}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Order on WhatsApp
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        // A dialog reports a backdrop click as a click on itself, so comparing the
        // point against its own box is what separates "clicked outside" from
        // "clicked a control inside".
        onClick={(event) => {
          const box = ref.current?.getBoundingClientRect();
          if (!box) return;
          const outside =
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom;
          if (outside) setOpen(false);
        }}
        className="w-[min(92vw,34rem)] rounded-xl border border-white/10 bg-surface-card p-0 text-foreground backdrop:bg-black/70"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
          {order ? (
            /* ── Placed ── */
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/15">
                <Check className="size-6 text-accent" aria-hidden="true" />
              </span>
              {/* Not "Order received": nobody at the shop has received anything at
                  this point. The order is saved and waiting, and the next tap is what
                  puts it in front of a person — so the heading says that. */}
              <h2 className="heading-sm mt-5">Your order is saved</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Reference{" "}
                <span className="font-semibold text-foreground">{order.orderId}</span>.
                Send it on WhatsApp to reach us — we&apos;ll confirm availability and
                the final total including shipping.
              </p>
              <a
                href={buildWhatsAppUrl(buildOrderMessage(order))}
                target="_blank"
                rel="noopener noreferrer"
                // Records that WhatsApp was opened, so an order that stops here is
                // visible to the shop as one to chase. Fire-and-forget on purpose:
                // the customer is mid-navigation to WhatsApp and must never be held
                // up, or shown an error, because a piece of our bookkeeping failed.
                onClick={() => {
                  void fetch("/api/orders/opened", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.orderId }),
                    keepalive: true,
                  }).catch(() => {});
                }}
                className={buttonClass({
                  variant: "primary",
                  size: "lg",
                  className: "mt-6 w-full",
                })}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Send on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Details ── */
            <form onSubmit={submit} noValidate>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="heading-sm">Order on WhatsApp</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {name} — we&apos;ll confirm availability and shipping.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                <Field id="w-fullName" label="Full name" value={details.fullName}
                  onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-phone" label="Phone" value={details.phone} type="tel"
                    onChange={set("phone")} error={errors.phone} autoComplete="tel" />
                  <Field id="w-email" label="Email (optional)" value={details.email} type="email"
                    onChange={set("email")} error={errors.email} autoComplete="email" />
                </div>
                <Field id="w-address1" label="Address" value={details.addressLine1}
                  onChange={set("addressLine1")} error={errors.addressLine1}
                  autoComplete="address-line1" />
                <Field id="w-address2" label="Area, landmark (optional)" value={details.addressLine2}
                  onChange={set("addressLine2")} error={errors.addressLine2}
                  autoComplete="address-line2" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field id="w-city" label="City" value={details.city}
                    onChange={set("city")} error={errors.city} autoComplete="address-level2" />
                  <Field id="w-state" label="State" value={details.state}
                    onChange={set("state")} error={errors.state} autoComplete="address-level1" />
                  <Field id="w-pin" label="PIN" value={details.pin} inputMode="numeric"
                    onChange={set("pin")} error={errors.pin} autoComplete="postal-code" />
                </div>
                <Field id="w-notes" label="Notes (optional)" value={details.notes}
                  onChange={set("notes")} error={errors.notes} />
              </div>

              {failure && (
                <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {failure}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={buttonClass({
                  variant: "primary",
                  size: "lg",
                  className: "mt-6 w-full disabled:pointer-events-none disabled:opacity-60",
                })}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Placing order
                  </>
                ) : (
                  <>
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Continue to WhatsApp
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Nothing is charged here. We confirm the total with you on WhatsApp.
              </p>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-1.5 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent",
          error ? "border-red-500/60" : "border-white/10",
        )}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
