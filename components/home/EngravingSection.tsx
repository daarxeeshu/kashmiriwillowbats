import Image from "next/image";
import { siteConfig } from "@/data/site-config";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";

export function EngravingSection() {
  const { price, freeThreshold } = siteConfig.engraving;

  return (
    <section className="section-padding bg-surface" aria-labelledby="engraving-heading">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeIn>
            <p className="eyebrow">Laser engraving</p>
            <h2 id="engraving-heading" className="heading-lg mt-3">
              Make it yours.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Add your name to your bat with professional laser engraving — done
              in-house before dispatch.
            </p>

            <div className="mt-8 flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-medium text-muted">Engraving</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {formatPrice(price)}
                </p>
              </div>
              <div className="h-auto w-px bg-border" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-accent">Free above</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-accent">
                  {formatPrice(freeThreshold)}
                </p>
              </div>
            </div>

            {/* Full width on a phone, natural width from `sm`. This is the section's
                only action and the whole column above it is argument for taking it, so
                on a narrow screen it should read as the end of that argument rather
                than as one more inline element — a 188px button on a 390px screen
                does not. From `sm` the column is wide enough that a full-bleed button
                would look stretched, so it returns to its own width. */}
            <ButtonLink
              href={buildWhatsAppUrl(whatsappMessages.engraving)}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
              className="mt-8 w-full sm:w-auto"
            >
              Customize your bat
            </ButtonLink>
          </FadeIn>

          {/* ── Image first on a phone, second from `lg` ──
              Stacked in one column the source order put the photograph last, so the
              section opened with three paragraphs of type and the thing being sold was
              below the fold — and the CTA landed in the middle of the block rather than
              at the end of it. Leading with the image states the subject before the
              copy explains it, and leaves the button as the last thing in the section.

              `order` rather than moving the markup: the heading has to stay first in
              the DOM so the section is announced by its name, and this element is
              decorative (`alt=""`), so moving it visually costs a screen reader
              nothing. It is not focusable either, so tab order is unaffected. At `lg`
              the grid is two columns and source order is already correct, hence
              `lg:order-none`. */}
          <FadeIn delay={0.08} className="relative order-first aspect-[4/3] overflow-hidden rounded-sm border border-border lg:order-none lg:aspect-square">
            <Image
              src="/hero/engraving.jpg"
              alt=""
              fill
              className="object-cover"
              /* 584px at the container cap; below lg this one has no max-w so it
                 spans the full container width. */
              sizes="(min-width: 1280px) 584px, (min-width: 1024px) calc(50vw - 3.5rem), calc(100vw - 3rem)"
            />
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
