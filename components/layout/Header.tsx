"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { mainNav, siteConfig } from "@/data/site-config";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinkClass =
    "px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-300",
          scrolled
            ? "border-border bg-surface/90 shadow-[0_1px_0_rgba(28,27,25,0.04)] backdrop-blur-md"
            : "border-transparent bg-surface",
        )}
      >
        <div className="container-main flex h-[var(--header-height)] items-center gap-6">
          <Link
            href="/"
            className="shrink-0 leading-tight"
            aria-label={`${siteConfig.name} home`}
          >
            <span className="block text-[15px] font-bold tracking-tight text-foreground">
              Kashmiri Willow Bats
            </span>
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ButtonLink
              href={buildWhatsAppUrl(whatsappMessages.batExpert)}
              target="_blank"
              rel="noopener noreferrer"
              variant="expert"
              size="sm"
              className="hidden md:inline-flex"
            >
              <MessageCircle className="h-4 w-4" />
              Bat Expert
            </ButtonLink>

            <Link href="/search" className={iconButtonClass} aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/account"
              className={cn(iconButtonClass, "hidden sm:flex")}
              aria-label="Account"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/wishlist"
              className={cn(iconButtonClass, "hidden sm:flex")}
              aria-label="Wishlist"
            >
              <Heart className="h-[18px] w-[18px]" />
            </Link>
            <Link href="/cart" className={iconButtonClass} aria-label="Cart">
              <ShoppingBag className="h-[18px] w-[18px]" />
            </Link>

            <button
              type="button"
              className={cn(iconButtonClass, "lg:hidden")}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
