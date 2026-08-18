import { CategoryGlassIcons } from "@/components/home/CategoryGlassIcons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CategoryShowcase() {
  return (
    <section
      className="border-y border-border bg-[#f3f0eb] py-12 md:py-14"
      aria-labelledby="categories-heading"
    >
      <Container>
        <SectionHeading
          eyebrow="Full catalogue"
          title="Shop by category"
          description="Everything you need for the game."
          align="center"
          className="mx-auto"
        />

        <div className="mt-6">
          <CategoryGlassIcons />
        </div>
      </Container>
    </section>
  );
}
