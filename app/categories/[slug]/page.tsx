import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CategoryLaunchState } from "@/components/catalog/CategoryLaunchState";
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

  const description =
    category.seoDescription ?? category.catalogueDescription ?? category.descriptor;

  return {
    // The root layout's template turns this into "<name> | Kashmiri Willow Bats".
    title: category.name,
    description,
    // Per-route canonical. The root layout sets `alternates.canonical` to the site
    // root, which is inherited by every page that does not override it — so without
    // this line each category declares the home page as its canonical URL and asks
    // search engines not to index it separately.
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title: category.name,
      description,
      url: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryProducts = getProductsByCategory(slug);

  /* Products always win over the flag: a category marked `comingSoon` that has had
     products added is simply live, and nobody has to remember to clear the flag for
     the listing to appear. */
  const showLaunchState = category.comingSoon && categoryProducts.length === 0;

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
        description={category.catalogueDescription ?? category.descriptor}
      />

      <div className="mt-10">
        {showLaunchState ? (
          <CategoryLaunchState categoryName={category.name} />
        ) : (
          /* Count, sort and filters for every category, from one component. The
             controls it renders are decided by the products passed in, so this same
             call produces brand + price controls for Kashmir Willow and none for a
             category holding a single product. */
          <CatalogBrowser
            products={categoryProducts}
            emptyTitle={`${category.name} coming online`}
            emptyDescription="Products in this category will be listed as the catalogue is digitized. Contact us for current availability."
          />
        )}
      </div>
    </Container>
  );
}
