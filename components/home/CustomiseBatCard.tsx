import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { ElectricBorder } from "@/components/ui/ElectricBorder";
import { LightRays } from "@/components/ui/LightRays";
import { studioProducts } from "@/components/configurator/studio-products";
import { formatPrice } from "@/lib/utils";

/* ── The "Customise Your Bat 3D" card ───────────────────────────────────────────
 *
 * A link, not the studio. The studio is a WebGL canvas that loads about 2.4 MB of
 * model and texture, and the homepage must not pay for it — so this card costs one
 * already-shipped render and sends anyone who wants the bat to `/customize/3d`.
 *
 * ── Why this is not the `KISFeatured` composition any more ──
 * It was, and the proportions were wrong. That section frames a 2:3 studio
 * photograph in a big square panel; this one had a 1:2.3 blade in a 300×704 strip,
 * which made the card a tall sliver and left most of the copy column beside it as
 * dead green space. Two columns of very different heights centred against each
 * other is what read as unfinished.
 *
 * So the card is now a card: a contained block about 440px tall with a chip, a
 * strapline, the bat, two facts and its own action — which sits level with the copy
 * beside it. The bat is `object-contain` on the card's own ground rather than going
 * through `ProductImageFrame`, because that component derives a blurred backdrop
 * from the image to dissolve a photograph's edges, and this render is already a
 * cutout on transparency with nothing to dissolve.
 *
 * The three bats are read from the same module the studio reads, so a price or a
 * name can never drift between this card and the thing it advertises.
 */

/** Brand gold rather than the reference's cyan. The effect is the prop's to change —
 *  `color` is the only thing that decides it — but an electric cyan edge on a deep
 *  forest ground fights every other colour on the page, and this palette already has
 *  a bright warm tone that belongs on it: `--color-expert`. */
const ELECTRIC = "#d8b46a";

