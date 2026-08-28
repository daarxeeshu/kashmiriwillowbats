"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./CartProvider";
import { MAX_QTY } from "@/lib/cart/totals";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/data/site-config";
import { formatPrice } from "@/lib/utils";
import { describeBatOptions } from "@/data/bat-options";

const stepper =
  "flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function CartView() {
  const { entries, totals, ready, setQty, remove } = useCart();

  /* Three states, not two. Until `ready` the stored cart has not been read, and
     rendering the empty state then would flash "your cart is empty" at someone who
     has items — the one moment this page must not get wrong. */
  if (!ready) {
    return (
      <Container className="section-padding">
        <div className="h-64 animate-pulse rounded-sm bg-surface-elevated" />
      </Container>
    );
  }

  if (entries.length === 0) {
    return (
      <Container className="section-padding">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
          <h1 className="heading-lg mt-6">Your cart is empty</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Browse the Kashmir Willow range and add a bat to get started.
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
      <h1 className="heading-lg">Your cart</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
        <ul className="divide-y divide-border border-y border-border">
          {entries.map(({ key, product, qty, lineTotal, options, engraving }) => (
            <li key={key} className="flex gap-4 py-5">
              <Link
                href={`/products/${product.slug}`}
                className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-sm bg-surface-elevated sm:w-24"
              >
                <SafeImage
                  src={product.image}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover object-center"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {product.brandName && (
                      <p className="text-xs font-medium text-accent">
                        {product.brandName}
                      </p>
                    )}
                    <h2 className="mt-0.5 truncate text-sm font-semibold">
                      <Link
                        href={`/products/${product.slug}`}
                        className="hover:underline"
                      >
                        {product.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPrice(product.price)} each
                    </p>

                    {/* The spec, because two rows of the same bat are otherwise
                        identical and the customer cannot tell which stepper is which. */}
                    {describeBatOptions(options).length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {describeBatOptions(options).map((o) => (
                          <li key={o.label} className="text-[11px] text-muted">
                            <span className="text-muted-foreground">{o.label}:</span>{" "}
                            {o.value}
                          </li>
                        ))}
                        {engraving && (
                          <li className="text-[11px] text-muted">
                            <span className="text-muted-foreground">Engraving:</span>{" "}
                            <span className="font-medium text-accent">{engraving}</span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatPrice(lineTotal)}
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={stepper}
                      aria-label={`Decrease quantity of ${product.name}`}
                      onClick={() => setQty(key, qty - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    {/* aria-live so the new value is announced after a stepper press —
                        the button keeps focus, so nothing else would say it changed. */}
                    <span
                      aria-live="polite"
                      className="w-8 text-center text-sm font-medium tabular-nums"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      className={stepper}
                      disabled={qty >= MAX_QTY}
                      aria-label={`Increase quantity of ${product.name}`}
                      onClick={() => setQty(key, qty + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(key)}
                    aria-label={`Remove ${product.name} from cart`}
                    className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-sm border border-border bg-surface-elevated p-5">
            <h2 className="text-sm font-semibold">Order summary</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">
                  {formatPrice(totals.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                {/* Not "Free". There is no shipping engine here and the rate depends
                    on where it goes, so the honest answer is that a person will say. */}
                <dd className="text-xs text-muted-foreground">
                  Confirmed on WhatsApp
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Engraving</dt>
                <dd className="text-xs">
                  {totals.engravingFree ? (
                    <span className="font-medium text-accent">
                      Free on this order
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {formatPrice(siteConfig.engraving.price)}, optional
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatPrice(totals.subtotal)}
              </p>
            </div>

            {!totals.engravingFree && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Add{" "}
                {formatPrice(siteConfig.engraving.freeThreshold - totals.subtotal)} more
                for free engraving.
              </p>
            )}

            <ButtonLink
              href="/checkout"
              variant="primary"
              size="lg"
              className="mt-5 w-full"
            >
              Checkout
            </ButtonLink>

            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              No payment is taken online. You confirm the order with us on WhatsApp.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
