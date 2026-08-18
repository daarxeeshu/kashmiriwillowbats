"use client";

import { useMemo } from "react";
import GlassIcons from "@/components/GlassIcons/GlassIcons";
import { categories } from "@/data/categories";
import { categoryAccentColors } from "@/lib/category-accents";
import { getCategoryIcon } from "@/lib/category-icons";

export function CategoryGlassIcons() {
  const items = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        href: `/categories/${category.slug}`,
        icon: getCategoryIcon(category.iconKey),
        color: categoryAccentColors[category.accent],
      })),
    [],
  );

  return <GlassIcons items={items} />;
}
