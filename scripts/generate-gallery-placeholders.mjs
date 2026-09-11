/* ── Placeholder photography for the Wall of Fame ────────────────────────────────
 *
 * Stand-ins until real player photographs arrive. They exist so the gallery can be
 * built, filtered, opened and reviewed against realistic proportions — not to
 * represent anybody.
 *
 * Deliberately WebP, not SVG: player photography is raster, the gallery must be
 * exercised against the format it will actually carry, and `lib/images.ts` is explicit
 * that SVG is not a photography format here.
 *
 * Every tile says PLACEHOLDER across it. That is not laziness — a grey silhouette with
 * no marking would eventually be mistaken for a real person, and this wall's whole
 * purpose is that the people on it are real.
 *
 *   node scripts/generate-gallery-placeholders.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "gallery", "placeholders");

/* 3:4 portrait. Player photographs are overwhelmingly upright — a person holding a
 * bat is a tall subject — and a landscape tile would crop every one of them. */
const W = 900;
const H = 1200;

/** One muted tone per category so the wall reads as varied without inventing identity. */
const TONES = {
  international: ["#1d2b25", "#0d1512"],
  professional: ["#26211a", "#100d09"],
  icon: ["#2a2118", "#12100b"],
  kashmir: ["#1b2630", "#0b1116"],
  local: ["#241d26", "#0f0c11"],
  "under-19": ["#1f2a1c", "#0d120b"],
  customer: ["#2b241d", "#12100c"],
};

const SUBJECTS = [
  ["international", 1], ["international", 2],
  ["professional", 1], ["professional", 2],
  ["icon", 1],
  ["kashmir", 1], ["kashmir", 2],
  ["local", 1], ["local", 2],
  ["under-19", 1], ["under-19", 2],
  ["customer", 1], ["customer", 2], ["customer", 3],
];

function svgFor(category, index) {
  const [a, b] = TONES[category];
  // A neutral figure holding a bat: enough to judge composition and focal point,
  // deliberately not a likeness of anyone.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="450" cy="${330}" r="118" fill="#ffffff" opacity="0.09"/>
    <path d="M330 500 Q450 440 570 500 L600 900 L300 900 Z" fill="#ffffff" opacity="0.08"/>
    <rect x="612" y="360" width="34" height="430" rx="14" fill="#d8b46a" opacity="0.16"/>
    <rect x="600" y="770" width="58" height="210" rx="16" fill="#d8b46a" opacity="0.13"/>
    <text x="450" y="1096" fill="#ffffff" fill-opacity="0.34" font-family="system-ui,sans-serif"
          font-size="34" font-weight="700" letter-spacing="7" text-anchor="middle">PLACEHOLDER</text>
    <text x="450" y="1140" fill="#ffffff" fill-opacity="0.20" font-family="system-ui,sans-serif"
          font-size="24" letter-spacing="3" text-anchor="middle">${category.toUpperCase()} ${index}</text>
  </svg>`;
}

mkdirSync(OUT, { recursive: true });

let written = 0;
for (const [category, index] of SUBJECTS) {
  const name = `${category}-${index}.webp`;
  const buf = Buffer.from(svgFor(category, index));
  await sharp(buf).webp({ quality: 82 }).toFile(join(OUT, name));
  written += 1;
}

console.log(`Wrote ${written} gallery placeholders to public/gallery/placeholders/`);
