import {
  Footprints,
  Headphones,
  Package,
  PenTool,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Video,
  MessageCircle,
} from "lucide-react";
import { includedBenefits, trustPoints } from "@/data/site-config";
import type { Benefit, TrustPoint } from "@/types/commerce";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";

const benefitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  footprints: Footprints,
  truck: Truck,
  users: Users,
  sparkles: Sparkles,
};

const trustIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "shield-check": ShieldCheck,
  "message-circle": MessageCircle,
  "pen-tool": PenTool,
  package: Package,
  headphones: Headphones,
  video: Video,
};

export function BenefitsBar() {
  return (
    <section
      className="border-y border-border bg-surface py-5"
      aria-label="Included benefits"
    >
      <Container>
        <FadeIn>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {includedBenefits.map((benefit: Benefit) => {
              const Icon = benefitIcons[benefit.icon] ?? Shield;
              return (
                <li key={benefit.id} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {benefit.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </FadeIn>
      </Container>
    </section>
  );
}

export function TrustSection() {
  return (
    <section className="section-padding bg-surface" aria-labelledby="trust-heading">
      <Container>
        <SectionHeading titleId="trust-heading" eyebrow="Why us" title="Why shop with us" />

        {/* ── Two up on a phone, and titles only there ────────────────────────────
            Six points in one column is six full-width cards of icon, heading and a
            three-line paragraph — a long scroll through items that look identical, so
            the reader stops reading and starts flicking, which is the opposite of what
            a reassurance section is for. Two columns turns six rows into three.

            The descriptions are the other half of it, and they are dropped below `sm`
            rather than squeezed: at 390px a two-column cell is about 170px wide, and a
            sentence like "Speak directly with cricket specialists who know willow,
            weight, and pickup" sets to five or six lines in that measure — which would
            put the height straight back and read worse besides. The titles are written
            to stand alone ("Expert Bat Selection", "Safe Delivery"), so what is left is
            a scannable grid of claims rather than a wall of prose.

            `hidden` rather than a visual-only hide, deliberately: a screen reader on a
            phone gets the same six claims a sighted reader does, and nothing announced
            that is not on screen. Everything returns from `sm`, where the measure can
            carry it. */}
        <FadeIn className="mt-8">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border lg:grid-cols-3">
            {trustPoints.map((point: TrustPoint) => {
              const Icon = trustIcons[point.icon] ?? ShieldCheck;
              return (
                <li key={point.id} className="bg-surface p-4 sm:p-6">
                  <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold tracking-tight sm:mt-4">
                    {point.title}
                  </h3>
                  <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground sm:block">
                    {point.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </FadeIn>
      </Container>
    </section>
  );
}
