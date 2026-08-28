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
        description="Kashmir Valley's top cricket brands brought together in one destination. Every maker listed here is an independent manufacturer based in the Valley, and we buy from them directly — compare their bats side by side instead of guessing from a marketplace listing."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {brands.map((brand, i) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            index={i}
            className="w-full"
            /* The first cover is this page's LCP element, so preload it
               instead of letting it lazy-load. */
            priority={i === 0}
          />
        ))}
      </div>
    </Container>
  );
}
