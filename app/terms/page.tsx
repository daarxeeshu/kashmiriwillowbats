import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Note, Section } from "@/components/content/ContentPage";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for using the Kashmiri Willow Bats website and for orders placed through it.",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms"
      intro="These terms cover using this website and ordering through it. We have kept them in plain language — where something is a genuine limit, it is stated as one rather than buried."
    >
      <Section title="Using this site">
        <p>
          You may browse, and use the site to place orders and contact us. Please do not
          attempt to disrupt it, access parts of it you have not been given access to,
          scrape it wholesale, or use it to send anything unlawful or abusive.
        </p>
      </Section>

      <Section title="Products and descriptions">
        <p>
          We describe products as accurately as we can. Cricket bats are made from a
          natural material: grain count, colour, marks and exact weight vary from bat to
          bat, and two bats of the same model will not be identical. Photographs are
          representative — the bat you receive will differ in these natural respects.
        </p>
        <p>
          Some listings on this site are clearly marked as placeholders while ranges are
          being stocked. Those carry development names and prices and are not offers to
          sell.
        </p>
      </Section>

      <Section title="Prices and availability">
        <p>
          Prices are shown in Indian Rupees. We may change prices and withdraw products
          at any time before an order is confirmed. Availability is not guaranteed by
          adding an item to a cart.
        </p>
        <p>
          If an obvious pricing or description error appears, we may decline or cancel
          an affected order rather than fulfil it at the incorrect figure. We will tell
          you if that happens.
        </p>
      </Section>

      <Section title="Orders and confirmation">
        <p>
          Placing an order on this site creates an order record and gives you a
          reference beginning{" "}
          <span className="font-mono text-foreground">KWB-</span>. That is a request to
          buy, not a concluded contract. The order is confirmed when we accept it and
          agree the final total with you — including delivery and any engraving — in the
          WhatsApp or email conversation that follows.
        </p>
        <p>
          We may decline an order, for example where an item is unavailable, where the
          delivery address cannot be served, or where we cannot verify the order.
        </p>
      </Section>

      <Section title="Payment">
        <p>
          No payment is taken on this website. Payment is arranged directly with us
          after the order is confirmed. We will never ask you for a PIN, a password or
          an OTP.
        </p>
      </Section>

      <Section title="Made-to-order items">
        <p>
          Bats configured to a specification — size, handle, profile, toe shape — and
          anything engraved are prepared for you specifically. Please check your
          engraving text before confirming: it is cut into the bat exactly as supplied.
        </p>
      </Section>

      <Section title="Delivery, returns and warranty">
        <p>
          Delivery is described in our{" "}
          <Link href="/shipping-policy" className="font-medium text-accent underline-offset-4 hover:underline">
            shipping policy
          </Link>
          , returns in our{" "}
          <Link href="/returns" className="font-medium text-accent underline-offset-4 hover:underline">
            returns page
          </Link>
          , refunds in our{" "}
          <Link href="/refund-policy" className="font-medium text-accent underline-offset-4 hover:underline">
            refund policy
          </Link>
          , and warranty cover in our{" "}
          <Link href="/warranty" className="font-medium text-accent underline-offset-4 hover:underline">
            warranty page
          </Link>
          . Those pages form part of these terms.
        </p>
      </Section>

      <Section title="Care and use">
        <p>
          Cricket equipment must be used for its intended purpose and prepared properly.
          A bat that has not been knocked in appropriately, or is used with a ball it
          was not made for, will fail in ways that are not manufacturing faults. Ask us
          if you are unsure — we would rather answer first.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          The content of this site — text, photographs, layout and code — belongs to us
          or to those we license it from. Brand names and logos belong to their
          respective manufacturers. Please do not reproduce any of it commercially
          without permission.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          We are responsible for supplying products as described and for putting things
          right where we get them wrong. To the extent the law allows, we are not liable
          for indirect or consequential losses — for example missed matches or lost
          opportunity — arising from a product, a delay, or the site being unavailable.
        </p>
        <p>
          Nothing here removes rights you have under consumer law that cannot be
          excluded.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          We may update these terms; the version on this page at the time you order is
          the one that applies. Questions to{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </Section>

      <Note>
        These terms are written in plain language for clarity and are not legal advice.
        They should be reviewed by a legal adviser before production launch, including
        the governing-law and dispute-resolution provisions, which are deliberately not
        stated here.
      </Note>
    </ContentPage>
  );
}
