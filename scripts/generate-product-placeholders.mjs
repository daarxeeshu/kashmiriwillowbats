/* ── Placeholder product artwork generator ────────────────────────────────────────
 *
 * Writes the 48 development placeholders for the eight equipment categories, six per
 * category, into `public/products/placeholders/` and nowhere else.
 *
 * Why a script and not 48 hand-drawn files: the brief's §17 asks for "a reusable
 * neutral placeholder treatment", and §19 asks for structured data rather than 48
 * hand-authored artefacts. One silhouette family per category with six colourway
 * variants is that treatment — and it means replacing the set later is a matter of
 * deleting one directory, not auditing 48 files scattered among the real photographs.
 *
 * Why its own directory: `public/products/` holds real studio photography
 * (`kis-mh7000-plus.jpg`) alongside the earlier hand-drawn bat placeholders. Mixing 48
 * more in would make "which of these are disposable?" a question you answer by reading
 * every file. `public/products/placeholders/` answers it by path — which is the same
 * promise `isPlaceholder: true` makes in the data, kept in the filesystem.
 *
 * Why it cannot clobber anything: OUT_DIR is fixed, every write is asserted to resolve
 * inside it, and the filename is derived from the slug rather than taken as input.
 * `scripts/generate-placeholders.js` in this repo is the cautionary tale — it is stale
 * and would overwrite the brand and category artwork that has since been replaced by
 * hand. This one physically cannot reach outside one directory.
 *
 * Run: node scripts/generate-product-placeholders.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "products", "placeholders");

/* Six neutral colourways. Warm greys and leather browns pulled from the site's own
   palette (`--color-accent` is #9a7b4f) so a placeholder card sits in the dark luxury
   grid without announcing itself as a different kind of image. Deliberately muted:
   these must read as "artwork pending", never as a product photograph. */
const WAYS = [
  { body: "#b9b2a6", edge: "#8d857a", trim: "#9a7b4f", lite: "#e7e1d6" },
  { body: "#a9a29a", edge: "#7d766e", trim: "#8a6f49", lite: "#ded8cf" },
  { body: "#c3bcae", edge: "#948c7e", trim: "#a9885a", lite: "#efe9de" },
  { body: "#9d968f", edge: "#726c66", trim: "#7f684a", lite: "#d6d0c8" },
  { body: "#b0a897", edge: "#847d6d", trim: "#9f8154", lite: "#e4dccd" },
  { body: "#8f8983", edge: "#67625d", trim: "#75603f", lite: "#cdc7c0" },
];

/* Each family draws into an 800×1000 viewBox on a transparent ground, matching the
   convention the existing bat placeholders already set. No background rect: the shared
   `ProductImageFrame` derives its own backdrop from the image, so a painted panel here
   would fight it. */
