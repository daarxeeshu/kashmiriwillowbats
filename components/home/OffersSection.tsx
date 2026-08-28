import { offers } from "@/data/offers";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGrid, StaggerItem } from "@/components/ui/FadeIn";
import { CopyCodeButton } from "@/components/home/CopyCodeButton";
import { cn } from "@/lib/utils";

export function OffersSection() {
  return (
    <section
      className="section-padding border-y border-border bg-surface"
      aria-labelledby="offers-heading"
    >
      <Container>
        <SectionHeading
          titleId="offers-heading"
          eyebrow="Current offers"
          title="Save on your order"
          description="Apply these codes at checkout when the commerce system goes live."
        />

        {/* Five offers, so a 4-column grid — which is what the audit asked for, to
            match the product grid above — would strand one card alone on a second
            row, which reads worse than the mismatch it fixes. The rhythm problem is
            real but it was mis-diagnosed: the grid used to go 3-up at `lg` and only
            reach 5 at `xl`, so between 1024 and 1279px it was 3 offer columns under
            4 product columns *and* a ragged trailing row.

            Fixed by moving the 5-column step down to `lg`, the same breakpoint where
            the product grid goes 4-up. The two sections now change shape together and
            every row is full at every width. The offer cards are deliberately denser
            than product cards — a code and one line of copy, no image — so 5 narrow
            columns is the honest shape for them; matching the product grid's column
            *count* would only disguise that they are a different kind of card.

            2-up rather than 1-up on the smallest screens for the same reason: these
            cards have no image, so a single column of full-width slabs wastes a phone
            viewport that fits two comfortably. */}
        <StaggerGrid className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {offers.map((offer, index) => (
            <StaggerItem
              key={offer.id}
              /* Five cards divides evenly into 5 columns and leaves one orphan in
                 both 2-up and 3-up. Rather than a hole in the trailing row, the last
                 card widens to fill it — the two remainders differ, hence the two
                 conditions, and at `lg` neither applies because the row is full.
                 Guarded on `offers.length` rather than hardcoded to index 4, so
                 adding a sixth offer silently stops spanning instead of producing a
                 6-wide row with a double-width card in it. */
              className={cn(
                "h-full",
                offers.length % 2 === 1 &&
                  index === offers.length - 1 &&
                  "col-span-2 sm:col-span-1",
                offers.length % 3 === 2 &&
                  index === offers.length - 1 &&
                  "sm:col-span-2 lg:col-span-1",
              )}
            >
              {/* ── What a coupon card has to say on a phone ──────────────────────
                  Four things were competing at one weight: the saving, the condition,
                  a sentence restating both, and the code. On a narrow card that reads
                  as a paragraph with a number on top, and nobody reads a coupon.

                  The saving now leads at a size you can find without reading, and the
                  sentence is dropped below `sm` — not squeezed, dropped, because it is
                  almost entirely redundant: "5% OFF" over "First Order" already says
                  "5% off your first purchase". What it adds on the wider card is tone,
                  which is worth having when there is room and worth losing when there
                  is not. Two of the five ("Ideal for club squads", "Free shipping on
                  prepaid checkout") do carry a fact the heading omits, which is why
                  they come back at `sm` rather than being deleted outright.

                  `mt-auto` on the code does the job `flex-1` on the paragraph used to:
                  it pins the code to the bottom of every card so the row of codes lines
                  up whether or not the sentence above it is showing. */}
              <article className="flex h-full flex-col rounded-sm border border-border bg-background p-4 transition-colors hover:border-accent/25 sm:p-5">
                {offer.highlight && (
                  <p className="text-2xl font-semibold leading-none tracking-tight text-accent sm:text-xl sm:leading-tight">
                    {offer.highlight}
                  </p>
                )}
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  {offer.title}
                </h3>
                <p className="mt-2 hidden text-xs leading-relaxed text-muted-foreground sm:block sm:flex-1">
                  {offer.description}
                </p>
                {offer.code && (
                  <CopyCodeButton
                    code={offer.code}
                    offerTitle={offer.title}
                    className="mt-auto pt-4"
                  />
                )}
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Container>
    </section>
  );
}
