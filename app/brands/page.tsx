import type { Metadata } from "next";
import { brands } from "@/data/brands";
import { BrandCard } from "@/components/home/BrandCard";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PageHeader } from "@/components/catalog/PageHeader";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Cricket Brands",
  description:
    "Shop KIS, JK, Valleywoods, SLS, Woodford, Whiteduck, IB, A Star and more from Kashmir's cricket hub.",
};

export default function BrandsPage() {
  return (
    <Container className="section-padding">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
      <PageHeader
        className="mt-6"
        eyebrow="Multi-brand store"
        title="Our brands"
        description="One store featuring established cricket brands from Kashmir — authentic equipment, expert support, and reliable shipping."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} className="w-full" />
        ))}
      </div>
    </Container>
  );
}
