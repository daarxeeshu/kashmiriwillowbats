import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Note, Section, Steps } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "When a refund may apply on a Kashmiri Willow Bats order, what proof is needed, and how a request is assessed.",
};

export default function RefundPolicyPage() {
  return (
    <ContentPage
      title="Refund Policy"
      intro="If equipment does not meet your expectation, a refund may apply. Whether it does depends on the item, its condition and the reason — so this page sets out how a request is assessed rather than promising an outcome."
    >
      <Section title="The principle">
        <p>
          We would rather put something right than argue about it. If a bat is not what
          you expected, tell us early and tell us specifically — the sooner we hear, and
          the less the bat has been used, the more we can do.
        </p>
        <p>
          {/* The brief was explicit that this must not read as "any product, any
              reason". Stating the limit up front is more honest than burying it. */}
          This is not a no-questions-asked policy. A refund is considered on the facts
          of the individual case, and a request being made does not by itself entitle an
          order to be refunded.
        </p>
      </Section>

      <Section title="How to request a refund">
        <Steps
          steps={[
            "Contact us on WhatsApp or by email and tell us you would like to request a refund.",
            "Give your order reference, beginning KWB-, and the item concerned.",
            "State the reason clearly — what you expected, and how the item differs.",
            "Send photographs or video where we need to see the issue. For damage, a fault, or a wrong item, this is normally required.",
            "We review the request, and may ask for the item to be returned for inspection.",
            "Eligibility is determined against this policy and the condition of the item.",
            "If a refund is approved, we confirm the amount and process it through the same arrangement the order was paid by.",
          ]}
        />
      </Section>

      <Section title="What affects eligibility">
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <span className="text-foreground">Condition.</span> An unused bat in its
            original state is treated very differently from one that has been knocked
            in, oiled, re-gripped, had stickers changed, or played with.
          </li>
          <li>
            <span className="text-foreground">Reason.</span> A wrong or faulty item, or
            one that does not match its description, is a stronger case than a change of
            mind.
          </li>
          <li>
            <span className="text-foreground">Evidence.</span> Photographs and video
            where the issue needs to be seen.
          </li>
          <li>
            <span className="text-foreground">Timing.</span> Raised promptly after
            delivery rather than after a season of use.
          </li>
          <li>
            <span className="text-foreground">Made-to-order work.</span> Engraved bats
            and bats prepared to your specification cannot generally be refunded unless
            faulty, because they cannot be sold to anyone else.
          </li>
        </ul>
      </Section>

      <Section title="What is not a refund matter">
        <p>
          Normal wear, damage caused by use or impact, and damage from inadequate
          knocking in or from using a ball the bat was not made for are not refundable.
          Where a bat has failed in normal play, that is assessed under the{" "}
          <Link
            href="/warranty"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            warranty
          </Link>
          ; where it can be repaired, the{" "}
          <Link
            href="/bat-doctor"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Bat Doctor
          </Link>{" "}
          is often the better outcome for the player.
        </p>
      </Section>

      <Section title="Approved refunds">
        <p>
          An approved refund is returned through the same arrangement the order was paid
          by. Where an item has to come back to us first, the refund follows inspection.
          Delivery charges already incurred may not be refundable depending on the
          reason for the return.
        </p>
      </Section>

      <SupportCta
        message={whatsappMessages.refund}
        label="Request a refund"
        emailSubject="Refund request"
      />

      <Note>
        Refund windows, processing timeframes and who bears return shipping are not yet
        published as fixed terms — the business has not set them, and stating a number
        here would commit it to one. This page will state them once established, and
        should be reviewed by a legal adviser before production launch.
      </Note>
    </ContentPage>
  );
}
