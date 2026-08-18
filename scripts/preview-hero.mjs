/**
 * Offscreen preview of the hero background.
 *
 * Ports components/ui/Aurora.tsx's fragment shader to JS and composites it with
 * the exact same layer stack Hero.tsx paints (base → warm radial glow → aurora →
 * readability scrim → bottom fade). Used to verify the visual without a
 * compositing browser, and to produce a lookable PNG.
 *
 * Run: node scripts/preview-hero.mjs [outDir]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// ── Hero.tsx parameters — keep in sync with components/home/Hero.tsx ─────────
let STOPS = ["#37945d", "#f5cf82", "#37945d"];
let AMPLITUDE = 1.1;
let BLEND = 0.5;
const SPEED = 0.55;

/** Candidate looks, rendered side by side so the palette choice is visual. */
const VARIANTS = [
  { name: "a-current", stops: ["#4f9d5c", "#e8c877", "#9a7b4f"], amplitude: 1.05, blend: 0.55 },
  { name: "b-symmetric-willow", stops: ["#3f9e63", "#ffd98a", "#3f9e63"], amplitude: 1.1, blend: 0.5 },
  { name: "c-symmetric-deeper", stops: ["#2f8a55", "#f2c977", "#2f8a55"], amplitude: 1.1, blend: 0.5 },
  { name: "d-gold-led", stops: ["#7cc496", "#ffd98a", "#c08a4a"], amplitude: 1.1, blend: 0.48 },
];

const WIDTH = 950;
const HEIGHT = 512; // 1425x768 measured live, same aspect
const BOTTOM_FADE_FRACTION = 176 / 768; // Hero's `h-44` band

// ── GLSL builtins (JS `%` differs from GLSL `mod` for negatives) ─────────────
const mod = (x, y) => x - y * Math.floor(x / y);
const fract = (x) => x - Math.floor(x);
const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const permute3 = (x) => x.map((v) => mod((v * 34 + 1) * v, 289));

/** 2D simplex noise — same source as the shader's snoise(). */
function snoise(vx, vy) {
  const C0 = 0.211324865405187;
  const C1 = 0.366025403784439;
  const C2 = -0.577350269189626;
  const C3 = 0.024390243902439;

  const dotYY = vx * C1 + vy * C1;
  let ix = Math.floor(vx + dotYY);
  let iy = Math.floor(vy + dotYY);

  const dotXX = ix * C0 + iy * C0;
  const x0x = vx - ix + dotXX;
  const x0y = vy - iy + dotXX;

  const i1x = x0x > x0y ? 1 : 0;
  const i1y = x0x > x0y ? 0 : 1;

  const x12 = [x0x + C0 - i1x, x0y + C0 - i1y, x0x + C2, x0y + C2];

  ix = mod(ix, 289);
  iy = mod(iy, 289);

  const inner = permute3([iy, iy + i1y, iy + 1]);
  const p = permute3([inner[0] + ix, inner[1] + ix + i1x, inner[2] + ix + 1]);

  let m = [
    Math.max(0.5 - (x0x * x0x + x0y * x0y), 0),
    Math.max(0.5 - (x12[0] * x12[0] + x12[1] * x12[1]), 0),
    Math.max(0.5 - (x12[2] * x12[2] + x12[3] * x12[3]), 0),
  ];
  m = m.map((v) => v * v);
  m = m.map((v) => v * v);

  const xs = p.map((v) => 2 * fract(v * C3) - 1);
  const h = xs.map((v) => Math.abs(v) - 0.5);
  const ox = xs.map((v) => Math.floor(v + 0.5));
  const a0 = xs.map((v, k) => v - ox[k]);

  m = m.map((v, k) => v * (1.79284291400159 - 0.85373472095314 * (a0[k] * a0[k] + h[k] * h[k])));

  const g = [
    a0[0] * x0x + h[0] * x0y,
    a0[1] * x12[0] + h[1] * x12[1],
    a0[2] * x12[2] + h[2] * x12[3],
  ];

  return 130 * (m[0] * g[0] + m[1] * g[1] + m[2] * g[2]);
}

