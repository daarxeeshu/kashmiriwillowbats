import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart",
  // Per-visitor and empty to a crawler, so there is nothing here worth indexing and a
  // thin duplicate page to lose if it were.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartView />;
}
