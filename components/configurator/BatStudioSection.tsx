import { Barlow_Condensed } from "next/font/google";
import { BatStudio } from "./BatStudio";

/* ── The designated "Customise Your Bat 3D" section ──────────────────────────────
 *
 * A server component, so the section chrome — the heading, the standing copy — is
 * rendered on the server and only the studio itself is a client island. three.js and
 * the engine sit behind a runtime `import()` inside that island, so no other page in
 * the shop pays a byte for them.
 *
 * The font is loaded here rather than in the client component because `next/font`
 * self-hosts each face under a generated family name that is only knowable at build
 * time. The engine draws the engraving into a canvas with `ctx.font`, which needs a
 * real family string — so the generated one is handed down. Without it the condensed
 * face falls back silently and a customer's name changes shape between the preview
 * and the bat.
 */
const engraveFont = Barlow_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export function BatStudioSection() {
  return (
    <section
      id="customise-your-bat-3d"
      aria-labelledby="studio-heading"
      className={engraveFont.className}
    >
      <div className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-wider text-accent">
          Made to order
        </p>
        <h1
          id="studio-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Customise Your Bat 3D
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Pick the bat, shape the blade, and watch your name burn into the willow as
          you type it. Every measurement on this page is taken off the model in front
          of you, and the spec travels with the order to the bench in Sangam.
        </p>
      </div>

      <div className="mt-8">
        <BatStudio blockFontFamily={engraveFont.style.fontFamily} />
      </div>
    </section>
  );
}
