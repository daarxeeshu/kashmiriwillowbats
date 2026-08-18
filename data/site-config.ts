import type { Announcement, Benefit, NavItem, TrustPoint } from "@/types/commerce";

export const siteConfig = {
  name: "Kashmiri Willow Bats",
  shortName: "KWB",
  domain: "kashmiriwillowbats.com",
  url: "https://kashmiriwillowbats.com",
  description:
    "Authentic Kashmir Willow bats and professional cricket equipment. Multi-brand cricket store from Kashmir — KIS, JK, Valleywoods, SLS, Woodford & more.",
  tagline: "The Home of Kashmiri Willow",
  engraving: {
    price: 200,
    freeThreshold: 6000,
  },
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    whatsapp: "https://wa.me/",
  },
} as const;

/** Rotating announcement bar — later sourced from CMS/database */
export const announcements: Announcement[] = [
  {
    id: "free-shipping",
    message: "Free shipping on prepaid orders",
    href: "/offers",
  },
  {
    id: "free-engraving",
    message: "Free engraving above ₹6,000",
    href: "/customize",
  },
  {
    id: "bat-expert",
    message: "24/7 bat expert support",
    href: "#bat-expert",
  },
];

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Kashmir Willow", href: "/categories/kashmir-willow-bats" },
  { label: "English Willow", href: "/categories/english-willow-bats" },
  { label: "Equipment", href: "/categories/cricket-equipment" },
  { label: "Brands", href: "/brands" },
  { label: "Offers", href: "/offers" },
];

export const trustPoints: TrustPoint[] = [
  {
    id: "authentic",
    title: "Authentic Products",
    description: "Multiple established cricket brands from Kashmir's cricket hub.",
    icon: "shield-check",
  },
  {
    id: "expert",
    title: "Expert Bat Selection",
    description: "Speak directly with cricket specialists who know willow, weight, and pickup.",
    icon: "message-circle",
  },
  {
    id: "engraving",
    title: "Custom Engraving",
    description: "Laser name engraving on-site — personalize your bat before dispatch.",
    icon: "pen-tool",
  },
  {
    id: "delivery",
    title: "Safe Delivery",
    description: "Professional packaging, toe protection, and bat cover included.",
    icon: "package",
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "WhatsApp assistance whenever you need help choosing or tracking.",
    icon: "headphones",
  },
  {
    id: "proof",
    title: "Real Customer Proof",
    description: "Unboxing and ping-test videos from verified buyers.",
    icon: "video",
  },
];

export const includedBenefits: Benefit[] = [
  { id: "cover", label: "Free Bat Cover", icon: "shield" },
  { id: "toe", label: "Free Toe Protection", icon: "footprints" },
  { id: "delivery", label: "Safe Delivery", icon: "truck" },
  { id: "support", label: "Expert Support", icon: "users" },
  { id: "prep", label: "Fresh Bat Preparation", icon: "sparkles" },
];
