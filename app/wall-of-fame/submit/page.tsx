import type { Metadata } from "next";
import { ContentPage, Note, Section, Steps } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Submit your photo",
  description:
    "Send us a photograph of you playing with your Kashmiri Willow bat to be featured on the Wall of Fame.",
};

/* No form here, and that is the honest state of it.
 *
 * A photo submission needs somewhere to put a file, a record to attach it to, and an
 * admin who can approve it — none of which exist yet. A form that collected a name, a
 * photograph and a consent tick and then dropped all three would be worse than no form:
 * people would believe they had entered, and for a parent consenting on a child's
 * behalf it would be a promise made and silently broken.
 *
 * So this page explains the process and hands over to the channels that do work today.
 * When storage and the admin exist, the form replaces the middle of this page and the
 * notice comes out. */

export default function SubmitPhotoPage() {
  return (
    <ContentPage
      title="Submit your photo"
      trail={[{ label: "Wall of Fame", href: "/wall-of-fame" }]}
      intro="Brought a KW bat onto the ground? Send us the photograph and we will put you on the Wall of Fame."
    >
      <Section title="How to send it">
        <Steps
          steps={[
            "Message us on WhatsApp or email the photograph to us.",
            "Tell us the name you want shown — first name only is fine.",
            "Tell us which bat you are playing with, and your club, district or ground if you would like that shown.",
            "Say in one line whether you are a customer, a club player, an age-group player, or playing professionally.",
            "Confirm you are happy for us to publish the photograph on this website.",
            "We review it and add it to the wall. We will tell you when it is live.",
          ]}
        />
      </Section>

      <Section title="Players under 18">
        {/* The strongest wording on the page, deliberately. */}
        <p>
          If the player is under 18, a parent or guardian must send the photograph and
          confirm they are happy for it to be published. We will not put a young
          player&apos;s photograph on the site without that, and we will take it down at
          any time if a parent or guardian asks — no reason needed.
        </p>
        <p>
          We do not publish a child&apos;s school, home area, phone number or anything
          that would identify where to find them. A first name and a club or district
          is as far as it goes.
        </p>
      </Section>

      <Section title="What we will not publish">
        <p>
          Photographs of someone who has not agreed to appear. Anything with a phone
          number, address or other personal contact detail visible in the frame. Images
          you do not have the right to share — if a professional photographer took it,
          they own it, and we would need their permission too.
        </p>
      </Section>

      <Section title="Taking it down">
        <p>
          Changed your mind? Write to{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>{" "}
          and we will remove your photograph. You do not have to explain why.
        </p>
      </Section>

      <SupportCta
        message="Hi, I'd like to send a photo for the Wall of Fame."
        label="Send your photo"
        emailSubject="Wall of Fame submission"
      />

      <Note>
        There is no upload form on this page yet — photo storage and the review queue
        are still being built, and a form that accepted a photograph with nowhere to put
        it would be a promise we could not keep. Send it by WhatsApp or email meanwhile;
        both reach a person. The form replaces this section once the backend exists.
      </Note>
    </ContentPage>
  );
}
