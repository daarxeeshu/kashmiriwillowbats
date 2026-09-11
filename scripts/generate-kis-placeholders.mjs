/* ── KIS range placeholder cards ─────────────────────────────────────────────────
 *
 *   node scripts/generate-kis-placeholders.mjs
 *
 * Stand-ins for the thirteen KIS bats until the real photographs are shot. The names
 * and the running order mirror `data/products.ts`; the prices deliberately do not
 * appear in the artwork, so a price change never means regenerating an image.
 *
 * ── Why these are WebP and not SVG ──
 * Measured on this project, not assumed: with `images.unoptimized: false` and no
 * `dangerouslyAllowSVG`, Next's optimiser answers an SVG source with **400**, while the
 * raw file served straight from /public answers 200. Every product image goes through
 * `next/image`, so the existing `.svg` placeholders were reaching the optimiser and
 * failing — the cards were showing SafeImage's error box, not the drawn placeholder.
 *
 *   /_next/image?url=/products/kis-bazuka.svg  -> 400
 *   /_next/image?url=/products/kis-mh7000-plus.jpg -> 200
 *
 * Rasterising to WebP at the real card size sidesteps that completely. The alternative,
 * turning on `dangerouslyAllowSVG`, would let any SVG reaching the optimiser run script
 * in the image origin — not a trade worth making for placeholder art.
 *
 * ── Why they are honest about being placeholders ──
 * The card says "Photo coming soon" on its face. A placeholder that imitates a real
 * photograph is the kind of thing that quietly survives to production; one that states
 * what it is cannot.
 */

import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "products");

/* 2:3 — the shape the real photographs are being shot to, so a placeholder crops in the
 * card and on the detail page exactly the way its replacement will. */
const W = 1600;
const H = 2400;

const INK = "#0b0a09";
const SURFACE = "#161512";
const ACCENT = "#9a7b4f";

/* Mirrors the KIS block in data/products.ts. `tone` walks the willow from pale to deep
 * so a grid of thirteen cards reads as a range rather than one image repeated. */
const BATS = [
  ["kis-master-pro", "Master Pro"],
  ["kis-gold-edition", "Gold Edition"],
  ["kis-players-special", "Players Special"],
  ["kis-mh7000", "M&H 7000"],
  ["kis-bazuka", "Bazuka"],
  ["kis-finisher", "Finisher"],
  ["kis-game-changer", "Gamechanger"],
  ["kis-pr-21", "PR 21"],
  ["kis-boom-boom", "Boom Boom"],
  ["kis-classic", "Classic"],
  ["kis-limited-edition", "Limited Edition"],
  ["kis-blaster", "Blaster"],
];

/* Real bat dimensions, scaled — a placeholder that is the wrong shape teaches the eye
 * the wrong thing about the product it stands in for, and the first draft here read as
 * a paddle because the blade was 2.7:1 where a bat is about 5:1.
 *
 *   blade  55cm x 10.8cm  (Law 5 caps width at 10.8cm)
 *   handle 35cm
 *
 * At 17.8px/cm the whole bat is ~1600px, which fills the frame above the caption. */
const PX_PER_CM = 17.8;
const BLADE_H = Math.round(55 * PX_PER_CM); // 979
const BLADE_W = Math.round(10.8 * PX_PER_CM); // 192
const HANDLE_H = Math.round(35 * PX_PER_CM); // 623
const HANDLE_W = Math.round(3.4 * PX_PER_CM); // 61

/** Willow face, shoulders, splice and handle, centred in the 1600×2400 frame with
 *  generous margin — the same margin the real photographs are asked for, so a
 *  placeholder crops exactly the way its replacement will. */
