// scripts/generate-brand-covers.mjs
//
// Generates a distinct placeholder cover for every brand that has no
// photography yet.
//
//   node scripts/generate-brand-covers.mjs
//
// These are stand-ins, not artwork: the point is that a reader can tell nine
// cards apart in the coverflow rake. The previous covers were the same file
// seven times over — one gradient, one 4%-opacity rectangle, initials at 16%
// white — so six of the nine brands read as identical empty slabs. Each brand
// now gets its own hue, its own motif and a legible monogram.
//
// Deliberately NOT folded into generate-placeholders.js: that script still
// emits the original light studio palette and also owns every product,
// category and hero placeholder, so running it would revert the dark covers
// and touch a dozen unrelated files.
//
// 800x600 is load-bearing. It is exactly the 4:3 that BrandCard's `standard`
// variant crops to, so covers land there uncropped. CoverflowCarousel's cards
// are square and use object-cover, which keeps full height and trims 12.5% off
// each side — so anything that has to stay readable lives inside x 15%..85%.
// The brand name itself is not drawn here; the carousel renders it as a DOM
// label, which stays crisp at any card size and also covers the two brands
// that do have real photographs.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/brands");

const W = 800;
const H = 600;
const CX = W / 2;
const CY = H / 2;

/* ── Motifs ──
   Each returns an SVG fragment painted over the base gradient. They tile or
   radiate rather than sitting in one spot, so the side trim in the square
   coverflow crop never removes the only interesting part of the card. */

const motifs = {
  /** Vertical bands, close-packed — willow grain read end-on. */
  stripes: (accent) => {
    const bars = [];
    for (let x = 0; x < W; x += 26) {
      bars.push(
        `<rect x="${x}" y="0" width="7" height="${H}" fill="${accent}" opacity="${
          x % 78 === 0 ? 0.1 : 0.045
        }"/>`,
      );
    }
    return bars.join("");
  },

  /** Nested Vs marching down the card. */
  chevron: (accent) => {
    const rows = [];
    for (let y = -40; y < H + 120; y += 78) {
      rows.push(
        `<path d="M-40 ${y} L${CX} ${y + 74} L${W + 40} ${y}" fill="none" ` +
          `stroke="${accent}" stroke-width="9" opacity="0.075"/>`,
      );
    }
    return rows.join("");
  },

  /** Growth rings struck from off-canvas, like a quarter-sawn board. */
  arcs: (accent) => {
    const rings = [];
    for (let r = 120; r < 1000; r += 62) {
      rings.push(
        `<circle cx="-120" cy="${CY}" r="${r}" fill="none" stroke="${accent}" ` +
          `stroke-width="8" opacity="0.07"/>`,
      );
    }
    return rings.join("");
  },

  /** Concentric rings centred on the monogram. */
  rings: (accent) => {
    const rings = [];
    for (let r = 70; r < 460; r += 52) {
      rings.push(
        `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${accent}" ` +
          `stroke-width="6" opacity="0.075"/>`,
      );
    }
    return rings.join("");
  },

  /** 45-degree rules. Drawn well past both edges so none stop mid-card. */
  diagonals: (accent) => {
    const lines = [];
    for (let x = -H; x < W + H; x += 46) {
      lines.push(
        `<line x1="${x}" y1="0" x2="${x + H}" y2="${H}" stroke="${accent}" ` +
          `stroke-width="8" opacity="0.065"/>`,
      );
    }
    return lines.join("");
  },

  /** Square lattice. */
  crosshatch: (accent) => {
    const lines = [];
    for (let x = 0; x < W; x += 50) {
      lines.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${accent}" stroke-width="5" opacity="0.06"/>`,
      );
    }
    for (let y = 0; y < H; y += 50) {
      lines.push(
        `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${accent}" stroke-width="5" opacity="0.06"/>`,
      );
    }
    return lines.join("");
  },

  /** Spokes radiating from the centre. */
  rays: (accent) => {
    const spokes = [];
    const COUNT = 18;
    for (let i = 0; i < COUNT; i += 1) {
      const a = (i / COUNT) * Math.PI * 2;
      const spread = Math.PI / COUNT / 2.4;
      const far = 700;
      const p1 = `${CX + Math.cos(a - spread) * far} ${CY + Math.sin(a - spread) * far}`;
      const p2 = `${CX + Math.cos(a + spread) * far} ${CY + Math.sin(a + spread) * far}`;
      spokes.push(
        `<path d="M${CX} ${CY} L${p1} L${p2} Z" fill="${accent}" opacity="0.07"/>`,
      );
    }
    return spokes.join("");
  },
};

