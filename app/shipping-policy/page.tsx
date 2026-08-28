import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Note, Section } from "@/components/content/ContentPage";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "How Kashmiri Willow Bats orders are processed, dispatched and tracked, and what happens if a delivery goes wrong.",
};

export default function ShippingPolicyPage() {
  return (
    <ContentPage
      title="Shipping Policy"
      intro="The terms that apply to dispatch and delivery. For a plainer walk-through of what happens to your order, see the shipping page."
      trail={[{ label: "Shipping", href: "/shipping" }]}
    >
      <Section title="Order processing">
        <p>
          Orders are processed once confirmed with you. Processing includes picking the
          item, checking it, and completing any made-to-order work — a specific size,
          handle, profile, toe shape or engraving. Made-to-order items take longer than
          stock items, and we tell you how much longer when we confirm.
        </p>
      </Section>

      <Section title="Dispatch and courier">
        <p>
          Orders are dispatched by third-party courier. We choose the courier based on
          the destination and the size of the consignment. Once we hand a parcel over,
          it is in the courier&apos;s network and their tracking is the live record of
          where it is.
        </p>
      </Section>

      <Section title="Shipping charges">
        <p>
          Shipping is charged according to the destination and the consignment. The
          amount is confirmed with you before dispatch, as part of agreeing the final
          total. Prepaid orders may qualify for promotional shipping terms where an
          offer to that effect is running.
        </p>
      </Section>

      <Section title="Delivery estimates">
        {/* No SLA. The business has not established one, and a policy page is exactly
            where an invented "3–5 working days" becomes a commitment. */}
        <p>
          Any delivery timeframe we give is an estimate provided by the courier, not a
          guaranteed date. Remote, hill and restricted-access locations take longer than
          standard estimates.
        </p>
        <p>
          Delays caused by weather, road conditions, strikes, public holidays,
          restrictions or courier backlogs are outside our control. We will pass on
          whatever the courier tells us.
        </p>
      </Section>

      <Section title="Addresses and failed deliveries">
        <p>
          You are responsible for the accuracy of the delivery address and contact
          number you give us. Where a delivery fails because the address was incomplete
          or incorrect, or because nobody was reachable, any additional cost of
          re-delivery or of the parcel being returned to us may be payable by you.
        </p>
      </Section>

      <Section title="Damage in transit">
        <p>
          Please inspect the packaging on delivery. If it is visibly damaged, photograph
          it before opening and photograph the contents as you unpack. Report it to{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>{" "}
          as soon as possible. Courier claims are materially harder to pursue once time
          has passed, so prompt reporting matters.
        </p>
      </Section>

      <Section title="Tracking and courier documentation">
        <p>
          When an order ships we record the courier, the tracking number and the courier
          slip against your order, and share the tracking details with you. Self-service{" "}
          <Link
            href="/track-order"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            online tracking
          </Link>{" "}
          is being built and is not connected yet.
        </p>
        <p>
          Courier documentation carries personal details, so it is held against the
          order and shared only with the customer that order belongs to.
        </p>
      </Section>

      <Section title="Title and risk">
        <p>
          Risk in the goods passes on delivery to the address you gave us. Where a
          parcel is signed for by someone else at that address, it is treated as
          delivered.
        </p>
      </Section>

      <Section title="International orders">
        <p>
          We do not currently publish international shipping terms. If you are ordering
          from outside India, contact us first and we will tell you whether we can ship
          to you and on what basis before you place an order.
        </p>
      </Section>

      <Note>
        Delivery timeframes, shipping rates and free-shipping thresholds are confirmed
        per order and are not yet published as fixed figures. This policy will state
        them once the business establishes them, and should be reviewed by a legal
        adviser before production launch.
      </Note>
    </ContentPage>
  );
}
