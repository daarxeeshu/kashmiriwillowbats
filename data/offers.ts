import type { Offer } from "@/types/commerce";

/** Display-only offers — coupon logic lives in future commerce backend */
export const offers: Offer[] = [
  {
    id: "first-order",
    title: "First Order",
    description: "5% off your first purchase",
    code: "KISFIRSTORDER",
    percentOff: 5,
    highlight: "5% OFF",
  },
  {
    id: "buy-3",
    title: "Buy Any 3",
    description: "Save on team orders",
    code: "KISSAVE10",
    percentOff: 10,
    minItems: 3,
    highlight: "10% OFF",
  },
  {
    id: "buy-6",
    title: "Buy Any 6",
    description: "Ideal for club squads",
    code: "KISSAVE15",
    percentOff: 15,
    minItems: 6,
    highlight: "15% OFF",
  },
  {
    id: "buy-11",
    title: "Buy Any 11",
    description: "Full team bundle savings",
    code: "KISFULLTEAM",
    percentOff: 20,
    minItems: 11,
    highlight: "20% OFF",
  },
  {
    id: "prepaid",
    title: "Prepaid Orders",
    description: "Free shipping on prepaid checkout",
    code: "KASHMIR",
    freeShipping: true,
    highlight: "FREE SHIPPING",
  },
];
