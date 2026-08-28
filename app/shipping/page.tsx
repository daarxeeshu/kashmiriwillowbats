import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Note, Section, Steps } from "@/components/content/ContentPage";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "How Kashmiri Willow Bats orders are prepared, packed and dispatched, and how tracking details reach you.",
};

export default function ShippingPage() {
  return (
    <ContentPage
      title="Shipping"
      intro="Every bat is checked and prepared before it is packed. Here is what happens between your order being confirmed and it arriving."
    >
      <Section title="How an order moves">
        <Steps
          steps={[
            "You place the order on the site and confirm it with us on WhatsApp. Nothing is charged online — we agree the final total, including delivery, in that conversation.",
            "We pick the bat, check it, and prepare it. Anything made to order — a specific size, handle, profile or engraving — is completed at this stage.",
            "The order is packed with toe protection and a bat cover, in packaging built for a long, thin item that will be handled several times.",
            "We hand it to the courier and record the courier name, the tracking number and the courier slip against your order.",
            "We send you the tracking details. From that point the parcel is with the courier and their tracking is the live record of where it is.",
          ]}
        />
      </Section>

      <Section title="Delivery times and charges">
        {/* Deliberately no figure. The business has not set an SLA or a rate card, and
            a number invented here becomes a promise the shop has to keep. */}
        <p>
          Delivery time and cost depend on where the order is going and what is in it.
          We confirm both with you on WhatsApp before the order is dispatched, so you
          know the total and the expected timeframe before anything ships.
        </p>
        <p>
          Remote and hill locations take longer than the courier&apos;s standard
          estimate, and weather, road closures and public holidays can delay a delivery
          beyond anyone&apos;s control. If a parcel is running late we will tell you
          what the courier has told us.
        </p>
      </Section>

      <Section title="Tracking your order">
        <p>
          Once an order has shipped we share the courier name and tracking number. You
          can also{" "}
          <Link
            href="/track-order"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            look up your order
          </Link>{" "}
          with your order reference.
        </p>
      </Section>

      <Section title="Addresses and delivery attempts">
        <p>
          Please check the delivery address and phone number before confirming — an
          incomplete address is the most common cause of a failed delivery, and a
          parcel returned to us has to be shipped again.
        </p>
        <p>
          Couriers usually attempt delivery more than once and may call the number on
          the parcel. If they cannot reach you, the parcel may be held at a local hub
          or returned to sender.
        </p>
      </Section>

      <Section title="If a parcel arrives damaged">
        <p>
          Check the packaging before you accept it. If the box is visibly damaged,
          photograph it before opening, and photograph the bat as you unpack it. Send
          those to{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>{" "}
          as soon as you can — a claim against a courier is far easier to make in the
          first days than weeks later.
        </p>
      </Section>

      <Note>
        Delivery timeframes and shipping charges are confirmed per order and are not
        yet published as fixed figures. This page will state them once the business has
        set them.
      </Note>
    </ContentPage>
  );
}
