import type { Metadata } from "next";
import { ContentPage, Note, Section } from "@/components/content/ContentPage";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What information Kashmiri Willow Bats collects, why, how it is used and stored, and how to contact us about it.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="This explains what we collect, why, and what we do with it. It describes how the site works today — not features we have not built."
    >
      <Section title="What we collect">
        <p>When you place an order or contact us, we collect:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Your name, phone number and, if you give one, your email address.</li>
          <li>The delivery address you provide.</li>
          <li>
            Order details — the items, quantities, any made-to-order specification such
            as size, handle, profile or toe shape, and any engraving text.
          </li>
          <li>Anything you write to us, including notes on an order and support messages.</li>
          <li>
            Bat Doctor submissions: the details of the bat, the damage described, and
            any photographs or video you send.
          </li>
        </ul>
        <p>
          {/* Deliberately explicit. The site currently has no analytics, no advertising
              pixels, no cookie banner and no payment processor, and claiming otherwise
              in a privacy policy is exactly the wrong kind of error. */}
          This site does not run analytics or advertising trackers, sets no cookies for
          tracking, and takes no payment online — so there is no payment data, no
          browsing profile and no third-party advertising identifier associated with
          you. If that changes, this policy is updated before it does.
        </p>
        <p>
          Your cart is stored in your own browser and is not sent to us until you place
          an order. Our hosting provider records standard technical logs such as IP
          address and browser type, as any web server does, for security and
          reliability.
        </p>
      </Section>

      <Section title="Why we collect it">
        <p>
          To fulfil your order and talk to you about it: preparing the right bat,
          delivering it to the right address, answering questions, and handling returns,
          refunds, warranty claims and repairs. We also keep order records so that a
          later claim can be checked against the original purchase.
        </p>
        <p>
          We do not sell your information, and we do not send marketing to people who
          have not asked for it.
        </p>
      </Section>

      <Section title="Who may receive it">
        <p>
          Only those who need it to complete what you asked for: couriers receive the
          name, address and phone number needed to deliver, and workshop staff receive
          the specification needed to prepare or repair a bat. Service providers who
          host the site handle data on our behalf.
        </p>
        <p>
          We may disclose information where we are legally required to do so.
        </p>
      </Section>

      <Section title="Storage and security">
        <p>
          We take reasonable steps to protect the information you give us and limit
          access to those who need it. No system is completely secure, and we do not
          claim otherwise — but we do not ask for anything we do not need, which is the
          most effective protection available.
        </p>
        <p>
          We will never ask you for a card number, a PIN, a password or an OTP over
          WhatsApp, email or the phone. If someone does, it is not us.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Order and support records are kept for as long as we need them to service the
          order, honour warranties, and meet legal and accounting obligations. Bat
          Doctor photographs are kept while the repair is assessed and carried out.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can ask us what we hold about you, ask for it to be corrected, or ask us
          to delete it where we are not required to keep it. Write to{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>{" "}
          and tell us what you would like. Clearing your browser storage removes the
          cart held on your device.
        </p>
      </Section>

      <Section title="Children">
        <p>
          We sell junior cricket equipment, and we expect a parent or guardian to place
          those orders. This site is not intended for children to use unsupervised.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If this policy changes we will publish the updated version on this page. For
          anything about your information, contact{" "}
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
        This policy describes current practice and is not legal advice. It should be
        reviewed by the business and a legal adviser before production launch, and
        revisited whenever analytics, payments or third-party services are added.
      </Note>
    </ContentPage>
  );
}
