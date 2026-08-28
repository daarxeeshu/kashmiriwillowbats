// scripts/generate-logo-assets.mjs
//
// Derives every logo asset the site serves from the single master artwork.
//
//   node scripts/generate-logo-assets.mjs
//
// The master is an SVG in name only: it is eleven base64 PNG layers plus a C2PA
// manifest in an <svg> wrapper, 2.6 MB in total. Serving it directly would put a
// 2.6 MB request in the header of every page, so nothing references it at
// runtime — it is the source, and these outputs are what ship.
//
// It lives in design/ rather than public/ deliberately: everything under public/
// is copied into the deployment and served at a guessable URL, so a 2.6 MB file
// nothing links to would still be shipped and downloadable. design/ is outside
// the served tree, which makes this a build-time input only.
//
// librsvg (bundled with sharp) composites the layered master identically to
// Chromium, so rasterising here is faithful to the artwork.

import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const MASTER = path.join(ROOT, "design/hero/kashmiri willow logo.svg");

/** Square PNGs written straight to disk. */
const PNG_TARGETS = [
  // next/image master for the header and footer lockups. Never served at full
  // size — Next derives the AVIF/WebP variants listed in next.config.ts.
  { out: "public/brand/logo.png", size: 512 },
  // Browser tab, and the base Next.js uses for <link rel="icon">.
  { out: "app/icon.png", size: 256 },
  // iOS home screen. Apple does not composite transparency, which suits an
  // asset whose dark background is already baked in.
  { out: "app/apple-icon.png", size: 180 },
];

/** Sizes packed into favicon.ico, smallest first. */
const ICO_SIZES = [16, 32, 48];

/**
 * @param size    Output edge length in pixels.
 * @param options `rgba: true` forces a true-colour PNG with an alpha channel.
 *                Only favicon.ico needs it — see buildIco. Everything else
 *                keeps sharp's palette encoding, which is roughly a third of
 *                the bytes for this artwork.
 */
function render(size, { rgba = false } = {}) {
  const pipeline = sharp(MASTER, { limitInputPixels: false }).resize(size, size, {
    fit: "cover",
  });
  if (rgba) pipeline.ensureAlpha();
  return pipeline
    .png({ compressionLevel: 9, effort: 10, palette: !rgba })
    .toBuffer();
}

/**
 * Packs PNG buffers into an ICO container. Every entry stays PNG-encoded rather
 * than being converted to BMP — supported since IE11, and it keeps the alpha
 * channel intact without the AND-mask dance the BMP form requires.
 *
 * Entries must be RGBA (PNG colour type 6). Next.js reads this file to build the
 * <link rel="icon"> tag, and the Rust decoder it uses rejects palette-encoded
 * PNGs inside an ICO with "The PNG is not in RGBA format!" — which surfaces as a
 * 500 on every route, not as a broken icon.
 */
function buildIco(images) {
  const HEADER = 6;
  const ENTRY = 16;
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER + ENTRY * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY);
    // 256 is stored as 0 in a single byte; nothing here is that large, but the
    // modulo keeps the field correct if a 256 entry is ever added.
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt8(0, 2); // palette size, 0 for truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const written = [];

for (const { out, size } of PNG_TARGETS) {
  const data = await render(size);
  const dest = path.join(ROOT, out);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, data);
  written.push({ out, detail: `${size}x${size}`, bytes: data.length });
}

const icoImages = [];
for (const size of ICO_SIZES) {
  icoImages.push({ size, data: await render(size, { rgba: true }) });
}
const ico = buildIco(icoImages);
await writeFile(path.join(ROOT, "app/favicon.ico"), ico);
written.push({
  out: "app/favicon.ico",
  detail: ICO_SIZES.map((s) => `${s}x${s}`).join(" + "),
  bytes: ico.length,
});

for (const { out, detail, bytes } of written) {
  console.log(`  ${out.padEnd(24)} ${detail.padEnd(20)} ${kb(bytes)}`);
}
console.log(
  `\n  ${written.length} files, ${kb(written.reduce((sum, w) => sum + w.bytes, 0))} total`,
);
