import type { Metadata } from "next";
import { categories } from "@/data/categories";
import { CategoryCard } from "@/components/home/CategoryCard";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PageHeader } from "@/components/catalog/PageHeader";
import { Container } from "@/components/ui/Container";

const equipmentSlugs = new Set([
  "batting-gloves",
  "batting-pads",
  "thigh-guards",
  "helmets",
  "cricket-balls",
  "cricket-shoes",
  "cricket-bags",
  "accessories",
]);

const equipmentCategories = categories.filter((c) => equipmentSlugs.has(c.id));

export const metadata: Metadata = {
  title: "Cricket Equipment",
  description: "Protective gear, balls, shoes, bags and cricket accessories.",
};

export default function CricketEquipmentPage() {
  return (
    <Container className="section-padding">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cricket Equipment" },
        ]}
      />
      <PageHeader
        className="mt-6"
        eyebrow="Full catalogue"
        title="Cricket equipment"
        description="Browse protective gear, balls, footwear, bags and accessories — catalogue expanding as products go live."
      />

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {equipmentCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </Container>
  );
}