/* ── Brands ──
   Hues are spread far enough apart to survive the coverflow's fade and tilt:
   neighbouring cards lose opacity and turn away from the viewer, so two
   similar greens would collapse into the same smudge at the edge of the rake.
   Monograms are spelled out rather than derived — `name.slice(0, 2)` turned
   "A Star" into "A " with a trailing space on the old covers. */

const COVERS = [
  {
    slug: "valleywoods",
    monogram: "VW",
    motif: "stripes",
    from: "#1b3a2a",
    to: "#0c1912",
    accent: "#7cc496",
  },
  {
    slug: "tramboo",
    monogram: "TR",
    motif: "chevron",
    from: "#33351c",
    to: "#15170c",
    accent: "#c9c17a",
  },
  {
    slug: "woodford",
    monogram: "WF",
    motif: "arcs",
    from: "#3b2a1b",
    to: "#170f09",
    accent: "#d8b46a",
  },
  {
    slug: "whiteduck",
    monogram: "WD",
    motif: "rings",
    from: "#23303c",
    to: "#0d1217",
    accent: "#9fc0d8",
  },
  {
    slug: "sls",
    monogram: "SLS",
    motif: "diagonals",
    from: "#2e2924",
    to: "#131110",
    accent: "#e0c07f",
  },
  {
    slug: "ib",
    monogram: "IB",
    motif: "crosshatch",
    from: "#16333a",
    to: "#091417",
    accent: "#7fc6cf",
  },
  {
    slug: "a-star",
    monogram: "AS",
    motif: "rays",
    from: "#3a1f2e",
    to: "#160c12",
    accent: "#d98fa8",
  },
];

function cover({ monogram, motif, from, to, accent }) {
  // Wider tracking on two letters than on three, so SLS does not run past the
  // safe band while VW still reads as a monogram rather than a word.
  const tracking = monogram.length > 2 ? 4 : 10;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<defs>`,
    `<linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>`,
    `</linearGradient>`,
    // Pool of brand colour behind the monogram. This is what actually carries
    // the hue at a glance — the motif alone is too sparse to read at card size.
    `<radialGradient id="glow" cx="50%" cy="50%" r="52%">`,
    `<stop offset="0%" stop-color="${accent}" stop-opacity="0.2"/>`,
    `<stop offset="100%" stop-color="${accent}" stop-opacity="0"/>`,
    `</radialGradient>`,
    // Corner falloff, so the card has some form instead of reading as a slab.
    `<radialGradient id="vignette" cx="50%" cy="50%" r="72%">`,
    `<stop offset="55%" stop-color="#000000" stop-opacity="0"/>`,
    `<stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>`,
    `</radialGradient>`,
    `</defs>`,
    `<rect width="100%" height="100%" fill="url(#base)"/>`,
    motifs[motif](accent),
    `<rect width="100%" height="100%" fill="url(#glow)"/>`,
    `<text x="${CX}" y="${CY - 6}" fill="${accent}" fill-opacity="0.46" ` +
      `text-anchor="middle" dominant-baseline="central" ` +
      `font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="146" ` +
      `font-weight="700" letter-spacing="${tracking}">${monogram}</text>`,
    `<rect x="${CX - 46}" y="${CY + 74}" width="92" height="3" rx="1.5" ` +
      `fill="${accent}" fill-opacity="0.6"/>`,
    `<rect width="100%" height="100%" fill="url(#vignette)"/>`,
    `</svg>`,
  ].join("");
}

await mkdir(OUT_DIR, { recursive: true });

for (const brand of COVERS) {
  const svg = cover(brand);
  await writeFile(path.join(OUT_DIR, `${brand.slug}-cover.svg`), svg, "utf8");
  console.log(
    `  ${`${brand.slug}-cover.svg`.padEnd(26)} ${brand.motif.padEnd(11)} ${brand.accent}  ${String(svg.length).padStart(5)} B`,
  );
}

console.log(`\n  ${COVERS.length} covers written to public/brands/`);
