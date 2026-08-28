import type { Metadata } from "next";
import { ContentPage, Note } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { TrackOrderForm } from "@/components/content/TrackOrderForm";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Check where your Kashmiri Willow Bats order is. Online tracking is being built; until then we will look it up for you.",
  robots: { index: false, follow: true },
};

export default function TrackOrderPage() {
  return (
    <ContentPage
      title="Track your order"
      intro="Online order lookup is being built and is not connected yet. The form below shows what it will ask for; until it is live, send us your order reference and we will tell you exactly where your order is."
    >
      <TrackOrderForm />

      <SupportCta
        message={whatsappMessages.support}
        label="Ask about my order"
        emailSubject="Order status"
      />

      <Note>
        This page has no order database behind it. Nothing is looked up and no order
        data is shown. When the order store and admin exist, the form connects to a
        lookup endpoint and this notice comes out.
      </Note>
    </ContentPage>
  );
}
