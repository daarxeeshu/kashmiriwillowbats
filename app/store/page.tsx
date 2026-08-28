import type { Metadata } from "next";
import { MapPin, Store } from "lucide-react";
import { ContentPage, Note, Section } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { mainStore, subStores, type StoreLocation } from "@/data/site-config";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Physical stores",
  description:
    "Visit Kashmiri Willow Bats in person — main store at Sangam, Bijbehara, with sub-stores in Kulgam and Srinagar.",
};

/* One card, two roles. Optional fields render only when the business has supplied
 * them: a card with no street address simply does not show one, rather than showing
 * "Address: TBC" or a guessed line. */
function StoreCard({
  store,
  role,
  primary,
}: {
  store: StoreLocation;
  role: string;
  primary?: boolean;
}) {
  return (
    <div
      className={
        primary
          ? "rounded-sm border border-accent/40 bg-accent/[0.06] p-5"
          : "rounded-sm border border-border bg-surface-elevated p-5"
      }
    >
      <div className="flex items-center gap-2">
        {primary ? (
          <Store className="size-4 text-accent" aria-hidden="true" />
        ) : (
          <MapPin className="size-4 text-muted" aria-hidden="true" />
        )}
        <p
          className={
            primary
              ? "text-[11px] font-semibold uppercase tracking-[0.14em] text-accent"
              : "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
          }
        >
          {role}
        </p>
      </div>

      <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
        {store.name}
      </h3>
      {store.area && (
        <p className="mt-1 text-sm text-muted-foreground">{store.area}</p>
      )}
      {store.addressLine && (
        <p className="mt-2 text-sm text-muted-foreground">{store.addressLine}</p>
      )}
      {store.hours && <p className="mt-2 text-sm text-muted-foreground">{store.hours}</p>}
      {store.mapUrl && (
        <a
          href={store.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Open in maps
        </a>
      )}
    </div>
  );
}

export default function StorePage() {
  return (
    <ContentPage
      title="Physical stores"
      intro="Visit us in person. Picking up a bat is still the best way to choose one — you can feel the pickup, compare weights side by side, and get an honest opinion from someone who plays."
    >
      <div className="grid gap-4">
        <StoreCard store={mainStore} role="Main store" primary />
      </div>

      <Section title="Sub-stores">
        <div className="grid gap-4 sm:grid-cols-2">
          {subStores.map((store) => (
            <StoreCard key={store.id} store={store} role="Sub-store" />
          ))}
        </div>
      </Section>

      <Section title="What you can do in store">
        <p>
          Compare bats across the Valley&apos;s brands in one place, have your pickup
          and weight assessed properly, arrange engraving, or bring in a damaged bat for
          the Bat Doctor to look at. If you are buying for a junior, bring them — size
          follows height, and a five-minute fitting saves an expensive mistake.
        </p>
      </Section>

      <Section title="Before you travel">
        {/* No opening hours are published because the business has not supplied them.
            A guessed "10am–7pm" on a shop page sends someone to a closed door. */}
        <p>
          Message us before setting out, especially if you want a specific brand,
          weight or size — we can check it is at the store you are visiting rather than
          another one, and set a few aside for you to compare.
        </p>
      </Section>

      <SupportCta
        message={whatsappMessages.store}
        label="Ask about a visit"
        emailSubject="Store visit"
      />

      <Note>
        Street addresses, opening hours, store phone numbers and map links are not
        published here yet. They are held in one place in the site configuration and
        appear on these cards automatically once the business supplies them.
      </Note>
    </ContentPage>
  );
}
