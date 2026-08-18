import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  getAllProductSlugs,
  getProductBySlug,
} from "@/data/products";
import { getBrandBySlug } from "@/data/brands";
import { getCategoryBySlug } from "@/data/categories";
import { siteConfig } from "@/data/site-config";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { discountPercent, formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.brandName} ${product.name}`,
    description: `Buy ${product.name} by ${product.brandName} at Kashmiri Willow Bats.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const brand = getBrandBySlug(product.brandSlug);
  const category = getCategoryBySlug(product.categorySlug);
  const discount =
    product.mrp != null ? discountPercent(product.mrp, product.price) : 0;

  const whatsappMessage = `${whatsappMessages.general}\n\nProduct: ${product.brandName} ${product.name}\nPrice: ${formatPrice(product.price)}`;

  return (
    <Container className="section-padding">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category
            ? [{ label: category.name, href: `/categories/${category.slug}` }]
            : []),
          ...(brand
            ? [{ label: brand.name, href: `/brands/${brand.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="studio-bg relative aspect-[4/5] overflow-hidden rounded-sm border border-border">
          <Image
            src={product.image}
            alt={product.name}
            fill
            loading="eager"
            fetchPriority="high"
            className="object-contain p-[12%]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/brands/${product.brandSlug}`}
              className="text-sm font-semibold text-accent hover:text-accent-hover"
            >
              {product.brandName}
            </Link>
            {product.badge && <Badge variant="forest">{product.badge}</Badge>}
          </div>

          <h1 className="heading-lg mt-3">{product.name}</h1>

          {category && (
            <p className="mt-2 text-sm text-muted-foreground">
              Category:{" "}
              <Link
                href={`/categories/${category.slug}`}
                className="text-foreground underline-offset-2 hover:underline"
              >
                {category.name}
              </Link>
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.mrp != null && product.mrp > product.price && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPrice(product.mrp)}
                </span>
                {discount > 0 && (
                  <span className="text-sm font-medium text-success">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Inclusive of expert support, safe packaging, and fresh bat preparation
            where applicable. Online checkout is coming soon — order via WhatsApp
            today.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href={buildWhatsAppUrl(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp
            </ButtonLink>
            <ButtonLink
              href={buildWhatsAppUrl(whatsappMessages.batExpert)}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Ask a bat expert
            </ButtonLink>
          </div>

          <button
            type="button"
            disabled
            className="mt-3 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-sm border border-border bg-surface-elevated text-sm font-semibold text-muted"
          >
            Add to cart — checkout coming soon
          </button>

          <div className="mt-8 rounded-sm border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Laser name engraving</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatPrice(siteConfig.engraving.price)} · Free above{" "}
              {formatPrice(siteConfig.engraving.freeThreshold)}
            </p>
            <p className="mt-2 text-xs text-muted">
              Engraving options will be selectable here when checkout goes live.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
