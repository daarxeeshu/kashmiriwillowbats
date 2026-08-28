import { Mail, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/data/site-config";
import { isWhatsAppConfigured, whatsappHref } from "@/lib/whatsapp";

/* The action at the bottom of returns, warranty and refunds. All three end the same
 * way — talk to a person — so they share one control rather than three near-copies.
 *
 * When no WhatsApp number is configured the WhatsApp button is not rendered at all and
 * email becomes the primary action. It is not disabled, not greyed out and not pointed
 * at a placeholder: a button that looks live and goes nowhere costs more trust than a
 * button that was never offered. */

interface SupportCtaProps {
  /** Pre-filled opening for the WhatsApp thread. */
  message: string;
  /** Wording for the WhatsApp button — "Book a return", "Start a claim". */
  label: string;
  /** Subject line for the email fallback, so the inbox can be sorted. */
  emailSubject: string;
}

export function SupportCta({ message, label, emailSubject }: SupportCtaProps) {
  const waReady = isWhatsAppConfigured();

  return (
    <div className="mt-10 rounded-sm border border-border bg-surface-elevated p-5">
      <h2 className="text-sm font-semibold">Start here</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {waReady
          ? "Message us with your order reference and we will take it from there."
          : "Email us with your order reference and we will take it from there. Our WhatsApp line is being set up."}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {waReady && (
          <ButtonLink
            href={whatsappHref(message)}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="lg"
            className="flex-1"
          >
            <MessageCircle className="size-4" />
            {label}
          </ButtonLink>
        )}
        <ButtonLink
          href={`mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(emailSubject)}`}
          variant={waReady ? "outline" : "primary"}
          size="lg"
          className="flex-1"
        >
          <Mail className="size-4" />
          Email us
        </ButtonLink>
      </div>
    </div>
  );
}
