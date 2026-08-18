import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/catalog/ComingSoonPage";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <ComingSoonPage
      title="Search"
      description="Product search will be available once the full catalogue is connected to the database."
    />
  );
}
