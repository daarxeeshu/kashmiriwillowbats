import type { Offer } from "@/types/commerce";

/** Display-only offers — coupon logic lives in future commerce backend */
export const offers: Offer[] = [
  {
    id: "first-order",
    title: "First Order",
    description: "5% off your first purchase",
    code: "KISFIRSTORDER",
    highlight: "5% OFF",
  },
  {
    id: "buy-3",
    title: "Buy Any 3",
    description: "Save on team orders",
    code: "KISSAVE10",
    highlight: "10% OFF",
  },
  {
    id: "buy-6",
    title: "Buy Any 6",
    description: "Ideal for club squads",
    code: "KISSAVE15",
    highlight: "15% OFF",
  },
  {
    id: "buy-11",
    title: "Buy Any 11",
    description: "Full team bundle savings",
    code: "KISFULLTEAM",
    highlight: "20% OFF",
  },
  {
    id: "prepaid",
    title: "Prepaid Orders",
    description: "Free shipping on prepaid checkout",
    code: "KASHMIR",
    highlight: "FREE SHIPPING",
  },
];
