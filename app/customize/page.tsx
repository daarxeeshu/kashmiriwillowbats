import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/data/site-config";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PageHeader } from "@/components/catalog/PageHeader";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { CustomiseBatCard } from "@/components/home/CustomiseBatCard";

export const metadata: Metadata = {
  title: "Customize Your Bat",
  description: "Laser name engraving on cricket bats — ₹200, free above ₹6,000.",
};

export default function CustomizePage() {
  const { price, freeThreshold } = siteConfig.engraving;

  return (
    <>
    <Container className="section-padding">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Customize" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
        <PageHeader
          eyebrow="Laser engraving"
          title="Make it yours."
          description="Add your name to your bat with professional in-house laser engraving before dispatch."
        />
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border lg:aspect-square">
          {/* `fill` with no `sizes` makes Next assume 100vw and ship the largest
              derivative on every viewport. The real box is a gap-10 half column:
              (1232 − 40) / 2 = 596px at the container cap. */}
          <Image
            src="/hero/engraving.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 596px, (min-width: 1024px) calc(50vw - 2.75rem), calc(100vw - 3rem)"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:max-w-2xl">
        <div className="rounded-sm border border-border bg-surface p-5">
          <p className="text-xs font-medium text-muted">Engraving fee</p>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(price)}</p>
        </div>
        <div className="rounded-sm border border-accent/25 bg-accent-muted p-5">
          <p className="text-xs font-medium text-accent">Free above</p>
          <p className="mt-1 text-2xl font-semibold text-accent">
            {formatPrice(freeThreshold)}
          </p>
        </div>
      </div>

      <ButtonLink
        href={buildWhatsAppUrl(whatsappMessages.engraving)}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        size="lg"
        className="mt-8"
      >
        Request engraving on WhatsApp
      </ButtonLink>
    </Container>

      {/* The other half of this page's subject, in the card the homepage uses. This
          page explains what engraving costs; the studio lets someone place it on a
          bat and watch it burn in. Outside the `Container` because the card carries
          its own full-bleed forest ground. */}
      <CustomiseBatCard />
    </>
  );
}
