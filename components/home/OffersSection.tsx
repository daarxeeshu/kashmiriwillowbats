import { offers } from "@/data/offers";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGrid, StaggerItem } from "@/components/ui/FadeIn";

export function OffersSection() {
  return (
    <section
      className="section-padding border-y border-border bg-surface"
      aria-labelledby="offers-heading"
    >
      <Container>
        <SectionHeading
          eyebrow="Current offers"
          title="Save on your order"
          description="Apply these codes at checkout when the commerce system goes live."
        />

        <StaggerGrid className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {offers.map((offer) => (
            <StaggerItem key={offer.id} className="h-full">
              <article className="flex h-full flex-col rounded-sm border border-border bg-background p-5 transition-colors hover:border-accent/25">
                {offer.highlight && (
                  <p className="text-xl font-semibold tracking-tight text-accent">
                    {offer.highlight}
                  </p>
                )}
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  {offer.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>
                {offer.code && (
                  <p className="mt-4 border-t border-dashed border-border pt-4 font-mono text-xs font-semibold tracking-wide text-foreground">
                    {offer.code}
                  </p>
                )}
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Container>
    </section>
  );
}
