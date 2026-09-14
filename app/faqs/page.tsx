import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ContentPage } from "@/components/content/ContentPage";
import { SupportCta } from "@/components/content/SupportCta";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Common questions about Kashmir Willow bats, sizing, knocking in, engraving, shipping, returns, warranty, repairs and ordering.",
};

/* Native `<details>`/`<summary>`, not a JavaScript accordion.
 *
 * It is open/closed state that the browser already owns: keyboard operable, announced
 * correctly, findable by in-page search even while collapsed, and it works before any
 * JavaScript loads. A rebuilt version would be more code arriving somewhere worse —
 * the same reasoning as the native selects on the bat options picker. */

interface Faq {
  q: string;
  a: React.ReactNode;
}

interface FaqGroup {
  title: string;
  items: Faq[];
}

const GROUPS: FaqGroup[] = [
  {
    title: "Choosing a bat",
    items: [
      {
        q: "What actually is Kashmir Willow?",
        a: (
          <>
            Willow grown in the Kashmir Valley, and the timber most cricket outside the
            professional game is played with. It is denser and harder than English
            willow, which makes it durable and forgiving — it takes knocks well and
            needs less babying. English willow is softer and gives more rebound, which
            is why it dominates at the top level and costs considerably more.
          </>
        ),
      },
      {
        q: "Kashmir Willow or English Willow — which should I buy?",
        a: (
          <>
            For club, school, league and casual cricket, Kashmir Willow is the sensible
            choice: it lasts, it performs, and it does not cost a season&apos;s
            subscription. Choose English Willow if you play at a level where the last
            few percent of rebound decides matches, and you are prepared to knock it in
            properly and maintain it.
          </>
        ),
      },
      {
        q: "What do the grades mean?",
        a: (
          <>
            Grading describes the cosmetic appearance of the face — how straight and
            even the grains are, and how little the blemishes and marks. It is a guide
            to looks more than to performance: a lower-graded cleft with a couple of
            marks can play beautifully. Ask us what a specific bat feels like rather
            than buying the grade.
          </>
        ),
      },
      {
        q: "What size do I need?",
        a: (
          <>
            Size follows height, not age. Our{" "}
            <Link
              href="/size-guide"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              size guide
            </Link>{" "}
            has the full chart. If a player is between two sizes, take the smaller one —
            a bat that is too long is harder to control than one slightly short.
          </>
        ),
      },
      {
        q: "How much should a bat weigh?",
        a: (
          <>
            The weight you can still swing properly at the end of a long innings, not
            the heaviest you can lift in a shop. Most adult players are well served
            between roughly 2lb 8oz and 2lb 11oz. Tell us your height, your strength
            and where you score most of your runs, and we will point you at a range.
          </>
        ),
      },
      {
        q: "What is pickup, and why does everyone talk about it?",
        a: (
          <>
            How light a bat feels in your hands, which is about where the weight sits
            rather than what the scales say. Two bats of identical weight can feel
            completely different depending on the balance. It is the single thing most
            worth getting right, and the hardest to judge from a photograph — which is
            why we will talk it through with you.
          </>
        ),
      },
    ],
  },
  {
    title: "Preparing and caring for a bat",
    items: [
      {
        q: "Does my bat need knocking in?",
        a: (
          <>
            Yes. Knocking in compresses the fibres on the face and edges so they can
            take the impact of a hard ball. Skipping it is the most common way a good
            bat is ruined in its first month, and the resulting damage is not a
            manufacturing fault. Ask us what a particular bat needs before you use it.
          </>
        ),
      },
      {
        q: "Do you prepare bats before dispatch?",
        a: (
          <>
            Bats are checked and prepared before they are packed, and every order
            includes toe protection and a cover. Tell us how you intend to use the bat
            and we will tell you what preparation it still needs at your end.
          </>
        ),
      },
      {
        q: "My bat has surface cracks. Is it ruined?",
        a: (
          <>
            Usually not. Willow is a natural material and a used bat is expected to
            mark, seam and compress. Surface cracking, edge marks and grain lifting are
            normal, and many are repairable — see the{" "}
            <Link
              href="/bat-doctor"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Bat Doctor
            </Link>
            . Send us photographs if you are unsure.
          </>
        ),
      },
    ],
  },
  {
    title: "Ordering and payment",
    items: [
      {
        q: "How does ordering work?",
        a: (
          <>
            Add what you want to the cart, go to checkout and give us your delivery
            details. That creates a real order with a reference beginning{" "}
            <span className="font-mono text-foreground">KWB-</span>, and then you
            confirm it with us on WhatsApp. The order exists on our side from the moment
            it is created, whether or not you send the message immediately.
          </>
        ),
      },
      {
        q: "Is anything charged online?",
        a: (
          <>
            No. There is no online payment on this site. We agree the final total,
            including delivery and any engraving, in the WhatsApp conversation, and
            payment is arranged from there.
          </>
        ),
      },
      {
        q: "Can I order without WhatsApp?",
        a: (
          <>
            Yes — place the order and email us the reference instead. The order is the
            same; only the conversation moves.
          </>
        ),
      },
      {
        q: "Do you sell anything besides bats?",
        a: (
          <>
            Yes: batting gloves, batting pads and cricket kit bags. Every model listed
            is one we actually stock, with its own photograph and price — we would
            rather show you a short catalogue that is real than a long one we cannot
            ship.
          </>
        ),
      },
    ],
  },
  {
    title: "Engraving, delivery and after the sale",
    items: [
      {
        q: "Can I have my name on the bat?",
        a: (
          <>
            Yes — laser engraving, up to 15 characters, chosen on the product page when
            you add a bat to the cart. It is done in-house before dispatch, and it is
            free above the order value shown at checkout.
          </>
        ),
      },
      {
        q: "How long does delivery take, and what does it cost?",
        a: (
          <>
            Both depend on where the order is going and what is in it, and we confirm
            them with you before dispatch rather than publishing a figure we cannot keep
            for every address. See{" "}
            <Link
              href="/shipping"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              shipping
            </Link>
            .
          </>
        ),
      },
      {
        q: "Can I track my order?",
        a: (
          <>
            We share the courier and tracking number once an order ships. Self-service{" "}
            <Link
              href="/track-order"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              online tracking
            </Link>{" "}
            is being built and is not connected yet — until it is, message us with your
            reference and we will look it up.
          </>
        ),
      },
      {
        q: "What if the bat is not right when it arrives?",
        a: (
          <>
            Tell us before you use it. An unused bat in its original condition is a very
            different conversation from one that has been knocked in and played with.
            See{" "}
            <Link
              href="/returns"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              returns
            </Link>
            .
          </>
        ),
      },
      {
        q: "What does the warranty actually cover?",
        a: (
          <>
            A lifetime handle break warranty and a stroke warranty, both assessed on the
            bat itself — authenticity, evidence, inspection and normal use. It is not an
            automatic replacement for any broken bat, and the{" "}
            <Link
              href="/warranty"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              warranty page
            </Link>{" "}
            sets out exactly what is and is not covered.
          </>
        ),
      },
      {
        q: "What is the Bat Doctor?",
        a: (
          <>
            Our repair service — toe damage, edge cracks, handle work, re-gripping and
            general restoration. Send photographs through the{" "}
            <Link
              href="/bat-doctor"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Bat Doctor
            </Link>{" "}
            form and we will tell you whether a bat is worth repairing before you send
            it anywhere.
          </>
        ),
      },
      {
        q: "How do I know the bats are genuine?",
        a: (
          <>
            We are based in the Valley and buy directly from the manufacturers whose
            names we list. Every brand on this site is a real Kashmir maker with its own
            page here — we do not relabel bats or invent brands.
          </>
        ),
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <ContentPage
      title="Frequently asked questions"
      intro="Bat selection, preparation, ordering, delivery and what happens afterwards. If your question is not here, ask us — we would rather answer it properly."
    >
      {GROUPS.map((group) => (
        <section key={group.title} className="mt-10 first:mt-0">
          <h2 className="text-lg font-semibold tracking-tight">{group.title}</h2>

          <div className="mt-4 divide-y divide-border border-y border-border">
            {group.items.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <SupportCta
        message={whatsappMessages.general}
        label="Ask us a question"
        emailSubject="Question"
      />
    </ContentPage>
  );
}
