import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/site-config";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import type { FooterLinkGroup } from "@/types/commerce";

const footerGroups: FooterLinkGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "Kashmir Willow Bats", href: "/categories/kashmir-willow-bats" },
      { label: "English Willow", href: "/categories/english-willow-bats" },
      { label: "Cricket Equipment", href: "/categories/cricket-equipment" },
      { label: "Brands", href: "/brands" },
      { label: "Offers", href: "/offers" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "WhatsApp", href: buildWhatsAppUrl(whatsappMessages.general) },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Warranty", href: "/warranty" },
      { label: "Track Order", href: "/track-order" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "KIS", href: "/brands/kis" },
      { label: "Our Brands", href: "/brands" },
      { label: "Physical Store", href: "/store" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-dark text-white">
      <Container className="section-padding">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-lg font-bold tracking-tight">Kashmiri Willow Bats</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
              Authentic Kashmir Willow bats and professional cricket equipment from
              Kashmir&apos;s established cricket brands.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href={buildWhatsAppUrl(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-white/50">{siteConfig.domain}</p>
        </div>
      </Container>
    </footer>
  );
}
