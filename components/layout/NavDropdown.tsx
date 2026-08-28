"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavItem } from "@/types/commerce";
import { cn } from "@/lib/utils";

/* ── One grouped item in the desktop nav row ───────────────────────────────────────
 *
 * Exists because the row ran out of width, not because a menu was wanted: eight
 * top-level items need 729px of the 730px available at 1024px, and before the grouping
 * three of the labels were already wrapping onto two lines inside a 64px bar. Three
 * categories behind one trigger costs 285px of that budget.
 *
 * Click to toggle, not hover to open. A hover menu is unusable on the touch laptops
 * and tablets that report a mouse and land in this breakpoint anyway, and a menu that
 * opens under a pointer merely passing through on its way to "Equipment" is noise. The
 * cost is one extra click for mouse users, which is the cheaper side of that trade.
 *
 * `triggerClassName` comes from the header rather than being repeated here. The trigger
 * has to be indistinguishable from the real links beside it — same type size, weight,
 * colour and padding — and the way to guarantee that is to use the same string, not a
 * copy of it that drifts the next time the row is restyled. */

interface NavDropdownProps {
  label: string;
  items: NavItem[];
  /** The sibling nav links' class. Passed in so there is a single source for it. */
  triggerClassName: string;
}

export function NavDropdown({ label, items, triggerClassName }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const panelId = useId();

  /* The trigger is marked active whenever any destination inside it is the current
     one, so a customer on the Hard Tennis Bat page can still see where they are from a
     collapsed row. Prefix match, so a future /categories/hard-tennis-bats/xyz keeps
     it lit. */
  const active = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      // Escape should leave focus somewhere sensible rather than on an element that
      // has just been removed from the document.
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    /* Back and forward are the one route change this component cannot infer from a
       gesture of its own: choosing a link in the panel closes it, and a click or a Tab
       anywhere else closes it through the two listeners above, but browser chrome and
       Alt+Left generate neither. Without this the panel would still be hanging open
       over the page the customer has just gone back to. */
    window.addEventListener("popstate", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", close);
    };
  }, [open, close]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      // Tabbing past the last link in the panel closes it. The pointerdown listener
      // above covers mice; this covers keyboards, which never generate one.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setOpen(true);
        }}
        className={cn(
          triggerClassName,
          "inline-flex items-center gap-1",
          (active || open) && "text-foreground",
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Conditionally rendered rather than hidden with opacity. An off-screen panel
          that is still in the document is still in the tab order, which puts three
          invisible links between "Bats" and "Equipment" for anyone navigating by
          keyboard. */}
      {open && (
        <div
          id={panelId}
          className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-md border border-border bg-surface/95 p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          <ul>
            {items.map((item) => {
              const itemActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={itemActive ? "page" : undefined}
                    className={cn(
                      "block rounded-sm px-3 py-2.5 text-[13px] font-medium transition-colors",
                      itemActive
                        ? "bg-foreground/5 text-foreground"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
