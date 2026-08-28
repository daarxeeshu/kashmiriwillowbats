import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContentPage, Section } from "@/components/content/ContentPage";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig, mainStore, subStores } from "@/data/site-config";
import {
  isWhatsAppConfigured,
  whatsappHref,
  whatsappMessages,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Kashmiri Willow Bats by email or WhatsApp for help choosing a bat, order support, returns and warranty claims.",
};

export default function ContactPage() {
  const waReady = isWhatsAppConfigured();

  return (
    <ContentPage
      title="Contact us"
      intro="Questions about a bat, an order, a return or a repair — a person answers, not a ticket queue. Email is the fastest way to reach us in writing; WhatsApp is best when it needs a conversation."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-border bg-surface-elevated p-5">
          <Mail className="size-5 text-accent" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold">Email</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            For orders, returns, warranty claims and anything that needs a record.
          </p>
          {/* The one published address. `break-all` because it is long enough to
              overflow a 320px card otherwise. */}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="mt-3 block break-all text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>
        </div>

        <div className="rounded-sm border border-border bg-surface-elevated p-5">
          <MessageCircle className="size-5 text-accent" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold">WhatsApp</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {waReady
              ? "Bat advice, order updates and quick questions."
              : "Our WhatsApp line is being set up. Until it is live, email reaches us just as quickly."}
          </p>
          {waReady && (
            <ButtonLink
              href={whatsappHref(whatsappMessages.general)}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="sm"
              className="mt-4"
            >
              <MessageCircle className="size-4" />
              Message us
            </ButtonLink>
          )}
        </div>
      </div>

      <Section title="What to include">
        <p>
          If your message is about an existing order, send the order reference — it
          begins with <span className="font-mono text-foreground">KWB-</span> and was
          shown when you placed the order. For a return, warranty claim or repair,
          photographs of the bat help us give you an answer in one reply instead of
          three.
        </p>
      </Section>

      <Section title="Visit us">
        <p>
          We have shops across the Kashmir Valley. Our main store is in{" "}
          <span className="text-foreground">{mainStore.name}</span>, with sub-stores in{" "}
          {subStores.map((s) => s.name).join(" and ")}. Bring a bat in and someone will
          look at it with you.
        </p>
        <p>
          <a
            href="/store"
            className="inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline"
          >
            <MapPin className="size-4" aria-hidden="true" />
            Store details
          </a>
        </p>
      </Section>

      <Section title="Response times">
        {/* No SLA is claimed. The business has not set one, and "within 24 hours" on a
            contact page is a promise the shop has to keep every day. */}
        <p>
          We reply as quickly as we can, usually the same day. If something is urgent —
          a delivery problem, or a bat that has arrived damaged — say so in the first
          line and we will prioritise it.
        </p>
      </Section>
    </ContentPage>
  );
}
