import { Play } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";

const reviewPlaceholders = [
  { id: "unboxing", label: "Unboxing", note: "Placeholder — replace with customer video" },
  { id: "ping", label: "Ping test", note: "Placeholder — replace with customer video" },
  { id: "match", label: "Match use", note: "Placeholder — replace with customer video" },
  { id: "review", label: "Customer review", note: "Placeholder — replace with customer video" },
];

export function VideoReviews() {
  return (
    <section className="section-padding bg-background" aria-labelledby="reviews-heading">
      <Container>
        <SectionHeading
          eyebrow="Verified buyers"
          title="Real players. Real bats. Real reviews."
          description="Unboxing videos, ping tests, and product photos from verified customers. Rewards apply regardless of rating."
          align="center"
          className="mx-auto"
        />

        {/* One reveal for the whole row: the cards scroll horizontally on small
            screens, so per-card viewport triggers would leave the off-screen
            ones stuck at opacity 0. */}
        <FadeIn>
          <div className="scrollbar-hide -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:-mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
            {reviewPlaceholders.map((item) => (
              <div
                key={item.id}
                className="relative w-[220px] shrink-0 snap-start overflow-hidden rounded-sm border border-border bg-surface-elevated sm:w-[240px] lg:w-auto"
              >
                <div className="relative aspect-[9/14] bg-foreground">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                      <Play className="h-5 w-5" fill="currentColor" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="mt-2 text-[11px] text-white/60">{item.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-muted">
          After a completed order, verified buyers can submit reviews and choose
          ₹100 UPI cashback or a ₹200 coupon (1-year validity).
        </p>
      </Container>
    </section>
  );
}
