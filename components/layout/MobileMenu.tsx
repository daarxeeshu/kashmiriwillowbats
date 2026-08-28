"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { mainNav } from "@/data/site-config";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/* Shared by top-level items and by the links inside a group, so a grouped category is
   the same size and the same tap target as an ungrouped one. `py-3` on a 14px line is a
   44px row, which is the floor for a thumb. */
const drawerLinkClass =
  "flex items-center justify-between gap-2 rounded-sm px-3 py-3 text-sm transition-colors";

const drawerLinkPlainClass =
  "font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground";

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
        onClick={onClose}
      />

      <nav
        id="mobile-menu"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(100%,18rem)] flex-col border-l border-border bg-surface transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-sm font-semibold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-3 py-3">
          {mainNav.map((entry) => {
            /* Groups are flattened here rather than collapsed behind another tap. The
               desktop row groups them because it has run out of horizontal space; a
               vertical drawer has none of that pressure, so every category stays one
               tap away and the group label becomes a heading instead of a control.
               That is also what keeps Hard Tennis Bat reachable on a phone. */
            if ("items" in entry) {
              return (
                <li key={entry.label}>
                  <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    {entry.label}
                  </p>
                  <ul>
                    {entry.items.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className={cn(drawerLinkClass, drawerLinkPlainClass)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  onClick={onClose}
                  className={cn(
                    drawerLinkClass,
                    entry.highlight
                      ? // Accent colour plus a word, not colour alone: "Repair" tells
                        // someone scanning the drawer what this item is for, which a
                        // gold tint on its own cannot.
                        "font-semibold text-accent hover:bg-accent-muted"
                      : drawerLinkPlainClass,
                  )}
                >
                  {entry.label}
                  {entry.highlight && (
                    <span className="shrink-0 rounded-sm border border-accent/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent/80">
                      Repair
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border p-4">
          <ButtonLink
            href={buildWhatsAppUrl(whatsappMessages.batExpert)}
            target="_blank"
            rel="noopener noreferrer"
            variant="expert"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Bat Expert on WhatsApp
          </ButtonLink>
        </div>
      </nav>
    </>
  );
}
