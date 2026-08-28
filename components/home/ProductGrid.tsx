import { getFeaturedProducts } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { PRODUCT_GRID_LADDER } from "@/components/product/ProductCardGrid";
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
        <SectionHeading titleId="featured-products-heading" eyebrow={eyebrow} title={title} description={description} />

        {/* Same columns as every other product grid in the app —
            `PRODUCT_GRID_LADDER` is the shared string, and `ProductCard`'s `sizes`
            attribute describes it. The only difference from `ProductCardGrid` is the
            wrapper: this one staggers its children in on scroll, which is why it
            can't just use that component (`StaggerGrid` is a framer-motion client
            component and the catalogue pages shouldn't pay for it).

            No `priority` here: this section sits well below the hero, so eager
            loading eight images would compete with the hero for bandwidth. */}
        <StaggerGrid className={`mt-8 ${PRODUCT_GRID_LADDER}`}>
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
