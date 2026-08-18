import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { brands, getBrandBySlug } from "@/data/brands";
import { getProductsByBrand } from "@/data/products";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CatalogProductGrid } from "@/components/catalog/CatalogProductGrid";
import { PageHeader } from "@/components/catalog/PageHeader";
import { Container } from "@/components/ui/Container";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { ButtonLink } from "@/components/ui/Button";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand not found" };

  return {
    title: `${brand.name} Cricket Equipment`,
    description: brand.descriptor ?? `Shop ${brand.name} at Kashmiri Willow Bats.`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const brandProducts = getProductsByBrand(slug);

  return (
    <>
      <div className="border-b border-border bg-surface-elevated">
        <Container className="py-10 md:py-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Brands", href: "/brands" },
              { label: brand.name },
            ]}
          />
          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <PageHeader
              eyebrow={brand.isFlagship ? "Flagship brand" : "Partner brand"}
              title={brand.name}
              description={brand.descriptor}
            />
            {brand.logo && (
              <div className="flex h-24 w-48 items-center justify-center rounded-sm border border-border bg-surface p-6">
                <Image
                  src={brand.logo}
                  alt=""
                  width={160}
                  height={48}
                  className="h-auto max-h-10 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className="section-padding">
        <CatalogProductGrid
          products={brandProducts}
          emptyTitle={`${brand.name} catalogue loading`}
          emptyDescription={`We are preparing the full ${brand.name} catalogue for online listing. Message us for current models, pricing, and stock.`}
        />

        <div className="mt-12 rounded-sm border border-border bg-surface p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="text-base font-semibold">Need help choosing a {brand.name} bat?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our experts can show available bats on WhatsApp video call.
            </p>
          </div>
          <ButtonLink
            href={buildWhatsAppUrl(`${whatsappMessages.batExpert} Brand: ${brand.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            variant="expert"
            size="md"
            className="mt-4 shrink-0 sm:mt-0"
          >
            WhatsApp bat expert
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
