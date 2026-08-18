// components/home/BrandGrid.tsx
import { cn } from "@/lib/utils";
import { brands } from "@/data/brands";
import { BrandCard } from "@/components/home/BrandCard";
import { DepthCard } from "@/components/ui/DepthCard";

export function BrandGrid() {
  const flagship = brands.find((b) => b.isFlagship);
  const others = brands.filter((b) => !b.isFlagship);

  const rowA = others.slice(0, 3);
  const rowB = others.slice(3);

  return (
    <div className="space-y-3">
      {/* ── ROW 1: KIS featured (large) + first 3 partner brands ── */}
      <div
        className={cn(
          "grid gap-3",
          "grid-cols-2 sm:grid-cols-5",
        )}
      >
        {flagship && (
          <DepthCard
            intensity={8}
            glare
            className="col-span-2 sm:col-span-2"
          >
            <BrandCard
              brand={flagship}
              variant="featured"
              index={0}
            />
          </DepthCard>
        )}
        {rowA.slice(0, 3).map((brand, i) => (
          <DepthCard
            key={brand.id}
            intensity={12}
            glare
            className="col-span-1 sm:col-span-1"
          >
            <BrandCard
              brand={brand}
              variant="standard"
              index={i + 1}
            />
          </DepthCard>
        ))}
      </div>

      {/* ── ROW 2: Remaining partner brands — equal compact grid ── */}
      {rowB.length > 0 && (
        <div
          className={cn(
            "grid gap-3",
            rowB.length <= 3 && "grid-cols-2 sm:grid-cols-3",
            rowB.length === 4 && "grid-cols-2 sm:grid-cols-4",
            rowB.length >= 5 && "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5",
          )}
        >
          {rowB.map((brand, i) => (
            <DepthCard
              key={brand.id}
              intensity={14}
              glare
            >
              <BrandCard
                brand={brand}
                variant="compact"
                index={rowA.length + 1 + i}
              />
            </DepthCard>
          ))}
        </div>
      )}
    </div>
  );
}
