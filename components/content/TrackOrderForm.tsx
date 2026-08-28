"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SHIPPING_STATUS_LABEL, SHIPPING_STEPS } from "@/types/shipping";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ── Order tracking, before there is anything to track ───────────────────────────
 *
 * The lookup is real UI against a real shape — order reference plus one contact
 * detail, which is what stops an order id on its own revealing somebody's address.
 * What does not exist is the thing behind it: there is no database, no order store and
 * no admin, so nothing can be looked up.
 *
 * So the form submits to nothing and says so. It does not spin, it does not return a
 * fabricated "Shipped — out for delivery", and there is no sample order wired in
 * behind a flag waiting to be shown to a real customer by accident. The status ladder
 * below is rendered as a legend of the stages an order passes through — labelled as
 * such — because that is genuinely useful now and is the same list the connected
 * version will highlight one step of.
 *
 * When the backend arrives: replace `onSubmit` with a call to the lookup endpoint and
 * render the returned `OrderShipping` against `SHIPPING_STEPS`. Nothing else here
 * changes shape.
 */

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const field =
    "w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50";

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
        className="rounded-sm border border-border bg-surface-elevated p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="orderId"
              className="block text-xs font-medium text-muted-foreground"
            >
              Order reference
            </label>
            <input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="KWB-2026-XXXX"
              className={cn(field, "mt-1.5 font-mono uppercase")}
            />
          </div>
          <div>
            <label
              htmlFor="contact"
              className="block text-xs font-medium text-muted-foreground"
            >
              Phone or email on the order
            </label>
            <input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Used to verify the order is yours"
              className={cn(field, "mt-1.5")}
            />
          </div>
        </div>

        <button
          type="submit"
          className={buttonClass({
            variant: "primary",
            size: "lg",
            className: "mt-4 w-full sm:w-auto",
          })}
        >
          <Search className="size-4" aria-hidden="true" />
          Find my order
        </button>

        {/* The honest result. `aria-live` so it is announced rather than silently
            appearing under a button that looked like it searched. */}
        <div aria-live="polite">
          {submitted && (
            <p className="mt-4 rounded-sm border border-dashed border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
              Online tracking is not connected yet — there is no order lookup behind
              this form, so nothing was searched. Send us your order reference on
              WhatsApp or by email and we will tell you exactly where it is.
            </p>
          )}
        </div>
      </form>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">
          The stages an order passes through
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This is the sequence, not the status of any particular order.
        </p>

        <ol className="mt-5 space-y-0">
          {SHIPPING_STEPS.map((step, index) => (
            <li key={step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-muted"
                >
                  {index + 1}
                </span>
                {/* The rail between markers, absent on the last so the list does not
                    trail into nothing. */}
                {index < SHIPPING_STEPS.length - 1 && (
                  <span aria-hidden="true" className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pb-6">
                <p className="text-sm font-medium text-foreground">
                  {SHIPPING_STATUS_LABEL[step]}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {STEP_COPY[step]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

const STEP_COPY: Record<(typeof SHIPPING_STEPS)[number], string> = {
  confirmed: "We have your order and have agreed it with you.",
  processing:
    "The bat is being picked and checked. Anything made to order is prepared at this stage.",
  packed: "Packed with toe protection and a cover, ready for the courier.",
  shipped:
    "Handed to the courier. This is when we record the courier, the tracking number and the slip against your order.",
  out_for_delivery: "With the delivery rider for the final leg.",
  delivered: "Signed for at the delivery address.",
};
