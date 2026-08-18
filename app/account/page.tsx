import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/catalog/ComingSoonPage";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <ComingSoonPage
      title="Your account"
      description="Customer accounts, order history, and tracking will be available in a future release."
    />
  );
}