/** ogl's Color parses hex as plain sRGB bytes / 255 — no linearisation. */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const RAMP = () => STOPS.map(hexToRgb);
let ramp = RAMP();

/** The shader's COLOR_RAMP macro over stops at 0.0 / 0.5 / 1.0. */
function rampAt(factor) {
  const positions = [0, 0.5, 1];
  let index = 0;
  for (let i = 0; i < 2; i++) if (positions[i] <= factor) index = i;
  const range = positions[index + 1] - positions[index];
  const t = (factor - positions[index]) / range;
  return [0, 1, 2].map((k) => mix(ramp[index][k], ramp[index + 1][k], t));
}

/** One aurora fragment. Returns premultiplied [r, g, b, a] in 0..1. */
function auroraPixel(uvx, uvy, time) {
  const ramp = rampAt(uvx);
  let height = snoise(uvx * 2 + time * 0.1, time * 0.25) * 0.5 * AMPLITUDE;
  height = Math.exp(height);
  height = uvy * 2 - height + 0.2;
  const intensity = 0.6 * height;
  const alpha = smoothstep(0.2 - BLEND * 0.5, 0.2 + BLEND * 0.5, intensity);
  return [
    intensity * ramp[0] * alpha,
    intensity * ramp[1] * alpha,
    intensity * ramp[2] * alpha,
    alpha,
  ];
}

// ── CSS gradient layers ──────────────────────────────────────────────────────
/** CSS interpolates gradients in premultiplied space; so do we. */
function gradientColor(stops, t) {
  if (t <= stops[0].at) return stops[0].rgba;
  const last = stops[stops.length - 1];
  if (t >= last.at) return last.rgba;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t > b.at) continue;
    const f = (t - a.at) / (b.at - a.at);
    const aA = a.rgba[3];
    const bA = b.rgba[3];
    const alpha = mix(aA, bA, f);
    if (alpha === 0) return [0, 0, 0, 0];
    // premultiply → interpolate → unpremultiply
    const ch = [0, 1, 2].map(
      (k) => mix(a.rgba[k] * aA, b.rgba[k] * bA, f) / alpha,
    );
    return [ch[0], ch[1], ch[2], alpha];
  }
  return last.rgba;
}

const rgba = (r, g, b, a) => [r / 255, g / 255, b / 255, a];

const WARM_GLOW = {
  rx: 1.2,
  ry: 0.7,
  cx: 0.5,
  cy: -0.15,
  stops: [
    { at: 0.0, rgba: rgba(154, 123, 79, 0.16) },
    { at: 0.4, rgba: rgba(79, 157, 92, 0.06) },
    { at: 0.7, rgba: [0, 0, 0, 0] },
  ],
};

/**
 * Bottom-weighted rather than a central radial: the curtain lives at the top and
 * a blob over the middle just muddies it, while the copy sits low enough that a
 * downward ramp carries all the contrast it needs.
 */
const SCRIM_STOPS = [
  { at: 0.0, rgba: [0, 0, 0, 0] },
  { at: 0.45, rgba: rgba(14, 13, 11, 0.3) },
  { at: 1.0, rgba: rgba(14, 13, 11, 0.8) },
];

function radialAt(spec, nx, ny) {
  const dx = (nx - spec.cx) / spec.rx;
  const dy = (ny - spec.cy) / spec.ry;
  return gradientColor(spec.stops, Math.hypot(dx, dy));
}

const BOTTOM_FADE_STOPS = [
  { at: 0.0, rgba: [0, 0, 0, 0] }, // top of the band (linear-gradient(to top) → 100%)
  { at: 0.55, rgba: rgba(14, 13, 11, 0.62) },
  { at: 1.0, rgba: rgba(14, 13, 11, 1.0) },
];

