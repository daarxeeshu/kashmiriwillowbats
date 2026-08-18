import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/catalog/ComingSoonPage";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  return (
    <ComingSoonPage
      title="Wishlist"
      description="Save favourite bats and equipment here once customer accounts are live."
    />
  );
}
