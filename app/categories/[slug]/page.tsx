import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CatalogProductGrid } from "@/components/catalog/CatalogProductGrid";
import { PageHeader } from "@/components/catalog/PageHeader";
import { Container } from "@/components/ui/Container";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.name,
    description: category.descriptor,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryProducts = getProductsByCategory(slug);

  return (
    <Container className="section-padding">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories/kashmir-willow-bats" },
          { label: category.name },
        ]}
      />
      <PageHeader
        className="mt-6"
        eyebrow="Shop"
        title={category.name}
        description={category.descriptor}
      />

      <div className="mt-10">
        <CatalogProductGrid
          products={categoryProducts}
          emptyTitle={`${category.name} coming online`}
          emptyDescription="Products in this category will be listed as the catalogue is digitized. Contact us for current availability."
        />
      </div>
    </Container>
  );
}
