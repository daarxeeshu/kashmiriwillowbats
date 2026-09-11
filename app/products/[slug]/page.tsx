import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  getAllProductSlugs,
  getProductBySlug,
} from "@/data/products";
import { getBrandBySlug } from "@/data/brands";
import { getCategoryBySlug } from "@/data/categories";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import {
  PRODUCT_HERO_SIZES,
  ProductImageFrame,
  ratioForCategory,
} from "@/components/product/ProductImageFrame";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { OrderOnWhatsAppDialog } from "@/components/product/OrderOnWhatsAppDialog";
import { BatOptionsPicker } from "@/components/product/BatOptionsPicker";
import { isConfigurableBat } from "@/data/bat-options";
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

  /* Brand-first when there is a brand, product name alone when there is not. The
     naive template produced "undefined Scoop Cricket Bat" as a page title and
     "Buy Scoop Cricket Bat by undefined" as its meta description for the
     unattributed range. */
  return {
    title: product.brandName ? `${product.brandName} ${product.name}` : product.name,
    description: product.brandName
      ? `Buy ${product.name} by ${product.brandName} at Kashmiri Willow Bats.`
      : `Buy ${product.name} at Kashmiri Willow Bats.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const brand = product.brandSlug ? getBrandBySlug(product.brandSlug) : undefined;
  const category = getCategoryBySlug(product.categorySlug);
  const discount =
    product.mrp != null ? discountPercent(product.mrp, product.price) : 0;

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
        {/* Same frame as every card, one size up. This was a cream `studio-bg` slab
            with `object-contain p-[12%]`, which is precisely the case the shared
            frame exists to fix: seven of eight product images are placeholders drawn
            on a cream gradient and the eighth is a real studio shot on near-black,
            so a fixed light background is wrong for the one that matters and a fixed
            dark one is wrong for the other seven. The frame derives its backdrop from
            each image instead.

            `alt=""` — the `<h1>` beside it names the product, so a screen reader
            announcing it again is duplication. `priority` because this is the page's
            LCP element. `interactive={false}` because there is no card to hover and
            no link here: a zoom on mouse-over with nothing to click would read as a
            broken affordance. */}
        <ProductImageFrame
          src={product.image}
          alt=""
          /* Chosen from the category — see `ratioForCategory`. The card grids keep a
             single fixed ratio because a row of cards has to align; this hero has no
             row to align with, so it is free to take the shape of what it is showing. */
          ratio={ratioForCategory(product.categorySlug)}
          priority
          interactive={false}
          sizes={PRODUCT_HERO_SIZES}
          /* Capped below `lg`, where this grid is a single column and the frame would
             otherwise take the full container: at a 731px viewport that was a 668x835
             card holding a product 308px wide. A bat is a tall, narrow subject and the
             frame is 4:5, so widening the card cannot fill it — it only grows the
             surround. From `lg` the grid splits and the column is already the cap, so
             the limit lifts. */
          className="product-glass mx-auto w-full max-w-[420px] rounded-xl lg:max-w-none"
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Only when there is a brand to link to. Rendered unconditionally this
                was a gold "undefined" pointing at /brands/undefined — a 404 dressed
                up as the manufacturer. */}
            {product.brandSlug && product.brandName && (
              <Link
                href={`/brands/${product.brandSlug}`}
                className="text-sm font-semibold text-accent hover:text-accent-hover"
              >
                {product.brandName}
              </Link>
            )}
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

          {/* The second and last reader of `isPlaceholder`. It sits between the price
              and the order buttons on purpose: this is the one screen where someone
              reads a figure and then acts on it, so the caveat has to arrive before the
              CTA rather than after it. Worth being blunt in the copy — the price above
              is an invented development figure, and a page that showed it without
              saying so would be making a commercial claim on the shop's behalf. */}
          {product.isPlaceholder && (
            <p className="mt-4 rounded-lg border border-dashed border-border bg-surface-elevated p-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                Placeholder listing.
              </span>{" "}
              This product is a development placeholder while we photograph and price
              the range. The name and figure above are not final — talk to us on
              WhatsApp for what is actually in stock today.
            </p>
          )}

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Inclusive of expert support, safe packaging, and fresh bat preparation
            where applicable. No payment is taken online — you confirm the order with
            us on WhatsApp.
          </p>

          {/* Add to cart leads now, and WhatsApp stays. They are two genuinely
              different journeys rather than a primary and a fallback: the cart is for
              someone buying more than one thing, or applying a code at checkout; the
              direct message is for someone with one bat in mind and a question about
              it. Neither replaces the other, and both still end in the same WhatsApp
              thread. */}
          {/* A bat is configured before it is added; everything else is added as it
              is. The picker owns its own add button because the spec and the action
              belong together — splitting them would let someone change a dropdown
              after pressing add and believe the change was captured. */}
          {isConfigurableBat(product.categorySlug) ? (
            <BatOptionsPicker
              slug={product.slug}
              name={product.name}
              price={product.price}
            />
          ) : (
            <>
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                size="lg"
                className={buttonClass({
                  variant: "primary",
                  size: "lg",
                  className: "mt-8 w-full",
                })}
              />
              {/* A bat with a spec carries its own ordering button inside
                  `BatOptionsPicker`, next to the dropdowns whose values it sends.
                  Everything else has no spec to collect, so it mounts here. */}
              <OrderOnWhatsAppDialog
                slug={product.slug}
                name={product.name}
                className="mt-3 w-full"
              />
            </>
          )}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
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


          {/* §33's second and last cross-site entry point. One line, below the buying
              decision rather than beside it — someone reading a product page is looking
              for a new bat, and this is only useful to the fraction of them who came
              here because their current one is damaged. A quiet row serves those people
              without arguing with the two buttons above. */}
          <Link
            href="/bat-doctor"
            className="group mt-3 flex items-center justify-between gap-3 rounded-sm border border-accent/25 bg-accent-muted px-5 py-4 transition-colors duration-200 hover:border-accent/50 hover:bg-accent/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <span>
              <span className="block text-sm font-semibold text-accent">
                Need bat repair?
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Toe, handle, edge and grain repair by our technicians.
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-accent">
              Bat Doctor
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </div>
    </Container>
  );
}
