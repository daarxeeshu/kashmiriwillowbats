"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/commerce";
import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatPrice, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const discount =
    product.mrp != null ? discountPercent(product.mrp, product.price) : 0;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-sm border border-border bg-surface transition-all duration-200",
        "hover:border-border-strong hover:shadow-[0_8px_28px_rgba(28,27,25,0.07)]",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-elevated">
        <Link
          href={`/products/${product.slug}`}
          className="relative block h-full w-full"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain object-center p-[12%] transition-transform duration-400 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {product.badge && (
          <div className="absolute left-3 top-3">
            <Badge variant="forest">{product.badge}</Badge>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:text-accent"
            aria-label={`Add ${product.name} to wishlist`}
          >
            <Heart className="h-4 w-4" />
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:text-accent"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          className="absolute bottom-0 left-0 right-0 flex h-11 items-center justify-center gap-2 border-t border-border bg-surface text-xs font-semibold text-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-elevated"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBag className="h-4 w-4" />
          Quick add
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-wide text-accent">
          {product.brandName}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 text-sm font-semibold tracking-tight transition-colors hover:text-accent sm:text-base">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.mrp != null && product.mrp > product.price && (
            <>
              <span className="text-sm text-muted line-through">
                {formatPrice(product.mrp)}
              </span>
              {discount > 0 && (
                <span className="text-xs font-medium text-success">
                  {discount}% off
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