const FAMILY = {
  bag: (c, i) => {
    const wheels = i % 2 === 1;
    return `
    <rect x="150" y="400" width="500" height="230" rx="70" fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <path d="M150 470 h500" stroke="${c.edge}" stroke-width="5" opacity=".7"/>
    <rect x="300" y="430" width="200" height="52" rx="26" fill="${c.lite}" opacity=".5"/>
    <path d="M330 400 q70 -70 140 0" fill="none" stroke="${c.trim}" stroke-width="16" stroke-linecap="round"/>
    <path d="M190 560 q210 90 420 0" fill="none" stroke="${c.trim}" stroke-width="12" opacity=".8"/>
    <rect x="196" y="500" width="120" height="96" rx="22" fill="${c.edge}" opacity=".45"/>
    ${wheels ? `<circle cx="240" cy="648" r="26" fill="${c.edge}"/><circle cx="560" cy="648" r="26" fill="${c.edge}"/>` : ""}`;
  },

  shoe: (c) => `
    <path d="M170 560 q40 -120 150 -130 q90 -8 150 46 q70 50 160 62 q60 8 60 52 v34 q0 26 -30 26 H206 q-40 0 -40 -40 z"
          fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <path d="M166 636 h524 q30 0 30 30 v18 q0 22 -28 22 H196 q-32 0 -32 -30 z" fill="${c.edge}"/>
    <path d="M300 470 q56 20 96 54 M286 512 q60 18 104 50 M278 552 q62 14 110 44"
          fill="none" stroke="${c.lite}" stroke-width="9" stroke-linecap="round" opacity=".85"/>
    <path d="M470 476 q78 44 176 66" fill="none" stroke="${c.trim}" stroke-width="10" opacity=".9"/>
    <path d="M232 692 v26 M340 692 v26 M448 692 v26 M556 692 v26" stroke="${c.edge}" stroke-width="12" stroke-linecap="round"/>`,

  ball: (c) => `
    <circle cx="400" cy="500" r="185" fill="${c.body}" stroke="${c.edge}" stroke-width="7"/>
    <circle cx="400" cy="500" r="185" fill="url(#sphere)"/>
    <path d="M400 315 q66 185 0 370" fill="none" stroke="${c.trim}" stroke-width="9"/>
    <g stroke="${c.lite}" stroke-width="7" stroke-linecap="round" opacity=".9">
      <path d="M372 372 h56"/><path d="M362 430 h76"/><path d="M358 500 h84"/>
      <path d="M362 570 h76"/><path d="M372 628 h56"/>
    </g>`,

  helmet: (c) => `
    <path d="M400 300 q170 0 178 168 v58 q0 20 -22 20 H244 q-22 0 -22 -20 v-58 Q230 300 400 300 z"
          fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <path d="M222 476 h356 q34 0 34 26 t-34 26 H222 q-32 0 -32 -26 t32 -26 z" fill="${c.trim}"/>
    <path d="M300 546 q100 150 200 0" fill="none" stroke="${c.edge}" stroke-width="8"/>
    <g stroke="${c.edge}" stroke-width="10" stroke-linecap="round">
      <path d="M320 552 v104"/><path d="M366 556 v122"/><path d="M412 556 v122"/><path d="M458 552 v104"/>
    </g>
    <path d="M300 546 h206" stroke="${c.edge}" stroke-width="9"/>
    <path d="M262 660 q138 74 276 0" fill="none" stroke="${c.edge}" stroke-width="8" opacity=".7"/>
    <path d="M290 360 q110 -34 220 0" fill="none" stroke="${c.lite}" stroke-width="10" opacity=".6"/>`,

  thighGuard: (c) => `
    <rect x="270" y="290" width="260" height="420" rx="118" fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <g stroke="${c.edge}" stroke-width="5" opacity=".65">
      <path d="M340 300 v396"/><path d="M400 292 v412"/><path d="M460 300 v396"/>
    </g>
    <rect x="292" y="360" width="216" height="34" rx="17" fill="${c.trim}" opacity=".85"/>
    <rect x="292" y="600" width="216" height="34" rx="17" fill="${c.trim}" opacity=".85"/>
    <path d="M270 420 h-70 M530 420 h70 M270 570 h-70 M530 570 h70"
          stroke="${c.edge}" stroke-width="14" stroke-linecap="round" opacity=".8"/>`,

  pads: (c) => `
    <path d="M300 250 h200 q56 0 56 58 v390 q0 60 -56 60 H300 q-56 0 -56 -60 V308 q0 -58 56 -58 z"
          fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <g fill="${c.lite}" opacity=".45">
      <rect x="266" y="286" width="268" height="58" rx="29"/>
      <rect x="266" y="366" width="268" height="58" rx="29"/>
      <rect x="266" y="536" width="268" height="58" rx="29"/>
      <rect x="266" y="616" width="268" height="58" rx="29"/>
    </g>
    <ellipse cx="400" cy="480" rx="118" ry="66" fill="${c.trim}" opacity=".8"/>
    <path d="M244 400 h-64 M556 400 h64 M244 560 h-64 M556 560 h64"
          stroke="${c.edge}" stroke-width="14" stroke-linecap="round" opacity=".8"/>`,

  gloves: (c) => `
    <path d="M286 640 v-186 q0 -34 34 -34 h30 v-92 q0 -30 30 -30 t30 30 v92 h26 v-108 q0 -30 30 -30 t30 30 v108 h26 v-84 q0 -30 30 -30 t30 30 v250 q0 74 -74 74 z"
          fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <path d="M286 500 h-52 q-30 0 -30 34 v56 q0 34 34 34 h48 z" fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <g stroke="${c.lite}" stroke-width="8" stroke-linecap="round" opacity=".8">
      <path d="M366 350 v60"/><path d="M452 336 v74"/><path d="M538 364 v46"/>
    </g>
    <rect x="286" y="600" width="266" height="52" rx="26" fill="${c.trim}" opacity=".85"/>
    <path d="M320 456 h212 M320 508 h212" stroke="${c.edge}" stroke-width="5" opacity=".55"/>`,

  /* The six accessories are six different objects rather than one object six times —
     a grip, a tape roll, a pouch — because "Pro Bat Grip" and "Cricket Care Kit" are
     not variants of each other. Selected by index, so the category reads as a mixed
     shelf the way the real one will. */
  accessory: (c, i) => {
    const kind = i % 3;
    if (kind === 0)
      return `
    <path d="M368 300 h64 q26 0 26 30 v340 q0 30 -26 30 h-64 q-26 0 -26 -30 V330 q0 -30 26 -30 z"
          fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <g stroke="${c.trim}" stroke-width="9" opacity=".85">
      <path d="M342 380 h116"/><path d="M342 440 h116"/><path d="M342 500 h116"/><path d="M342 560 h116"/><path d="M342 620 h116"/>
    </g>
    <rect x="356" y="272" width="88" height="34" rx="17" fill="${c.trim}"/>`;
    if (kind === 1)
      return `
    <ellipse cx="400" cy="392" rx="168" ry="56" fill="${c.lite}" stroke="${c.edge}" stroke-width="6"/>
    <path d="M232 392 v216 q0 56 168 56 t168 -56 V392" fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <ellipse cx="400" cy="392" rx="66" ry="22" fill="${c.edge}" opacity=".55"/>
    <path d="M240 470 q160 52 320 0" fill="none" stroke="${c.trim}" stroke-width="10" opacity=".8"/>`;
    return `
    <rect x="212" y="366" width="376" height="268" rx="44" fill="${c.body}" stroke="${c.edge}" stroke-width="6"/>
    <path d="M212 452 h376" stroke="${c.edge}" stroke-width="6" opacity=".7"/>
    <rect x="330" y="330" width="140" height="44" rx="22" fill="${c.trim}"/>
    <g fill="${c.lite}" opacity=".5">
      <rect x="252" y="492" width="128" height="46" rx="14"/>
      <rect x="420" y="492" width="128" height="46" rx="14"/>
      <rect x="252" y="558" width="296" height="34" rx="14"/>
    </g>`;
  },
};

