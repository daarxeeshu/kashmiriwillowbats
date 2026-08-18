import type { Product } from "@/types/commerce";
import { ProductCard } from "@/components/home/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

interface CatalogProductGridProps {
  products: Product[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function CatalogProductGrid({
  products,
  emptyTitle = "No products listed yet",
  emptyDescription = "This catalogue section is being loaded. Contact our bat expert for current stock and availability.",
}: CatalogProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-surface px-6 py-14 text-center">
        <h2 className="text-lg font-semibold tracking-tight">{emptyTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {emptyDescription}
        </p>
        <ButtonLink
          href={buildWhatsAppUrl(whatsappMessages.general)}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="md"
          className="mt-6"
        >
          Contact on WhatsApp
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
