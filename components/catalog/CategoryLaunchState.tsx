import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

interface CategoryLaunchStateProps {
  categoryName: string;
}

/* ── A category that has been announced but is not yet stocked ────────────────────
 *
 * Distinct from the "no products listed yet" state in `CatalogProductGrid`, and the
 * difference is the message rather than the styling. That one is for a category whose
 * products exist and have not been digitised, so it offers WhatsApp as the way to buy
 * one today. This one is for a category with nothing behind it yet, where the useful
 * offer is somewhere else to look now and a way to be told when it lands.
 *
 * The alternative was six placeholder cards with invented names and prices. That is
 * the one thing the brief rules out twice, and rightly: a customer cannot tell a
 * development placeholder from stock, and a bat with a price on it is a promise. */

export function CategoryLaunchState({ categoryName }: CategoryLaunchStateProps) {
  return (
    <div className="rounded-sm border border-border bg-surface px-6 py-14 text-center sm:py-16">
      <p className="eyebrow text-accent">Launching soon</p>
      <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Our first {categoryName} collection is coming soon.
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        We are finalising the range now. Our bat expert can tell you what is coming and
        reserve one for you before it is listed.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {/* Points at the populated bats category rather than an "all bats" route,
            because there is no such route in this app and inventing a link that 404s
            would be worse than naming the real destination. */}
        <Link
          href="/categories/kashmir-willow-bats"
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-forest bg-forest px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Explore Kashmir Willow bats
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
        <ButtonLink
          href={buildWhatsAppUrl(whatsappMessages.batExpert)}
          target="_blank"
          rel="noopener noreferrer"
          variant="expert"
          size="md"
        >
          Ask about {categoryName}
        </ButtonLink>
      </div>
    </div>
  );
}