/* Category → silhouette family and the six product names, in the order the brief
   lists them. Prices live with the products in `data/placeholder-products.ts`; this
   file only needs to know what to draw and what to call the file. */
const SETS = [
  ["cricket-bags", "bag", ["Pro Cricket Kit Bag", "Elite Wheelie Bag", "Match Carry Bag", "Power Cricket Duffle", "Club Kit Bag", "Xtreme Cricket Bag"]],
  ["cricket-shoes", "shoe", ["Pro Pace Cricket Shoes", "Elite Strike Shoes", "Match Runner Shoes", "Power Drive Cricket Shoes", "Club Pro Shoes", "Xtreme Pace Shoes"]],
  ["cricket-balls", "ball", ["Match Red Cricket Ball", "Pro Leather Cricket Ball", "Club Match Ball", "Elite Test Ball", "Training Red Ball", "Premium Cricket Ball"]],
  ["helmets", "helmet", ["Pro Shield Helmet", "Elite Cricket Helmet", "Match Guard Helmet", "Power Protection Helmet", "Club Shield Helmet", "Xtreme Safety Helmet"]],
  ["thigh-guards", "thighGuard", ["Pro Thigh Guard", "Elite Thigh Protection", "Match Shield Guard", "Power Guard", "Club Thigh Protector", "Xtreme Thigh Guard"]],
  ["batting-pads", "pads", ["Pro Batting Pads", "Elite Leg Guards", "Match Shield Pads", "Power Protection Pads", "Club Batting Pads", "Xtreme Leg Guards"]],
  ["batting-gloves", "gloves", ["Pro Grip Batting Gloves", "Elite Shield Gloves", "Power Grip 500", "Match Pro Batting Gloves", "Xtreme Grip Gloves", "Club Master Gloves"]],
  ["accessories", "accessory", ["Pro Bat Grip", "Premium Bat Tape", "Cricket Grip Pack", "Bat Protection Kit", "Match Accessories Pack", "Cricket Care Kit"]],
];

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function svg(name, category, family, index) {
  const c = WAYS[index % WAYS.length];
  return `<!--
  PLACEHOLDER — development artwork, awaiting real product photography.
  Generated by scripts/generate-product-placeholders.mjs (${category}, variant ${index + 1}).
  Do not retouch by hand: re-run the script, or replace this file with the real
  photograph at the same path and drop \`isPlaceholder\` from the product entry.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${name} placeholder">
  <defs>
    <radialGradient id="halo" cx="50%" cy="48%" r="54%">
      <stop offset="0%" stop-color="${c.lite}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${c.lite}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sphere" cx="36%" cy="32%" r="72%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".28"/>
      <stop offset="100%" stop-color="#000000" stop-opacity=".18"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#halo)"/>
${FAMILY[family](c, index).trim().replace(/^/gm, "  ")}
  <ellipse cx="400" cy="742" rx="176" ry="20" fill="#000000" opacity=".2"/>
</svg>
`;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  let written = 0;
  for (const [category, family, names] of SETS) {
    names.forEach((name, index) => {
      const file = resolve(OUT_DIR, `${slugify(name)}.svg`);
      // The whole safety story in one line: a path that does not resolve inside
      // OUT_DIR is a bug in this script, and it stops here rather than overwriting
      // a photograph.
      if (relative(OUT_DIR, file).startsWith("..")) {
        throw new Error(`Refusing to write outside ${OUT_DIR}: ${file}`);
      }
      writeFileSync(file, svg(name, category, family, index), "utf8");
      written++;
    });
  }
  console.log(`Wrote ${written} placeholder SVGs to public/products/placeholders/`);
}

main();