export function CustomiseBatCard() {
  const [entry] = studioProducts;
  if (!entry) return null;

  const cheapest = studioProducts.reduce(
    (low, bat) => (bat.price < low.price ? bat : low),
    entry,
  );

  return (
    <section
      /* ── Near-black, not forest ──
       * The rays are additive light, so how much of them you see is decided by what
       * they are added to. On `bg-forest` (#1f4d33) a measured mean alpha of 48/255
       * disappeared into the green; the same shader on this ground reads as actual
       * shafts.
       *
       * Not pure black, though, and not `bg-background`: the sections directly above
       * and below are both `bg-background` (#0e0d0b), so a section that matched them
       * would stop being a band at all and the composition would run together. This
       * is darker than its neighbours with a green cast still in it, plus hairline
       * rules top and bottom — so it reads as a recessed panel that belongs to the
       * same site rather than a hole in the page. */
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#060b09] text-white"
      aria-labelledby="customise-3d-heading"
    >
      {/* A whisper of the brand green at the top centre, where the rays come from,
          so the light looks like it is lighting something rather than sitting on a
          flat rectangle — and so the band is recognisably part of this site rather
          than a black hole in it.

          Deliberately faint. The first attempt was 0.42 alpha and it put the green
          back in charge: the rays were once again being added to a lit surface
          instead of a dark one, which is the whole problem the ground change was
          meant to solve. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(100% 70% at 50% 0%, rgba(31,77,51,0.20) 0%, rgba(12,24,18,0.10) 40%, transparent 68%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.07] willow-grain"
        aria-hidden="true"
      />

      {/* Light shafts from the top, over the ground and under the copy. Clipped by
          the section's own `overflow-hidden`, so they stop where the band does
          rather than bleeding into the sections either side. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      {/* Over the rays, under the copy: the shafts fade into the ground before they
          reach the bottom rule. Without it the section's `overflow-hidden` cuts them
          off mid-beam, which is the one thing that makes a light effect look pasted
          on rather than lit. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(to bottom, transparent 45%, rgba(6,11,9,0.75) 82%, #060b09 100%)",
        }}
      />

      {/* `z-10`, explicitly. Every layer here is positioned, so paint order would
          otherwise rest on these three staying in this order in the file — and the
          one thing that must never happen is the rays landing on top of the copy. */}
      <Container className="relative z-10 section-padding">
        {/* Capped narrower than the container. At the full 1232px the copy is held
            at `max-w-lg` while the card is pinned right, which left ~430px of empty
            green between two columns that are meant to read as one composition.
            1024 puts them a gutter apart instead of across a room. */}
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-14">
          <FadeIn>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
              Made to order
            </p>
            <h2 id="customise-3d-heading" className="heading-lg mt-3 text-white">
              Customise Your Bat 3D
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">
              Shape the blade, pick the grip and the sticker, then type your name and
              watch the laser burn it into the willow — on a bat you can turn over in
              your hands before you order it.
            </p>

            {/* The range, as a list rather than a rail of its own. It used to sit in
                a three-column strip under the card, which put the cheapest bat and
                the dearest on the same visual footing as the card itself. */}
            <ul className="mt-7 max-w-md divide-y divide-white/10 border-y border-white/10">
              {studioProducts.map((bat) => (
                <li
                  key={bat.slug}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <span className="text-sm font-semibold text-white">
                    {bat.name}
                  </span>
                  <span className="text-xs text-white/50">
                    {bat.willow === "english" ? "English willow" : "Kashmir willow"}
                  </span>
                  <span className="ml-auto text-sm font-semibold tabular-nums text-white">
                    {formatPrice(bat.price)}
                  </span>
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn delay={0.08} className="lg:justify-self-end">
            <ElectricBorder
              color={ELECTRIC}
              speed={1}
              chaos={0.1}
              thickness={2}
              borderRadius={16}
              className="mx-auto w-full max-w-[330px]"
            >
              {/* `group` on the link so the CTA reacts to a hover anywhere on the
                  card — the whole card is the target, which is why the button is a
                  span and not a nested button. */}
              <Link
                href="/customize/3d"
                className="group block overflow-hidden rounded-2xl bg-[#0c1310] p-6 ring-1 ring-inset ring-white/[0.06] transition-colors duration-300 hover:bg-[#0e1712] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
              >
                <span className="inline-flex items-center rounded-full bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Made to order
                </span>

                {/* Sentence case in the markup, uppercased in CSS. Identical on
                    screen, but a screen reader gets "Custom design your bat in 3D"
                    as words rather than spelling out an all-caps string as an
                    initialism — and "3D" survives either way. */}
                <h3 className="mt-4 text-[30px] font-extrabold uppercase leading-[1.02] tracking-[-0.01em] text-white sm:text-[34px]">
                  Custom design your bat in 3D
                </h3>
                {/* The line that was the headline, now the line under it. Keeping
                    both and dropping "Three bats, shaped and engraved to your spec."
                    instead — three stacked statements above the bat crowded the card,
                    and this one says the same thing with more character. */}
                <p className="mt-3 text-[13px] leading-relaxed text-white/55">
                  Your bat. Your design. Your way.
                </p>

                {/* Contained and height-capped, so the blade reads at a glance
                    without the card growing into a column. */}
                <div className="relative mt-5 h-40">
                  <Image
                    src="/configurator/studio-bat.webp"
                    alt=""
                    fill
                    className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    sizes="282px"
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                  {[`from ${formatPrice(cheapest.price)}`, "Ready in 3–4 days"].map(
                    (fact) => (
                      <span
                        key={fact}
                        className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/65"
                      >
                        {fact}
                      </span>
                    ),
                  )}
                </div>

                {/* White, like the reference's CTA: the one bright block on a dark
                    card is where the eye lands, and it is the action. */}
                <span className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-[#0c1310] transition-colors duration-200 group-hover:bg-expert">
                  Open the 3D studio
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </ElectricBorder>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
