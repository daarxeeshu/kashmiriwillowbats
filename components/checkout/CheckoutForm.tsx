"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, MessageCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { buildOrderMessage } from "@/lib/orders/message";
import { validateCheckout, hasErrors } from "@/lib/orders/validate";
import { applyCoupon, type AppliedCoupon } from "@/lib/orders/coupon";
import {
  ENGRAVING_MAX,
  engravingError,
  normaliseEngraving,
} from "@/data/bat-options";
import { siteConfig } from "@/data/site-config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import type { CheckoutDetails, CheckoutErrors, Order } from "@/types/cart";
import { cn } from "@/lib/utils";

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

const field =
  "w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50";

function Field({
  id,
  label,
  value,
  onChange,
  error,
  optional,
  ...rest
}: {
  id: keyof CheckoutDetails;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
        {optional && <span className="ml-1 text-muted">(optional)</span>}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Announced together: the message is tied to the input rather than floating
        // near it, and the field is marked invalid so it is reachable by "next error".
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(field, error && "border-danger focus:border-danger", "mt-1.5")}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const { entries, totals, ready, clear } = useCart();
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  /* The applied *code*, not the applied discount.

     The discount is a function of the code and the cart, so holding it in state means
     keeping two things in step — which is what the effect here used to do, re-running
     `applyCoupon` whenever the cart moved and writing the answer back. Deriving it
     removes the effect and the whole class of bug where the summary shows a figure
     that no longer follows from what is in the cart. */
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  /** Only for a failed *attempt* — an invalidation message is derived below. */
  const [attemptNote, setAttemptNote] = useState<string | null>(null);

  /* The toggle is UI state only — the data has one representation of "no engraving",
     which is an empty string. A boolean stored alongside the text could disagree with
     it, and then the order and the form would each have a different answer. */
  const [engravingOn, setEngravingOn] = useState(false);
  const engravingProblem = engravingOn ? engravingError(details.engraving) : null;
  const engravingLeft = ENGRAVING_MAX - normaliseEngraving(details.engraving).length;
  const engravingFree = totals.subtotal >= siteConfig.engraving.freeThreshold;
  const errorRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof CheckoutDetails) => (value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    // Clear this field's error as soon as it is edited. Leaving it until the next
    // submit means the reader fixes something and is still told it is wrong.
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  /* Re-evaluated against the live cart on every render, so a code that stops
     qualifying — the cart edited here or in another tab — stops applying immediately
     and says why. This is the same check the server runs on submit; what is shown here
     is a preview, and the discount recorded on the order is the server's own. */
  const couponResult = useMemo(
    () =>
      appliedCode ? applyCoupon(appliedCode, entries, totals.subtotal) : null,
    [appliedCode, entries, totals.subtotal],
  );

  const coupon: AppliedCoupon | null =
    couponResult && couponResult.ok ? couponResult.coupon : null;

  // An invalidation outranks a stale attempt message: it describes the code that is
  // actually applied right now.
  const couponNote =
    couponResult && !couponResult.ok ? couponResult.reason : attemptNote;

  function tryCoupon() {
    const result = applyCoupon(details.couponCode, entries, totals.subtotal);
    if (!result.ok) {
      setAppliedCode(null);
      setAttemptNote(result.reason);
      return;
    }
    setAppliedCode(details.couponCode);
    setAttemptNote(null);
    setErrors((e) => ({ ...e, couponCode: undefined }));
  }

  function dropCoupon() {
    setAppliedCode(null);
    setAttemptNote(null);
    setDetails((d) => ({ ...d, couponCode: "" }));
  }

  // Move focus to the summary when a submit fails, so a keyboard or screen-reader
  // user is told what happened instead of being left where they pressed the button.
  useEffect(() => {
    if (failure || hasErrors(errors)) errorRef.current?.focus();
  }, [failure, errors]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);

    const local = validateCheckout(details);
    if (hasErrors(local)) {
      setErrors(local);
      return;
    }
    if (engravingProblem) {
      setErrors((e) => ({ ...e, engraving: engravingProblem }));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          // Off means none, whatever is sitting in the field.
          engraving: engravingOn ? normaliseEngraving(details.engraving) : "",
          /* Slugs, quantities and the spec — no prices. The server re-prices from its
             own catalogue and re-validates every option id, so what travels here is
             *what* was ordered and never what it costs. */
          lines: entries.map((e) => ({
            slug: e.product.slug,
            qty: e.qty,
            options: e.options,
            engraving: e.engraving,
          })),
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (body?.fieldErrors) setErrors(body.fieldErrors);
        setFailure(body?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setOrder(body.order as Order);
      // Cleared only after the order exists on the server, never before: a failed
      // request that had already emptied the cart would lose the whole basket.
      clear();
    } catch {
      setFailure(
        "We couldn't reach the server. Check your connection, or message us on WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Confirmation ── */
  if (order) {
    return (
      <Container className="section-padding">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
            <Check className="h-6 w-6 text-accent" aria-hidden="true" />
          </span>
          <h1 className="heading-lg mt-6">Order received</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Your reference is{" "}
            <span className="font-mono font-semibold text-foreground">
              {order.orderId}
            </span>
            . Send it to us on WhatsApp and we will confirm availability, engraving and
            the final total including shipping.
          </p>

          {/* The actual delivery step. Nothing is charged here, so the order is not
              really placed until this message is sent — the copy says so rather than
              implying a warehouse has been notified. */}
          <ButtonLink
            href={buildWhatsAppUrl(buildOrderMessage(order))}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="lg"
            className="mt-8 w-full sm:w-auto"
          >
            <MessageCircle className="h-4 w-4" />
            Send order on WhatsApp
          </ButtonLink>

          <div className="mt-8 rounded-sm border border-border bg-surface-elevated p-5 text-left">
            <h2 className="text-sm font-semibold">
              {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.lines.map((l, index) => (
                <li key={index} className="flex justify-between gap-4">
                  <span className="min-w-0 text-muted-foreground">
                    {l.brandName ? `${l.brandName} ${l.name}` : l.name} x{l.qty}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatPrice(l.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            {/* The order's own figures, not the form's — this is what was recorded. */}
            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              {order.coupon && (
                <div className="flex justify-between text-accent">
                  <span>
                    {order.coupon.code} ({order.coupon.label})
                  </span>
                  <span className="tabular-nums">
                    {order.discount > 0 ? `-${formatPrice(order.discount)}` : "—"}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Read back from the order, not the form: this is what the server
                recorded and what the WhatsApp message will carry. */}
            {order.engraving && (
              <p className="mt-3 text-sm text-muted-foreground">
                Name engraving:{" "}
                <span className="font-mono font-semibold text-accent">
                  &ldquo;{order.engraving}&rdquo;
                </span>
              </p>
            )}
          </div>

          <Link
            href="/categories/kashmir-willow-bats"
            className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </Container>
    );
  }

  if (!ready) {
    return (
      <Container className="section-padding">
        <div className="h-64 animate-pulse rounded-sm bg-surface-elevated" />
      </Container>
    );
  }

  /* An empty cart cannot be checked out, and arriving here with one usually means a
     bookmark or a back-navigation after ordering rather than a mistake. */
  if (entries.length === 0) {
    return (
      <Container className="section-padding">
        <div className="mx-auto max-w-md text-center">
          <h1 className="heading-lg">Nothing to check out</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Your cart is empty. Add a bat and come back.
          </p>
          <ButtonLink
            href="/categories/kashmir-willow-bats"
            variant="primary"
            size="lg"
            className="mt-8"
          >
            Shop bats
          </ButtonLink>
        </div>
      </Container>
    );
  }

  return (
    <Container className="section-padding">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to cart
      </Link>

      <h1 className="heading-lg mt-4">Checkout</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        We take no payment online. Give us your delivery details and we will confirm
        everything with you on WhatsApp.
      </p>

      <form onSubmit={submit} noValidate className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
          <div className="space-y-5">
            <div
              ref={errorRef}
              tabIndex={-1}
              aria-live="assertive"
              className="outline-none"
            >
              {failure && (
                <p className="rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  {failure}
                </p>
              )}
            </div>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold">Contact</legend>
              <Field
                id="fullName"
                label="Full name"
                value={details.fullName}
                onChange={set("fullName")}
                error={errors.fullName}
                autoComplete="name"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="phone"
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  value={details.phone}
                  onChange={set("phone")}
                  error={errors.phone}
                  autoComplete="tel"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  optional
                  value={details.email}
                  onChange={set("email")}
                  error={errors.email}
                  autoComplete="email"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold">Delivery address</legend>
              <Field
                id="addressLine1"
                label="Address"
                value={details.addressLine1}
                onChange={set("addressLine1")}
                error={errors.addressLine1}
                autoComplete="address-line1"
              />
              <Field
                id="addressLine2"
                label="Apartment, landmark"
                optional
                value={details.addressLine2}
                onChange={set("addressLine2")}
                error={errors.addressLine2}
                autoComplete="address-line2"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  id="city"
                  label="City"
                  value={details.city}
                  onChange={set("city")}
                  error={errors.city}
                  autoComplete="address-level2"
                />
                <Field
                  id="state"
                  label="State"
                  value={details.state}
                  onChange={set("state")}
                  error={errors.state}
                  autoComplete="address-level1"
                />
                <Field
                  id="pin"
                  label="PIN code"
                  inputMode="numeric"
                  value={details.pin}
                  onChange={set("pin")}
                  error={errors.pin}
                  autoComplete="postal-code"
                />
              </div>
            </fieldset>

            {/* ── Name engraving ────────────────────────────────────────────────
                A switch rather than a checkbox styled to look like one: `role="switch"`
                with `aria-checked` is what tells a screen reader this is on/off rather
                than "selected", and the whole control is one tab stop.

                The text field is not rendered at all while it is off — a disabled
                input that still shows what you typed invites the reader to believe it
                will be engraved. Turning it off clears the text for the same reason.

                Any per-bat engraving chosen on a product page is separate and travels
                on that cart line; this is the instruction for the order as a whole,
                which is what the note below says out loud so the two cannot be read as
                contradicting each other. */}
            <fieldset className="rounded-sm border border-border bg-surface-elevated p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <legend className="text-sm font-semibold">Name engraving</legend>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Laser-engraved in-house before dispatch.{" "}
                    <span className={engravingFree ? "text-accent" : undefined}>
                      {engravingFree
                        ? "Free on this order."
                        : `${formatPrice(siteConfig.engraving.price)}, or free above ${formatPrice(siteConfig.engraving.freeThreshold)}.`}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={engravingOn}
                  aria-label="Add name engraving"
                  onClick={() => {
                    const next = !engravingOn;
                    setEngravingOn(next);
                    // Off clears the text: the data must not carry an instruction the
                    // control says is switched off.
                    if (!next) {
                      setDetails((d) => ({ ...d, engraving: "" }));
                      setErrors((e) => ({ ...e, engraving: undefined }));
                    }
                  }}
                  className={cn(
                    "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
                    engravingOn
                      ? "border-accent/60 bg-accent/30"
                      : "border-border bg-background",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-block size-4 rounded-full transition-transform duration-200",
                      engravingOn
                        ? "translate-x-[22px] bg-accent"
                        : "translate-x-[3px] bg-muted",
                    )}
                  />
                </button>
              </div>

              {engravingOn && (
                <div className="mt-4">
                  <label
                    htmlFor="engraving"
                    className="block text-xs font-medium text-muted-foreground"
                  >
                    Text to engrave
                  </label>
                  <input
                    id="engraving"
                    name="engraving"
                    value={details.engraving}
                    onChange={(e) =>
                      set("engraving")(e.target.value.slice(0, ENGRAVING_MAX))
                    }
                    maxLength={ENGRAVING_MAX}
                    placeholder="e.g. A. KHAN"
                    autoComplete="off"
                    aria-invalid={
                      engravingProblem || errors.engraving ? true : undefined
                    }
                    aria-describedby="engraving-help"
                    className={cn(
                      field,
                      "mt-1.5 font-mono uppercase",
                      (engravingProblem || errors.engraving) &&
                        "border-danger focus:border-danger",
                    )}
                  />
                  {/* One element for the counter and the error, so the field never
                      carries two messages disagreeing about what is wrong. */}
                  <p
                    id="engraving-help"
                    aria-live="polite"
                    className={cn(
                      "mt-1.5 text-xs",
                      engravingProblem || errors.engraving
                        ? "text-danger"
                        : "text-muted-foreground",
                    )}
                  >
                    {engravingProblem ??
                      errors.engraving ??
                      `${engravingLeft} of ${ENGRAVING_MAX} characters left`}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    Applies to this order. Bats you configured with their own engraving
                    on the product page keep that text.
                  </p>
                </div>
              )}
            </fieldset>

            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-medium text-muted-foreground"
              >
                Notes <span className="ml-1 text-muted">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={details.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="Bat weight, engraving name, delivery timing…"
                className={cn(field, "mt-1.5 resize-y")}
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-border bg-surface-elevated p-5">
              <h2 className="text-sm font-semibold">
                {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
              </h2>

              <ul className="mt-3 space-y-2 text-sm">
                {entries.map(({ key, product, qty, lineTotal }) => (
                  <li key={key} className="flex justify-between gap-4">
                    <span className="min-w-0 text-muted-foreground">
                      {product.name} x{qty}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatPrice(lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(totals.subtotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-accent">
                    <span>
                      {coupon.code}{" "}
                      <span className="text-muted-foreground">({coupon.label})</span>
                    </span>
                    <span className="tabular-nums">
                      {coupon.discount > 0 ? `-${formatPrice(coupon.discount)}` : "—"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total</span>
                  <span className="text-lg tabular-nums">
                    {formatPrice(
                      Math.max(0, totals.subtotal - (coupon?.discount ?? 0)),
                    )}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {coupon?.freeShipping
                  ? "Free shipping applied. Confirmed on WhatsApp."
                  : "Shipping confirmed on WhatsApp."}
              </p>

              {/* Discount code. `Apply` is a button rather than relying on the form's
                  submit, and Enter here is intercepted for the same reason: pressing
                  Enter in a text input submits the form it sits in, which would place
                  the order instead of applying the code. */}
              <div className="mt-4 border-t border-border pt-4">
                <label
                  htmlFor="couponCode"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Discount code <span className="ml-1 text-muted">(optional)</span>
                </label>

                {coupon ? (
                  <div className="mt-1.5 flex items-center justify-between gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-2">
                    <span className="font-mono text-xs font-semibold text-accent">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={dropCoupon}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="couponCode"
                      name="couponCode"
                      value={details.couponCode}
                      onChange={(e) => set("couponCode")(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          tryCoupon();
                        }
                      }}
                      placeholder="KISFIRSTORDER"
                      aria-invalid={couponNote ? true : undefined}
                      aria-describedby={couponNote ? "couponCode-note" : undefined}
                      className={cn(field, "font-mono uppercase")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={tryCoupon}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                )}

                {(couponNote || errors.couponCode) && (
                  <p
                    id="couponCode-note"
                    aria-live="polite"
                    className="mt-1.5 text-xs text-danger"
                  >
                    {couponNote ?? errors.couponCode}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                className="mt-5 w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Placing order…
                  </>
                ) : (
                  "Place order"
                )}
              </Button>
            </div>
          </aside>
        </div>
      </form>
    </Container>
  );
}