/** Straight (non-premultiplied) source over destination. */
function over(dst, src) {
  const a = src[3];
  if (a <= 0) return dst;
  return [
    src[0] * a + dst[0] * (1 - a),
    src[1] * a + dst[1] * (1 - a),
    src[2] * a + dst[2] * (1 - a),
  ];
}

const BASE = [14 / 255, 13 / 255, 11 / 255];
const srgb8 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));

function renderFrame(time) {
  const rgb = Buffer.allocUnsafe(WIDTH * HEIGHT * 3);
  for (let row = 0; row < HEIGHT; row++) {
    const ny = (row + 0.5) / HEIGHT; // 0 = top, CSS orientation
    const uvy = 1 - ny; // gl_FragCoord.y counts up from the bottom
    for (let col = 0; col < WIDTH; col++) {
      const nx = (col + 0.5) / WIDTH;

      let px = BASE;
      px = over(px, radialAt(WARM_GLOW, nx, ny));

      // Aurora arrives premultiplied under blendFunc(ONE, ONE_MINUS_SRC_ALPHA).
      const a = auroraPixel(nx, uvy, time);
      px = [
        a[0] + px[0] * (1 - a[3]),
        a[1] + px[1] * (1 - a[3]),
        a[2] + px[2] * (1 - a[3]),
      ];

      px = over(px, gradientColor(SCRIM_STOPS, ny));

      const bandTop = 1 - BOTTOM_FADE_FRACTION;
      if (ny >= bandTop) {
        const bandT = (ny - bandTop) / BOTTOM_FADE_FRACTION;
        px = over(px, gradientColor(BOTTOM_FADE_STOPS, bandT));
      }

      const o = (row * WIDTH + col) * 3;
      rgb[o] = srgb8(px[0]);
      rgb[o + 1] = srgb8(px[1]);
      rgb[o + 2] = srgb8(px[2]);
    }
  }
  return rgb;
}

// ── Minimal PNG encoder (RGB8, no dependencies) ──────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgb, width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const raw = Buffer.allocUnsafe(height * (1 + width * 3));
  for (let row = 0; row < height; row++) {
    const dst = row * (1 + width * 3);
    raw[dst] = 0; // filter: none
    rgb.copy(raw, dst + 1, row * width * 3, (row + 1) * width * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Run ──────────────────────────────────────────────────────────────────────
const outDir = process.argv[2] ?? ".";
const mode = process.argv[3] ?? "variants";
fs.mkdirSync(outDir, { recursive: true });

if (mode === "variants") {
  // One tall contact sheet so the palettes can be compared in a single look.
  const GAP = 6;
  const tiles = VARIANTS.map((v) => {
    STOPS = v.stops;
    AMPLITUDE = v.amplitude;
    BLEND = v.blend;
    ramp = RAMP();
    console.log(`${v.name}: ${v.stops.join(" ")}  amp=${v.amplitude} blend=${v.blend}`);
    return renderFrame(6 * SPEED);
  });

  const totalH = HEIGHT * tiles.length + GAP * (tiles.length - 1);
  const sheet = Buffer.alloc(WIDTH * totalH * 3, 0xff);
  tiles.forEach((tile, i) => {
    const yOffset = i * (HEIGHT + GAP);
    tile.copy(sheet, yOffset * WIDTH * 3);
  });
  const file = path.join(outDir, "hero-variants.png");
  fs.writeFileSync(file, encodePng(sheet, WIDTH, totalH));
  console.log(`\n${file}  (top to bottom: ${VARIANTS.map((v) => v.name).join(", ")})`);
} else {
  // Final look, sampled across the animation.
  for (const seconds of [0, 6, 14]) {
    const time = seconds * SPEED;
    const png = encodePng(renderFrame(time), WIDTH, HEIGHT);
    const file = path.join(outDir, `hero-bg-t${seconds}s.png`);
    fs.writeFileSync(file, png);
    console.log(`${file}  ${(png.length / 1024).toFixed(0)} KB  (uTime=${time.toFixed(2)})`);
  }
}
