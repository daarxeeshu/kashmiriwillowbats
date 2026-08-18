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

            <ButtonLink
              href={buildWhatsAppUrl(whatsappMessages.engraving)}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
              className="mt-8"
            >
              Customize your bat
            </ButtonLink>
          </FadeIn>

          <FadeIn delay={0.08} className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border lg:aspect-square">
            <Image
              src="/hero/engraving.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
