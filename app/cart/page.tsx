import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/catalog/ComingSoonPage";

export const metadata: Metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <ComingSoonPage
      title="Your cart"
      description="Online cart and checkout with Razorpay are being built. For now, order directly on WhatsApp with the same expert support."
      actionHref="/categories/kashmir-willow-bats"
      actionLabel="Continue shopping"
    />
  );
}
