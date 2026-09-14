/* ── Prepare photographs for the site ────────────────────────────────────────────
 *
 * Takes a folder of raw photographs and writes web-ready versions into the right
 * place, named the way the data files expect.
 *
 *   node scripts/prepare-images.mjs --in "C:/photos/bats" --kind bat
 *   node scripts/prepare-images.mjs --in ./raw/players --kind player
 *   node scripts/prepare-images.mjs --in ./raw --kind equipment --dry
 *
 * ── What it deliberately does NOT do: crop ──
 * Every surface crops differently — a bat card is 4:5, the bat detail page is 1:2, a
 * gallery tile is 3:4 — and `object-cover` performs that crop at render time against
 * the frame it is actually in. A crop baked in here would throw away the pixels the
 * *other* frame needed, permanently, from the only copy. So this only ever scales the
 * whole photograph down.
 *
 * What it does instead is *warn* when a photograph's shape means a heavy crop is
 * coming, with the number, so a badly-shaped photo is caught before it is on the site
 * rather than after.
 *
 * ── Never upscales ──
 * A 900px photo enlarged to 1600 is a soft 1600px photo. If a file is already smaller
 * than the budget it is converted and left at its own size, and the report says so.
 *
 * ── Transparency ──
 * Everything is written as WebP, transparency included — WebP carries an alpha channel
 * perfectly well.
 *
 * This reverses an earlier rule in this file that sent any image with alpha to PNG. The
 * reasoning behind it was sound and still holds: a browser accepting neither AVIF nor
 * WebP is served JPEG by Next, and JPEG has no alpha, so a cut-out would arrive on a
 * solid background. What was wrong was the weighting. Two player photographs with soft
 * faded edges came through this and were written at 3.8MB and 3.5MB; the same files as
 * WebP are 342KB and 362KB with the transparency intact. Charging every visitor eleven
 * times the bytes to protect a browser share now close to nil is the worse trade, and
 * on a phone over mobile data it is much the worse trade.
 *
 * ── Alpha that is not really there ──
 * A channel being present is not the same as it being used. Exporters routinely leave
 * an image at alpha 252 with dithered noise beneath, and encoding that costs real
 * bytes for transparency nobody asked for. `needsAlpha` measures how much of the image
 * is meaningfully see-through and drops the channel when the answer is "none".
 */

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

/* Long-edge budget and the shape each surface actually renders at. `ideal` is only
 * used to judge how hard the crop will be — nothing is resized to it. */
const KINDS = {
  bat: {
    label: "Bat",
    maxW: 1600,
    maxH: 2400,
    frames: [["card", 4 / 5], ["detail page", 1 / 2]],
    out: "public/products",
    note: "cards crop to 4:5, the detail page to 1:2",
  },
  equipment: {
    label: "Equipment",
    maxW: 1600,
    maxH: 2000,
    frames: [["card and detail page", 4 / 5]],
    out: "public/products",
    note: "cards and detail page are both 4:5",
  },
  player: {
    label: "Wall of Fame",
    maxW: 1500,
    maxH: 2000,
    frames: [["tile", 3 / 4]],
    out: "public/gallery",
    note: "tiles are 3:4",
  },
  cover: {
    label: "Category / brand cover",
    maxW: 1600,
    /* 1600, not 1200. A cover card is not always a wide banner: the homepage carousel
       renders it portrait (~0.77) and the equipment hub renders it landscape (~1.48),
       so a portrait source is legitimate. A 1200 height cap silently threw away 39% of
       the pixels of a 1024x1536 cover before Next ever resized it, and the cards came
       out visibly soft. The budget is now square so neither orientation is penalised. */
    maxH: 1600,
    frames: [
      ["homepage carousel", 10 / 13],
      ["equipment hub card", 1.48],
    ],
    out: "public/categories",
    note: "portrait on the carousel, landscape on the hub",
  },
};

const ACCEPTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"]);

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}

/** Filenames become URL path segments, so they are normalised the same way product
 *  slugs are. "KIS M&H7000+ Front.JPG" -> "kis-mandh7000-front". */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* Does this image actually use its alpha channel?
 *
 * `stats().isOpaque` is not the question. It is false the moment a single pixel is a
 * hair under 255, and exporters routinely leave a whole image sitting at alpha 252
 * with dithered noise underneath. Two studio photographs of cricketers came through
 * that way — solid dark-blue backgrounds, nothing transparent anywhere — and were
 * written as PNG at 3.8MB each instead of WebP at about 100KB, a 38x penalty on a
 * gallery thumbnail for transparency that did not exist.
 *
 * So the test is whether enough of the image is *meaningfully* see-through to be worth
 * keeping: more than half a percent of pixels below alpha 200. A real cut-out is
 * mostly transparent and clears that easily; export noise sits near 255 and does not.
 */
