import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/types/commerce";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-sm border border-border bg-surface",
        "transition-all duration-200 hover:border-accent/30 hover:shadow-[0_8px_28px_rgba(28,27,25,0.07)]",
        className,
      )}
    >
      <div className="absolute inset-0 studio-bg">
        <Image
          src={category.image}
          alt=""
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 20vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />

      <div className="relative p-5 text-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight sm:text-lg">
              {category.name}
            </h3>
            <p className="mt-1 text-xs text-white/75">{category.descriptor}</p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-all group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
