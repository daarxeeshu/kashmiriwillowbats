export interface Brand {
  id: string;
  slug: string;
  name: string;
  descriptor?: string;
  logo?: string;
  image?: string;
  productCount?: number;
  isFlagship?: boolean;
}

export type CategoryIconKey =
  | "kashmir-willow"
  | "english-willow"
  | "gloves"
  | "pads"
  | "thigh-guard"
  | "helmet"
  | "ball"
  | "shoes"
  | "bag"
  | "accessories";

export type CategoryAccent = "forest" | "brass" | "charcoal" | "sage" | "warm";

export interface Category {
  id: string;
  slug: string;
  name: string;
  descriptor: string;
  image: string;
  iconKey: CategoryIconKey;
  accent: CategoryAccent;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  image: string;
  mrp?: number;
  price: number;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  categorySlug: string;
  featured?: boolean;
  flagship?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  code?: string;
  highlight?: string;
}

export interface Announcement {
  id: string;
  message: string;
  href?: string;
}

export interface TrustPoint {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Benefit {
  id: string;
  label: string;
  icon: string;
}

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}
