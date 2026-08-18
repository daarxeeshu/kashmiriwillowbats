import type { Metadata } from "next";
import { offers } from "@/data/offers";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PageHeader } from "@/components/catalog/PageHeader";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Offers",
  description: "Current offers and coupon codes at Kashmiri Willow Bats.",
};

export default function OffersPage() {
  return (
    <Container className="section-padding">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />
      <PageHeader
        className="mt-6"
        eyebrow="Save more"
        title="Current offers"
        description="Apply these codes at checkout when the commerce system goes live. For immediate orders, message us on WhatsApp."
      />

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <article
            key={offer.id}
            className="rounded-sm border border-border bg-surface p-6"
          >
            {offer.highlight && (
              <p className="text-2xl font-semibold tracking-tight text-accent">
                {offer.highlight}
              </p>
            )}
            <h2 className="mt-2 font-semibold">{offer.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p>
            {offer.code && (
              <p className="mt-4 border-t border-dashed border-border pt-4 font-mono text-sm font-semibold">
                {offer.code}
              </p>
            )}
          </article>
        ))}
      </div>
    </Container>
  );
}
