import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Note, Section, Steps } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Warranty",
  description:
    "Lifetime handle break warranty and stroke warranty on Kashmiri Willow Bats — what is covered, what is not, and how to make a claim.",
};

export default function WarrantyPage() {
  return (
    <ContentPage
      title="Warranty"
      intro="We stand behind the bats we sell. Two warranties apply, and both are assessed on the bat itself — so this page sets out plainly what they cover and what they do not."
    >
      <Section title="Lifetime handle break warranty">
        <p>
          A cricket bat handle is a laminated cane structure, and a handle that fails
          because of how it was made is a manufacturing fault rather than something you
          did. Where a handle breaks in normal play and inspection shows a fault in the
          handle or its splice, we cover it.
        </p>
        <p>
          &ldquo;Lifetime&rdquo; refers to the working life of the bat in normal use.
          It does not mean a bat is replaced indefinitely, and it does not cover a
          handle damaged by misuse, by a repair someone else carried out, or by
          conditions the bat was never made for.
        </p>
      </Section>

      <Section title="Stroke warranty">
        <p>
          Willow is a natural material and a bat is expected to mark, seam and compress
          as it is played in. The stroke warranty covers a blade that fails
          structurally in normal play in a way that points to the willow or the making,
          rather than to how the bat was used.
        </p>
        <p>
          Surface cracking, toe wear, edge marks and grain lifting are normal in a
          used bat and are not in themselves failures. Many are repairable — see the{" "}
          <Link
            href="/bat-doctor"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Bat Doctor
          </Link>
          .
        </p>
      </Section>

      <Section title="What a claim is assessed against">
        {/* The brief was explicit that this must not read as "every broken bat is
            replaced". These conditions are the substance of the policy, not a
            disclaimer bolted on, so they get their own section rather than a footnote. */}
        <p>Every claim is reviewed individually. We look at:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <span className="text-foreground">Authenticity and provenance</span> — that
            the bat was bought from us, and that it is the bat on the order.
          </li>
          <li>
            <span className="text-foreground">Evidence</span> — clear photographs, and
            video where the failure needs to be seen happening.
          </li>
          <li>
            <span className="text-foreground">Inspection</span> — in many cases we need
            the bat in hand before a decision can be made.
          </li>
          <li>
            <span className="text-foreground">Normal use</span> — that the bat was used
            for the cricket it was made for, with an appropriate ball, and knocked in
            and maintained as advised.
          </li>
          <li>
            <span className="text-foreground">Exclusions</span> — damage from misuse,
            neglect, moisture, storage, third-party repairs or alterations, and normal
            wear.
          </li>
        </ul>
        <p>
          Where a claim is upheld, the remedy — repair, replacement or another
          resolution — is determined by us based on the bat and the fault. A claim
          being made does not by itself entitle a bat to be replaced.
        </p>
      </Section>

      <Section title="Knocking in and care">
        <p>
          A bat that has not been knocked in properly will fail in ways that look like
          faults and are not. If you are unsure whether a bat is ready to face a hard
          ball, ask us before you use it — we would much rather have that conversation
          first.
        </p>
        <p>
          Hard tennis-ball bats, and bats used with a ball they were not made for, are
          assessed on that basis.
        </p>
      </Section>

      <Section title="Making a claim">
        <Steps
          steps={[
            "Contact us on WhatsApp or by email and tell us you would like to make a warranty claim.",
            "Send your order reference and purchase details so we can identify the bat.",
            "Send clear photographs of the whole bat and close-ups of the failure. Video helps where the fault only shows under load.",
            "We review what you have sent and tell you whether we need the bat in hand.",
            "The claim is assessed against the conditions above.",
            "We come back to you with the outcome and the next step.",
          ]}
        />
      </Section>

      <SupportCta
        message={whatsappMessages.warranty}
        label="Start a warranty claim"
        emailSubject="Warranty claim"
      />

      <Note>
        Warranty periods, turnaround times and the remedies offered are decided by the
        business and are not published here as fixed terms. This page describes the
        policy in principle and should be reviewed by the business before launch.
      </Note>
    </ContentPage>
  );
}
