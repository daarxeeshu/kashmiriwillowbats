// scripts/generate-hero-bat.mjs
//
// Derives the two hero product layers from the master bat render.
//
//   node scripts/generate-hero-bat.mjs
//
// The master (design/hero/herobat.png, 1024x1536, 1.1 MB) is a 3D render on a
// transparent canvas. Two things about it drive this script:
//
// 1. The bat occupies a narrow column — 183 x 1476 of a 1024 x 1536 canvas, so
//    87% of the file is empty. Shipping the master would mean paying for a
//    megabyte of nothing and asking the browser to composite a mostly-empty
//    layer on every frame of a scroll animation.
//
// 2. The glow around the bat is NOT visible in the master. It is RGB data
//    stranded in pixels whose alpha is 0 — e.g. rgba(152,151,151,0) beside the
//    handle, rgba(164,145,123,0) beside the blade. Normal compositing
//    multiplies colour by alpha, so all of it contributes exactly nothing. It
//    looks present in an image viewer that ignores alpha, and disappears the
//    moment it is drawn to a page.
//
// So: layer one is the bat, trimmed. Layer two recovers that discarded glow by
// re-emitting it with luminance as the alpha channel, which turns unreachable
// data into the volumetric light the hero needs — and it is the render's own
// lighting, cool at the handle and warm at the blade, rather than a CSS
// gradient guessing at it.

import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const MASTER = path.join(ROOT, "design/hero/herobat.png");
const OUT_DIR = path.join(ROOT, "public/hero");

/** Alpha at or below this counts as empty canvas. */
const EMPTY_ALPHA = 8;
/** Transparent pixels kept around the trimmed bat, so the antialiased edge is
    never the outermost row — a resize samples past the edge and would otherwise
    clamp, hardening the silhouette. */
const MARGIN = 6;
/** The glow is a soft field; it survives heavy downscaling and the small file
    is the point. Width in pixels — height follows the master's aspect. */
const GLOW_WIDTH = 320;

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const { data, info } = await sharp(MASTER)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
if (channels !== 4) throw new Error(`expected RGBA master, got ${channels}ch`);

/* ── Pass 1: bounding box of everything non-empty ─────────────────────────── */

let x0 = width;
let y0 = height;
let x1 = -1;
let y1 = -1;

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (data[(y * width + x) * 4 + 3] > EMPTY_ALPHA) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
if (x1 < 0) throw new Error("master is fully transparent");

const box = {
  left: Math.max(0, x0 - MARGIN),
  top: Math.max(0, y0 - MARGIN),
};
box.width = Math.min(width - box.left, x1 - x0 + 1 + MARGIN * 2);
box.height = Math.min(height - box.top, y1 - y0 + 1 + MARGIN * 2);

/* ── Pass 2: split the master into bat and glow ───────────────────────────────
   One walk, two outputs, because both need the same alpha test.

   bat  — the master with RGB cleared wherever alpha is 0. Those pixels carry
          mid-grey; a scaler that filters colour without weighting by alpha (a
          browser upscaling a texture, most naively-written tooling) drags that
          grey into the silhouette as a light halo. Cleared, the same bleed goes
          toward black, which on this near-black stage reads as contact shadow
          instead of a mistake. Partly-transparent edge pixels keep their colour:
          that is the antialiasing, and it is real.

   glow — only the pixels the bat throws away. Alpha comes from luminance, so
          the brightest stranded colour becomes the most opaque part of the
          layer and the falloff is the render's own. RGB is passed through
          untouched to keep the cool-handle / warm-blade shift. */

const bat = Buffer.allocUnsafe(data.length);
data.copy(bat);
const glow = Buffer.alloc(data.length); // zero-filled: default is fully clear

let cleared = 0;
let recovered = 0;

for (let i = 0; i < data.length; i += 4) {
  if (data[i + 3] !== 0) continue;

  bat[i] = 0;
  bat[i + 1] = 0;
  bat[i + 2] = 0;
  cleared += 1;

  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  // Rec. 601 luma. The stranded field is near-neutral, so a perceptual
  // weighting and a flat mean land within a couple of levels of each other —
  // this one just keeps the warm blade glow from reading as brighter than it is.
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luma < 2) continue;

  glow[i] = r;
  glow[i + 1] = g;
  glow[i + 2] = b;
  glow[i + 3] = Math.min(255, Math.round(luma));
  recovered += 1;
}

await mkdir(OUT_DIR, { recursive: true });
const written = [];

/* ── bat.png ─────────────────────────────────────────────────────────────── */

const batPng = await sharp(bat, { raw: { width, height, channels: 4 } })
  .extract(box)
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
await writeFile(path.join(OUT_DIR, "bat.png"), batPng);
written.push({
  out: "public/hero/bat.png",
  detail: `${box.width}x${box.height}`,
  bytes: batPng.length,
});

/* ── bat-glow.png ────────────────────────────────────────────────────────────
   Not trimmed to the bat's box — the glow's whole job is to spill past the
   product, so it keeps the master's full frame and the component lays it over
   the same area. Blurred after downscaling: the recovered field has hard steps
   where the render's alpha mask cut it, and those become visible banding once
   the layer is scaled up over a viewport. */

const glowHeight = Math.round((GLOW_WIDTH / width) * height);
const glowPng = await sharp(glow, { raw: { width, height, channels: 4 } })
  .resize(GLOW_WIDTH, glowHeight, { fit: "fill", kernel: "lanczos3" })
  .blur(4)
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
await writeFile(path.join(OUT_DIR, "bat-glow.png"), glowPng);
written.push({
  out: "public/hero/bat-glow.png",
  detail: `${GLOW_WIDTH}x${glowHeight}`,
  bytes: glowPng.length,
});

/* ── Report ──────────────────────────────────────────────────────────────────
   The normalised box is what the component needs: it positions the bat by the
   product's own extent, not by the master's padding, so nothing has to hardcode
   a magic offset that silently breaks if the render is ever re-exported. */

const masterBytes = (await stat(MASTER)).size;

console.log(`\n  master        ${width}x${height}  ${kb(masterBytes)}`);
console.log(
  `  bat box       x ${x0}..${x1}  y ${y0}..${y1}  (${x1 - x0 + 1}x${y1 - y0 + 1}, ${(
    ((x1 - x0 + 1) * (y1 - y0 + 1) * 100) /
    (width * height)
  ).toFixed(1)}% of canvas)`,
);
console.log(
  `  normalised    x ${(x0 / width).toFixed(4)}..${(x1 / width).toFixed(4)}  ` +
    `y ${(y0 / height).toFixed(4)}..${(y1 / height).toFixed(4)}`,
);
console.log(
  `  aspect        ${((x1 - x0 + 1) / (y1 - y0 + 1)).toFixed(4)} (w/h)\n`,
);
console.log(`  cleared       ${cleared.toLocaleString()} transparent px`);
console.log(
  `  recovered     ${recovered.toLocaleString()} px into the glow layer\n`,
);

for (const { out, detail, bytes } of written) {
  console.log(`  ${out.padEnd(28)} ${detail.padEnd(12)} ${kb(bytes)}`);
}
const total = written.reduce((sum, w) => sum + w.bytes, 0);
console.log(
  `\n  ${written.length} files, ${kb(total)} — ${(
    (1 - total / masterBytes) *
    100
  ).toFixed(0)}% smaller than the master\n`,
);