function bat(tone) {
  // Pale, dry willow through to a deeper oiled tone, so thirteen cards in a grid read
  // as a range rather than one image repeated.
  const face = `hsl(${40 - tone * 4} ${26 + tone * 14}% ${76 - tone * 20}%)`;
  const edge = `hsl(${38 - tone * 4} ${24 + tone * 12}% ${56 - tone * 16}%)`;
  const grip = `hsl(22 ${10 + tone * 6}% ${19 + tone * 5}%)`;

  const hw = HANDLE_W / 2;
  const bw = BLADE_W / 2;
  const shoulder = 70; // where the blade swells out from the splice

  return `
  <g transform="translate(800 300)">
    <!-- handle -->
    <rect x="${-hw}" y="0" width="${HANDLE_W}" height="${HANDLE_H + 40}" rx="${hw}" fill="${grip}"/>
    <g stroke="#fff" stroke-width="2.5" opacity="0.07">
      ${Array.from({ length: 16 }, (_, i) => `<line x1="${-hw}" y1="${30 + i * 36}" x2="${hw}" y2="${44 + i * 36}"/>`).join("\n      ")}
    </g>

    <!-- blade: shoulders flare from the splice, toe squared off -->
    <path d="M ${-bw + 26} ${HANDLE_H}
             Q ${-bw} ${HANDLE_H + shoulder} ${-bw} ${HANDLE_H + shoulder + 30}
             L ${-bw} ${HANDLE_H + BLADE_H - 26}
             Q ${-bw} ${HANDLE_H + BLADE_H} ${-bw + 26} ${HANDLE_H + BLADE_H}
             L ${bw - 26} ${HANDLE_H + BLADE_H}
             Q ${bw} ${HANDLE_H + BLADE_H} ${bw} ${HANDLE_H + BLADE_H - 26}
             L ${bw} ${HANDLE_H + shoulder + 30}
             Q ${bw} ${HANDLE_H + shoulder} ${bw - 26} ${HANDLE_H} Z"
          fill="${face}" stroke="${edge}" stroke-width="4"/>

    <!-- grain, straight and close as graded willow is -->
    <g stroke="${edge}" stroke-width="2" opacity="0.3">
      ${[-70, -46, -22, 2, 26, 50, 74]
        .map((x) => `<line x1="${x}" y1="${HANDLE_H + shoulder}" x2="${x + 4}" y2="${HANDLE_H + BLADE_H - 20}"/>`)
        .join("\n      ")}
    </g>

    <!-- edge shading, so the blade reads as a solid with a spine rather than a flat cut-out -->
    <path d="M ${-bw} ${HANDLE_H + shoulder + 30} L ${-bw + 34} ${HANDLE_H + shoulder + 30}
             L ${-bw + 34} ${HANDLE_H + BLADE_H} L ${-bw + 26} ${HANDLE_H + BLADE_H}
             Q ${-bw} ${HANDLE_H + BLADE_H} ${-bw} ${HANDLE_H + BLADE_H - 26} Z"
          fill="${edge}" opacity="0.22"/>

    <!-- splice: the V of the handle let into the blade -->
    <path d="M ${-hw - 4} ${HANDLE_H - 4} L 0 ${HANDLE_H + 150} L ${hw + 4} ${HANDLE_H - 4} Z"
          fill="${edge}" opacity="0.4"/>
  </g>`;
}

/** `&` is not legal raw in XML and every other escape follows from the same rule. */
function xml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function card(name, tone) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <!-- Caption sits above y=2200. The 4:5 card crops this 2:3 frame to the band
       y 200..2200, so a baseline below that is invisible on every product card
       while still looking correct in the file. Measured, not guessed. -->
  <ellipse cx="800" cy="1896" rx="210" ry="30" fill="#000" opacity="0.45"/>
  ${bat(tone)}
  <text x="800" y="1960" text-anchor="middle" fill="${ACCENT}"
        font-family="Georgia, 'Times New Roman', serif" font-size="46"
        letter-spacing="12">KIS</text>
  <text x="800" y="2060" text-anchor="middle" fill="#f5f1ea"
        font-family="Georgia, 'Times New Roman', serif" font-size="82">${xml(name)}</text>
  <text x="800" y="2145" text-anchor="middle" fill="#f5f1ea" opacity="0.42"
        font-family="Helvetica, Arial, sans-serif" font-size="40"
        letter-spacing="4">Photo coming soon</text>
</svg>`;
}

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const [slug, name] of BATS) {
  const tone = written / (BATS.length - 1); // 0 -> 1 across the range
  const file = join(OUT_DIR, `${slug}.webp`);
  await sharp(Buffer.from(card(name, tone)))
    .webp({ quality: 88 })
    .toFile(file);
  console.log(`  ${slug}.webp`.padEnd(34) + `${W}x${H}`);
  written += 1;
}

console.log(`\n${written} placeholder cards written to public/products/.`);
console.log(`kis-mh7000-plus keeps its real photograph and was not touched.`);
