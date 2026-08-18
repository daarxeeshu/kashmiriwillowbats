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
        <SectionHeading eyebrow="Why us" title="Why shop with us" />

        <FadeIn className="mt-8">
          <ul className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((point: TrustPoint) => {
              const Icon = trustIcons[point.icon] ?? ShieldCheck;
              return (
                <li key={point.id} className="bg-surface p-6">
                  <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
