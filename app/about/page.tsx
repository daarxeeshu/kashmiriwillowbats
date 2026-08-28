import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Section } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { mainStore, subStores } from "@/data/site-config";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Cricket people from the Kashmir Valley, bringing the Valley's bat makers together in one place — and helping players choose the right bat.",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About us"
      intro="We are cricket people from the Kashmir Valley. This shop exists because we care how players get on with their bats — selling them is how we keep doing that, not the reason we started."
    >
      <Section title="Where we are from">
        <p>
          The Kashmir Valley has made cricket bats for generations. The willow grows
          here, the workshops are here, and so are the families who have been clefting,
          pressing and finishing bats for decades. We grew up around that — and around
          the cricket that goes with it, on grounds where a good bat is noticed and a
          bad one is quietly retired.
        </p>
        <p>
          Being from the Valley is not a marketing line for us. It is why we can walk
          into a workshop, look at a batch of clefts, and know which ones are worth
          putting our name next to.
        </p>
      </Section>

      <Section title="What we actually do">
        <p>
          We bring the Valley&apos;s established bat makers together in one place, so a
          player can compare real brands instead of guessing from a marketplace listing.
          Every brand on this site is a manufacturer we know and buy from directly. We
          do not relabel bats, and we do not invent names.
        </p>
        <p>
          The other half of the job is advice. Most players do not need the most
          expensive bat — they need the right weight, the right pickup and an honest
          answer about whether a bat suits how they bat. We would rather sell you a
          cheaper bat you keep using than an expensive one that sits in a bag.
        </p>
      </Section>

      <Section title="Knowing the willow">
        <p>
          Kashmir Willow is denser and harder than English willow. It rewards being
          understood: knocked in properly, matched to the right ball, and maintained, it
          lasts. Badly prepared, it will fail in ways people then blame on the timber.
        </p>
        <p>
          So we tell customers how to prepare a bat, we repair bats through the{" "}
          <Link
            href="/bat-doctor"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Bat Doctor
          </Link>{" "}
          rather than writing them off, and we are straight about what a{" "}
          <Link
            href="/warranty"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            warranty
          </Link>{" "}
          does and does not cover. A bat that has been used well and repaired well is
          better for the player than a replacement every season.
        </p>
      </Section>

      <Section title="Come and see us">
        <p>
          We have shops across the Valley — the main store at{" "}
          <span className="text-foreground">{mainStore.name}</span>, with sub-stores in{" "}
          {subStores.map((s) => s.name).join(" and ")}. Picking up a bat is still the
          best way to choose one, and we are happy to spend the time.
        </p>
        <p>
          If you cannot get to us, message us. We will ask what you play, where you
          score your runs and what you are using now, and go from there.
        </p>
      </Section>

      <SupportCta
        message={whatsappMessages.batExpert}
        label="Talk to a bat expert"
        emailSubject="Bat advice"
      />
    </ContentPage>
  );
}
