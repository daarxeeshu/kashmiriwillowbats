import {
  Backpack,
  Circle,
  Footprints,
  Hand,
  HardHat,
  Package,
  Shield,
  ShieldHalf,
} from "lucide-react";
import type { Category, CategoryIconKey } from "@/types/commerce";
import { CricketBatIcon } from "@/components/ui/icons/CricketBatIcon";
import type { ReactElement } from "react";

const iconClass = "h-full w-full";

export function getCategoryIcon(iconKey: CategoryIconKey): ReactElement {
  switch (iconKey) {
    case "kashmir-willow":
    case "english-willow":
      return <CricketBatIcon className={iconClass} />;
    case "gloves":
      return <Hand className={iconClass} strokeWidth={1.75} />;
    case "pads":
      return <Shield className={iconClass} strokeWidth={1.75} />;
    case "thigh-guard":
      return <ShieldHalf className={iconClass} strokeWidth={1.75} />;
    case "helmet":
      return <HardHat className={iconClass} strokeWidth={1.75} />;
    case "ball":
      return <Circle className={iconClass} strokeWidth={1.75} />;
    case "shoes":
      return <Footprints className={iconClass} strokeWidth={1.75} />;
    case "bag":
      return <Backpack className={iconClass} strokeWidth={1.75} />;
    case "accessories":
      return <Package className={iconClass} strokeWidth={1.75} />;
    default:
      return <Package className={iconClass} strokeWidth={1.75} />;
  }
}

export function categoryToGlassItem(category: Category) {
  return {
    label: category.name,
    href: `/categories/${category.slug}`,
    icon: getCategoryIcon(category.iconKey),
    color: "", // filled by caller from accent map
  };
}
