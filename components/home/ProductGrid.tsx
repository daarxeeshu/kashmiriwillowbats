import { getFeaturedProducts } from "@/data/products";
import { ProductCard } from "@/components/home/ProductCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGrid, StaggerItem } from "@/components/ui/FadeIn";

interface ProductGridProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  limit?: number;
}

export function ProductGrid({
  title = "What players are buying",
  eyebrow = "Best sellers",
  description = "Selected Kashmir Willow bats from our established brands.",
  limit = 8,
}: ProductGridProps) {
  const products = getFeaturedProducts(limit);

  return (
    <section className="section-padding bg-background" aria-labelledby="featured-products-heading">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        <StaggerGrid className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <StaggerItem key={product.id} className="h-full">
              <ProductCard product={product} className="h-full" />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Container>
    </section>
  );
}
