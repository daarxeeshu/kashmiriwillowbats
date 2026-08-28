import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Cricket Bat Size Guide",
  description:
    "Find the right cricket bat size by height and age — Size 3 to Short Handle and Long Handle, with Harrow in between.",
};

/* Heights are the standard trade chart, which is keyed off player height rather than
 * age: age is what people know and height is what actually decides the bat, so both
 * are shown and the copy says which one wins. */
const SIZES: { size: string; age: string; height: string }[] = [
  { size: "Size 3", age: "6–7 yrs", height: "1.44–1.50 m (4'9\"–4'11\")" },
  { size: "Size 4", age: "7–8 yrs", height: "1.50–1.55 m (4'11\"–5'1\")" },
  { size: "Size 5", age: "8–9 yrs", height: "1.55–1.60 m (5'1\"–5'3\")" },
  { size: "Size 6", age: "9–11 yrs", height: "1.63–1.68 m (5'4\"–5'6\")" },
  { size: "Harrow", age: "11–13 yrs", height: "1.68–1.75 m (5'6\"–5'9\")" },
  { size: "Short Handle (SH)", age: "13+ / adult", height: "1.75–1.85 m (5'9\"–6'2\")" },
  { size: "Long Handle (LH)", age: "Adult", height: "Over 1.85 m (6'2\"+)" },
];

export default function SizeGuidePage() {
  return (
    <Container className="section-padding">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Size guide" }]}
      />

      <h1 className="heading-lg mt-6">Cricket bat size guide</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Bat size follows height, not age. The age column is a rough guide only — a tall
        eleven-year-old should be on a Harrow, not a Size 6. If a player is between two
        sizes, take the smaller one: a bat that is too long is harder to control than
        one that is slightly short.
      </p>

      {/* The table scrolls inside its own box rather than widening the page. Three
          columns of this length do not fit a 320px phone, and a page that scrolls
          sideways is worse than a table that does. */}
      <div className="mt-8 overflow-x-auto rounded-sm border border-border">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Cricket bat sizes by player height and approximate age
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface-elevated">
              <th scope="col" className="px-4 py-3 font-semibold">Bat size</th>
              <th scope="col" className="px-4 py-3 font-semibold">Player height</th>
              <th scope="col" className="px-4 py-3 font-semibold">Approx. age</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((row) => (
              <tr key={row.size} className="border-b border-border last:border-0">
                <th scope="row" className="px-4 py-3 font-medium text-foreground">
                  {row.size}
                </th>
                <td className="px-4 py-3 text-muted-foreground">{row.height}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-sm border border-border bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold">Short Handle or Long Handle?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Short Handle is the standard adult bat and what most players want. Long
            Handle has a longer handle and blade for players over about 6&apos;2&quot;.
            Left-handed players use the same sizes — the bat is not handed.
          </p>
        </div>
        <div className="rounded-sm border border-border bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold">Still unsure?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Send us the player&apos;s height and how they play. We will tell you the
            size and the weight to ask for — it is a two-minute conversation and it
            saves returning a bat.
          </p>
        </div>
      </div>

      <ButtonLink
        href={buildWhatsAppUrl(whatsappMessages.batExpert)}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        size="lg"
        className="mt-8 w-full sm:w-auto"
      >
        <MessageCircle className="h-4 w-4" />
        Ask a bat expert
      </ButtonLink>
    </Container>
  );
}
