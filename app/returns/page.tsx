import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Note, Section, Steps } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Returns",
  description:
    "How to request a return from Kashmiri Willow Bats — what to send us, how a request is reviewed, and what happens next.",
};

export default function ReturnsPage() {
  return (
    <ContentPage
      title="Returns"
      intro="Returns are handled by a person, not a form. Message us with your order reference and what is wrong, and we will tell you where you stand before you send anything back."
    >
      <Section title="How a return works">
        <Steps
          steps={[
            "Contact us on WhatsApp or by email and tell us you would like to return an item.",
            "Give us your order reference, which begins with KWB-, and the item concerned.",
            "Explain the reason. Be specific — a bat that is the wrong size is a different conversation from one that arrived damaged.",
            "Send photographs or a short video where the reason is something we need to see. For damage or a fault this is usually required.",
            "We review the request against the applicable policy and the condition of the item.",
            "If the return is approved we send you return instructions, including where to send it and how to pack it.",
            "Once the item reaches us and has been inspected, we confirm the outcome and the next step.",
          ]}
        />
      </Section>

      <Section title="Before you send anything back">
        {/* Stated plainly because an unauthorised return is the most common way a
            customer loses money in this process — the parcel arrives with nothing to
            match it against. */}
        <p>
          Please do not post an item back before we have confirmed the return. An
          unannounced parcel cannot be matched to an order, and the cost of sending it
          is not recoverable if the return would not have been approved.
        </p>
        <p>
          Keep the item in the condition it arrived in while the request is being
          reviewed. A bat that has been knocked in, oiled, used in a match or had its
          grip or stickers changed is no longer in a returnable condition, and that
          affects what we can do.
        </p>
      </Section>

      <Section title="What is usually not returnable">
        <p>
          Items made or altered to your specification — engraving, or a bat prepared to
          a requested weight or finish — cannot generally be returned unless there is a
          fault, because they cannot be sold to anyone else.
        </p>
        <p>
          Normal wear, damage caused by use, and damage from a ball or an impact are
          not returns. Where a bat has failed in normal play, that is a{" "}
          <Link
            href="/warranty"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            warranty question
          </Link>
          , and where it can be repaired, the{" "}
          <Link
            href="/bat-doctor"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Bat Doctor
          </Link>{" "}
          may be the better answer.
        </p>
      </Section>

      <Section title="Refunds">
        <p>
          Where a return leads to a refund, that is handled under our{" "}
          <Link
            href="/refund-policy"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            refund policy
          </Link>
          .
        </p>
      </Section>

      <SupportCta
        message={whatsappMessages.returns}
        label="Book a return"
        emailSubject="Return request"
      />

      <Note>
        Return windows, who pays return shipping, and restocking terms are not yet
        published as fixed figures. Each request is assessed individually until the
        business sets them, and this page will state them once it does.
      </Note>
    </ContentPage>
  );
}
