"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  slug: string;
  /** Named in the accessible label. "Add to cart" repeated down a grid of forty cards
   *  tells a screen-reader user nothing about which one they are on. */
  name: string;
  /** Replaces the default button skin entirely. The product card has its own glass
   *  treatment that predates the cart and should survive it, so this component owns
   *  the *behaviour* — add, confirm, reset — and lets the caller own the look. */
  className?: string;
  size?: "sm" | "md" | "lg";
}

const FEEDBACK_MS = 1800;

export function AddToCartButton({
  slug,
  name,
  className,
  size = "md",
}: AddToCartButtonProps) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      // The label carries the state, because the only other signal that anything
      // happened is an icon swap and a word — neither of which is announced.
      aria-label={added ? `${name} added to cart` : `Add ${name} to cart`}
      className={cn(className ?? buttonClass({ variant: "primary", size }))}
      onClick={(event) => {
        /* This sits inside the card, which is a lattice of links to the product page.
           Without these two a tap both adds the item and navigates away, so the cart
           updates on a screen the customer never sees. */
        event.preventDefault();
        event.stopPropagation();
        add(slug);
        setAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), FEEDBACK_MS);
      }}
    >
      {added ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          Added
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden="true" />
          Add to cart
        </>
      )}
    </button>
  );
}
