"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ShoppingBag } from "lucide-react";
import {
  BAT_OPTION_GROUPS,
  ENGRAVING_MAX,
  defaultBatOptions,
  engravingError,
  normaliseEngraving,
} from "@/data/bat-options";
import { useCart } from "@/components/cart/CartProvider";
import { buttonClass } from "@/components/ui/Button";
import { siteConfig } from "@/data/site-config";
import { cn, formatPrice } from "@/lib/utils";

/* ── Configuring a made-to-order bat ─────────────────────────────────────────────
 *
 * Native `<select>`, deliberately, and not a custom listbox. On a phone this opens the
 * platform picker — a wheel on iOS, a full-height sheet on Android — which is bigger,
 * faster and more familiar than anything rebuilt in a div, and it comes with keyboard
 * support, type-ahead and screen-reader semantics already correct. A custom control
 * would be a lot of code to arrive somewhere worse.
 *
 * Every group has a default, so this is never a gate: a customer who reads none of it
 * still adds a properly specified bat. The choices travel on the cart line, so the
 * same bat in two specs is two lines — see `lineKey`.
 */

interface BatOptionsPickerProps {
  slug: string;
  name: string;
  price: number;
}

export function BatOptionsPicker({ slug, name, price }: BatOptionsPickerProps) {
  const { add } = useCart();
  const [options, setOptions] = useState<Record<string, string>>(defaultBatOptions);
  const [engraving, setEngraving] = useState("");
  /* The spec that was last added, rather than a boolean.

     "Added" is not independent state — it is the question "is what is on screen still
     what I added?", so it is derived by comparing the two. A boolean would need an
     effect to reset it whenever a dropdown moved, which is a cascading render and a
     chance for the button to sit on a stale confirmation for a frame. */
  const [addedSpec, setAddedSpec] = useState<string | null>(null);

  const engravingProblem = engravingError(engraving);
  const cleanEngraving = normaliseEngraving(engraving);
  const currentSpec = JSON.stringify([options, cleanEngraving]);
  const added = addedSpec === currentSpec;
  const remaining = ENGRAVING_MAX - cleanEngraving.length;

  // Engraving is free above the threshold, and this is the one place the customer is
  // deciding whether to have it — so the price is stated here rather than only in the
  // marketing section further down the page.
  const engravingFree = price >= siteConfig.engraving.freeThreshold;

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {BAT_OPTION_GROUPS.map((group) => (
          <div key={group.id}>
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor={`opt-${group.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {group.label}
              </label>
              {/* Only against size — it is the one choice a buyer can get objectively
                  wrong, and the only one with a chart to consult. */}
              {group.id === "size" && (
                <Link
                  href="/size-guide"
                  className="text-xs font-medium text-accent underline-offset-2 hover:underline"
                >
                  Size guide
                </Link>
              )}
            </div>

            {/* The chevron is decorative and `pointer-events-none`, so the whole box
                stays the select's own hit area rather than the arrow swallowing taps. */}
            <div className="relative mt-1.5">
              <select
                id={`opt-${group.id}`}
                value={options[group.id]}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, [group.id]: e.target.value }))
                }
                className="w-full appearance-none rounded-sm border border-border bg-background px-3 py-2.5 pr-9 text-sm text-foreground outline-none transition-colors focus:border-accent/50"
              >
                {group.values.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor="engraving"
            className="text-xs font-medium text-muted-foreground"
          >
            Laser engraving <span className="text-muted">(optional)</span>
          </label>
          <span className="text-xs text-muted">
            {engravingFree ? "Free" : formatPrice(siteConfig.engraving.price)}
          </span>
        </div>

        <input
          id="engraving"
          value={engraving}
          onChange={(e) => setEngraving(e.target.value.slice(0, ENGRAVING_MAX))}
          maxLength={ENGRAVING_MAX}
          placeholder="Name on the bat"
          aria-invalid={engravingProblem ? true : undefined}
          aria-describedby="engraving-help"
          className={cn(
            "mt-1.5 w-full rounded-sm border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted",
            engravingProblem
              ? "border-danger focus:border-danger"
              : "border-border focus:border-accent/50",
          )}
        />

        {/* One element for the counter and the error, so the field never has two
            messages under it disagreeing about how much room is left. */}
        <p
          id="engraving-help"
          aria-live="polite"
          className={cn(
            "mt-1.5 text-xs",
            engravingProblem ? "text-danger" : "text-muted-foreground",
          )}
        >
          {engravingProblem ?? `${remaining} of ${ENGRAVING_MAX} characters left`}
        </p>
      </div>

      <button
        type="button"
        disabled={Boolean(engravingProblem)}
        aria-label={added ? `${name} added to cart` : `Add ${name} to cart`}
        className={buttonClass({
          variant: "primary",
          size: "lg",
          className: "mt-5 w-full disabled:pointer-events-none disabled:opacity-50",
        })}
        onClick={() => {
          if (engravingProblem) return;
          add(slug, 1, { options, engraving: cleanEngraving });
          // No timer: this button sits beside the choices it committed, so flipping
          // back on a clock would suggest the add came undone. It simply stops reading
          // "Added" once the spec no longer matches what was added.
          setAddedSpec(currentSpec);
        }}
      >
        {added ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            Added to cart
          </>
        ) : (
          <>
            <ShoppingBag className="size-4" aria-hidden="true" />
            Add to cart
          </>
        )}
      </button>

    </div>
  );
}
