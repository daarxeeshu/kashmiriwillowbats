import type { Product } from "@/types/commerce";
import { ProductCardGrid } from "@/components/product/ProductCardGrid";
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

  /* Delegates entirely to the shared grid. This component's job is the empty state
     above and nothing else — it used to carry its own column ladder
     (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), which was 1-up on every phone
     and introduced a 3-up step the homepage never had. Two ladders also meant
     `ProductCard`'s single `sizes` string was necessarily wrong for one of them.

     `priorityCount={4}` because a catalogue page opens directly onto this grid, so
     the first row really is above the fold — unlike the homepage section, which sits
     below the hero. */
  return <ProductCardGrid products={products} priorityCount={4} />;
}