async function needsAlpha(src, meta) {
  if (!meta.hasAlpha) return false;

  const { data, info } = await sharp(src, { failOn: "none" })
    .ensureAlpha()
    // Judged on a thumbnail: 200x200 is ample for a proportion and avoids walking
    // every pixel of a 4000px photograph.
    .resize(200, 200, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let translucent = 0;
  const pixels = info.width * info.height;
  for (let i = 3; i < data.length; i += info.channels) {
    if (data[i] < 200) translucent += 1;
  }
  return translucent / pixels > 0.005;
}

function human(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1048576).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

async function main() {
  const inDir = arg("in");
  const kindKey = arg("kind");
  const dry = Boolean(arg("dry", false));

  if (!inDir || !kindKey || !KINDS[kindKey]) {
    console.error(`
Usage:
  node scripts/prepare-images.mjs --in <folder> --kind <${Object.keys(KINDS).join("|")}> [--out <folder>] [--dry]

  --in    folder of raw photographs
  --kind  ${Object.keys(KINDS).join(" | ")}
  --out   override the destination
  --dry   report what would happen, write nothing
`);
    process.exit(1);
  }

  const kind = KINDS[kindKey];
  const outDir = resolve(String(arg("out", kind.out)));
  const srcDir = resolve(String(inDir));

  if (!existsSync(srcDir)) {
    console.error(`Input folder not found: ${srcDir}`);
    process.exit(1);
  }

  const files = readdirSync(srcDir).filter(
    (f) => ACCEPTED.has(extname(f).toLowerCase()) && statSync(join(srcDir, f)).isFile(),
  );

  if (files.length === 0) {
    console.error(`No images in ${srcDir} (looking for ${[...ACCEPTED].join(", ")})`);
    process.exit(1);
  }

  console.log(`\n${kind.label} — ${kind.note}`);
  console.log(`Budget ${kind.maxW}x${kind.maxH}, no upscaling, no cropping.`);
  console.log(`${srcDir}  ->  ${outDir}${dry ? "   [DRY RUN]" : ""}\n`);

  if (!dry) mkdirSync(outDir, { recursive: true });

  const warnings = [];
  let done = 0;

  for (const file of files) {
    const src = join(srcDir, file);
    const image = sharp(src, { failOn: "none" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height) {
      warnings.push(`${file}: could not read dimensions — skipped`);
      continue;
    }

    // Alpha decides the output format, for the reason in the header.
    const hasAlpha = await needsAlpha(src, meta);
    const ext = ".webp";
    const slug = slugify(basename(file, extname(file)));
    const dest = join(outDir, slug + ext);

    // `inside` scales the whole frame down to fit the budget; `withoutEnlargement`
    // is what guarantees a small original is never blown up into a soft big one.
    const pipeline = sharp(src, { failOn: "none" }).rotate().resize({
      width: kind.maxW,
      height: kind.maxH,
      fit: "inside",
      withoutEnlargement: true,
    });

    /* One format out. The only decision left is whether to carry the alpha channel:
       when it is present but unused, dropping it saves the bytes of encoding a plane
       of near-255 noise, and `removeAlpha` keeps the colour exactly as stored. */
    const encoded = (hasAlpha ? pipeline : pipeline.removeAlpha()).webp({
      quality: 82,
    });

    const buf = await encoded.toBuffer();
    const outMeta = await sharp(buf).metadata();

    if (!dry) await sharp(buf).toFile(dest);

    const ratio = outMeta.width / outMeta.height;
    const crops = kind.frames.map(([where, frame]) => ({
      where,
      // Taller than the frame loses height; wider loses width.
      axis: ratio < frame ? "height" : "width",
      lost: Math.round((1 - Math.min(ratio, frame) / Math.max(ratio, frame)) * 100),
    }));
    const worst = crops.reduce((a, b) => (b.lost > a.lost ? b : a));
    const smaller = meta.width < kind.maxW && meta.height < kind.maxH;

    console.log(
      `  ${slug}${ext}`.padEnd(42) +
        `${outMeta.width}x${outMeta.height}`.padEnd(12) +
        `${hasAlpha ? "WebP alpha" : "WebP"}`.padEnd(11) +
        human(buf.length),
    );

    // 35%, not 20%: a bat is a tall subject and some crop on a squarer card is
    // normal and fine. This fires when enough is lost that the ends of the bat or
    // the top of a head are genuinely at risk.
    if (worst.lost >= 35) {
      warnings.push(
        `${slug}: on the ${worst.where} about ${worst.lost}% of the ${worst.axis} is cropped away (photo is ${ratio.toFixed(2)}, frame is ${(kind.frames.find(([w]) => w === worst.where)[1]).toFixed(2)}). Fine if there is empty margin there — a problem if the ${worst.axis === "height" ? "toe or handle reaches the edge" : "sides are tight"}.`,
      );
    }
    if (smaller) {
      warnings.push(
        `${slug}: original is only ${meta.width}x${meta.height}, below the ${kind.maxW}x${kind.maxH} budget. Left at its own size rather than upscaled — it will look soft on a large screen.`,
      );
    }
    done += 1;
  }

  console.log(`\n${done} image${done === 1 ? "" : "s"} ${dry ? "would be written" : "written"}.`);

  if (warnings.length) {
    console.log(`\nWorth a look:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  console.log(
    `\nNext: point the data at the new filenames, e.g.\n  image: "/${kind.out.replace("public/", "")}/<name>${""}"\n`,
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
