"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  Stethoscope,
  User,
} from "lucide-react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CartCount, useCartLabel } from "@/components/cart/CartCount";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { mainNav, siteConfig } from "@/data/site-config";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import logoMark from "@/public/brand/logo.png";

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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

  /* `whitespace-nowrap` is load-bearing, not cosmetic. The nav is a `flex-1` child, so
     under pressure a link's box is squeezed to its min-content width and the label
     wraps — which is how "Kashmir Willow", "English Willow" and "Bat Doctor" all ended
     up on two lines inside a 64px bar at 1024px. Refusing to wrap means the row asks
     for its true width instead, which is the number the grouping in `mainNav` was
     measured against. */
  /* Left at `px-3` deliberately, and it is worth recording why tightening it is not
     the lever it looks like. This row is `flex-1`, i.e. `flex-basis: 0%` — it does not
     contribute its content width to the row's base size, it grows into whatever is
     left over. Narrowing these items therefore hands the space straight back to the
     row and never reaches the logo lock-up beside it: measured at 1024px, dropping all
     five to `px-2` moved the lock-up by exactly 0px. Only the fixed-width action
     cluster and the container gap are real levers here. */
  const navLinkClass =
    "whitespace-nowrap px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground";

  /* A highlighted entry is one that sells labour rather than stock — today Bat Doctor
     alone — and it is rendered as a button in the action cluster below, beside Bat
     Expert, rather than as a link in this row. So the row skips it: the button *is*
     its presence in the header, and carrying both would put two copies of one
     destination in a 64px bar. The flag still means "highlight" in the mobile drawer,
     which has no action cluster and gives it a badge instead. */
  const navEntries = mainNav.filter(
    (entry) => "items" in entry || (!entry.highlight && !entry.drawerOnly),
  );

  /** Count and label come from one hook so the badge and the link's accessible name
   *  can never describe different carts. */
  const cartLabel = useCartLabel();

  /* Shared by the two Bat Doctor controls below — the labelled pill from `md` and the
     icon button that stands in for it below that. They are the same destination at two
     widths, so they must agree about whether it is the current page. */
  const batDoctorActive =
    pathname === "/bat-doctor" || pathname.startsWith("/bat-doctor/");

  return (
    <>
      <header
        className={cn(
          // `site-header` is a styling hook for globals.css, which strips this
          // bar's surface over the home page's hero sequence and hands it glass
          // once the sequence settles. Those rules are unlayered so they outrank
          // the utilities below; the `scrolled` states here still govern every
          // other route.
          "site-header sticky top-0 z-40 border-b transition-all duration-300",
          scrolled
            ? "border-border bg-surface/90 shadow-[0_1px_0_rgba(28,27,25,0.04)] backdrop-blur-md"
            : "border-transparent bg-surface",
        )}
      >
        {/* The row's narrow-width budget, measured at 320px: 288px of content box
            after the container's padding, of which the icon cluster takes a fixed
            128px. A 24px gap plus a 192px logo lock-up needs 344 of the remaining
            160, so at 320px this row used to be 360px wide and the whole document
            scrolled sideways. The gap halves below 640px and the lock-up is allowed
            to shrink; see the wordmark below for what gives. */}
        <div className="container-main flex h-[var(--header-height)] items-center gap-3 sm:gap-6">
          <Link
            href="/"
            // `min-w-0`, not `shrink-0`. A flex item's automatic minimum size is
            // its min-content width, which is what made this lock-up
            // incompressible and pushed the row past the viewport.
            className="flex min-w-0 items-center gap-2.5 leading-tight"
            aria-label={`${siteConfig.name} home`}
          >
            <Image
              src={logoMark}
              // Decorative. The wordmark beside it and the link's aria-label
              // both already name the site, so real alt text here would have a
              // screen reader announce it three times over.
              alt=""
              // Fixed 40px box, so pin `sizes` to it — otherwise Next picks
              // from deviceSizes and ships a 640px-wide variant of a 512px
              // master for a 40px slot.
              sizes="40px"
              // In the sticky header on every route, so never lazy: without
              // this the mark pops in a beat after the wordmark.
              priority
              // The mark itself never yields — only the wordmark beside it does.
              className="h-10 w-10 shrink-0 rounded-md object-cover"
            />
            {/* One line down to 360px at 14px, then it wraps to "Kashmiri /
                Willow Bats" — two lines of 17.5px leading inside a 64px bar, which
                is a stacked lock-up rather than a broken one. Dropping the brand
                name entirely at 320px was the alternative; wrapping keeps it.
                `break-words` is the floor under that: with min-w-0 the box can be
                squeezed below min-content, and a word that cannot break would
                spill out of it and scroll the page again. */}
            {/* Hidden below 360px, where it can no longer stack cleanly. The two-line
                "Kashmiri / Willow Bats" lock-up is a deliberate degradation and it
                survives — but it was measured against an icon cluster of three, and the
                Bat Doctor button makes four. At 320px the lock-up is squeezed to 104px
                and breaks to *three* lines of 17.5px leading in a 64px bar, which is no
                longer a stacked lock-up but a broken one. Below that width the mark
                carries the brand alone; the link's `aria-label` still names the site, so
                nothing is lost to a screen reader. */}
            <span className="hidden break-words text-[14px] font-bold tracking-tight text-foreground min-[360px]:block sm:text-[15px]">
              Kashmiri Willow Bats
            </span>
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navEntries.map((entry) => {
              /* `items` is the discriminant. An entry either goes somewhere itself or
                 opens a group of destinations, never both. */
              if ("items" in entry) {
                return (
                  <NavDropdown
                    key={entry.label}
                    label={entry.label}
                    items={entry.items}
                    triggerClassName={navLinkClass}
                  />
                );
              }

              // Exact match for "/", prefix match otherwise, so /bat-doctor stays marked
              // while a future /bat-doctor/track is open.
              const active =
                entry.href === "/"
                  ? pathname === "/"
                  : pathname === entry.href || pathname.startsWith(`${entry.href}/`);

              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(navLinkClass, active && "text-foreground")}
                >
                  {entry.label}
                </Link>
              );
            })}
          </nav>

          {/* `shrink-0` so the shrinking all happens in the lock-up above. Without
              it the h-10 w-10 buttons inside would narrow under pressure, and a
              38px tap target is a worse trade than a wrapped wordmark. */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Bat Doctor, beside Bat Expert — the two things on this site you ask a
                person for rather than add to a cart, and now the two that look alike.
                The nav row above skips it (see `navEntries`), so this button is its
                only appearance in the bar at every width from `md` up; below `md` both
                service buttons drop to the drawer, which is the existing pattern here.

                A `Link`, not the `ButtonLink` beside it: `ButtonLink` renders a plain
                `<a>`, which is right for a WhatsApp URL and wrong for an internal
                route — it would drop client-side navigation and prefetch. So it borrows
                the skin instead of the element, through `buttonClass`, and asks for the
                same `expert`/`sm` pair Bat Expert does. The hand-copied class list this
                replaces claimed to do that and did not: it was written against `accent`
                tokens, so the two buttons were a different gold in the same bar.

                The active route deepens the surface rather than adding a marker: this
                is the one service button that can *be* the current page, and Bat Expert
                leaves to WhatsApp so it never competes for the state. */}
            <Link
              href="/bat-doctor"
              aria-current={batDoctorActive ? "page" : undefined}
              className={buttonClass({
                variant: "expert",
                size: "sm",
                className:
                  "hidden md:inline-flex aria-[current=page]:border-expert/50 aria-[current=page]:bg-expert/15",
              })}
            >
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              Bat Doctor
            </Link>

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

            {/* Bat Doctor on phones, where the labelled pill above does not fit.
                Without this the only route to the page below `md` is inside the drawer,
                behind the menu icon — a service the site is actively selling, filed
                under three lines that have to be opened before it exists. The drawer
                still lists it; this stops the drawer being the only way.

                Icon-sized because that is what the row can afford: measured at 375px
                the bar has 53px of slack and this takes 44 of it. It keeps the `expert`
                colours of the pill rather than the grey of the icons beside it, so at
                every width Bat Doctor reads as the same accented thing — labelled where
                there is room, a mark where there is not — and it is the one control
                here that is not monochrome, which is what makes it findable at a glance.
                `aria-label` carries the name the label would have. */}
            <Link
              href="/bat-doctor"
              aria-label="Bat Doctor"
              aria-current={batDoctorActive ? "page" : undefined}
              className={cn(
                iconButtonClass,
                "border border-expert/30 bg-expert-muted text-expert hover:bg-expert/15 hover:text-expert md:hidden",
                batDoctorActive && "border-expert/50 bg-expert/15",
              )}
            >
              <Stethoscope className="h-[18px] w-[18px]" />
            </Link>

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
            {/* No wishlist icon. It was the third of four icons in a cluster that had
                to give up width for the Bat Doctor button, and it is the one whose
                absence costs least: the cart is the checkout path and the account page
                is where a saved list would live anyway. `/wishlist` still exists and
                still renders — it is simply not linked from the chrome, so bringing it
                back is restoring this element and nothing else. */}
            {/* `relative` so the badge can sit on the corner of the icon. The label
                carries the count, so the badge itself is aria-hidden. */}
            <Link
              href="/cart"
              className={cn(iconButtonClass, "relative")}
              aria-label={cartLabel}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              <CartCount />
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
