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
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className="block rounded-sm px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
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
