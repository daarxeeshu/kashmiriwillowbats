/**
 * Live artwork.
 *
 * Two canvases per bat face. One holds the sticker, one holds the laser burn.
 * Both are drawn in *bat units* rather than pixels, so a change to the canvas
 * resolution never moves the artwork, and — the part that matters for the
 * factory — the same layout numbers can be re-used to lay out a print file in
 * millimetres.
 *
 * This is the piece the demonstrated system has no equivalent of. Because the
 * artwork is composed at runtime rather than baked, a name typed into a box can
 * appear on the blade in the same frame.
 */
import * as THREE from 'three';
import { ENGRAVE_FONTS } from './fonts.js';

/** A canvas mapped onto a rectangle of bat space, drawn in bat units. */
export class BatCanvas {
  /**
   * @param rect  {x, y, w, h} in bat units — y is the toe, h runs to the shoulder
   * @param pxPerUnit resolution
   */
  constructor(rect, pxPerUnit, { srgb = true } = {}) {
    this.rect = rect;
    this.scale = pxPerUnit;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.w * pxPerUnit);
    canvas.height = Math.round(rect.h * pxPerUnit);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: false });

    this.texture = new THREE.CanvasTexture(canvas);
    // Canvas rows run top-down and so does our `py()`; three flips textures by
    // default, which would land the sticker on the toe, upside down.
    this.texture.flipY = false;
    this.texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    this.texture.anisotropy = 8;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
  }

  /** bat x → canvas px */
  px(x) { return (x - this.rect.x) * this.scale; }
  /** bat v (0 = toe, 1 = shoulder) → canvas px, y down */
  py(v) { return (1 - v) * this.rect.h * this.scale; }
  /** bat units → px */
  u(n) { return n * this.scale; }

  /**
   * @param fill  pass a colour for maps read through a colour channel rather
   *   than through alpha. The burn map is one: the shader reads `.r`, so it
   *   needs an opaque black ground. Left transparent, an anti-aliased or
   *   blurred white glyph still stores r = 255 at alpha ≈ 0, and every soft
   *   edge reads as a full-depth burn — which welds neighbouring letters into
   *   one solid slab.
   */
  clear(fill) {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  commit() { this.texture.needsUpdate = true; }
}

/* ------------------------------------------------------------------ *
 * Sticker
 * ------------------------------------------------------------------ */

/** Where the sticker sits, as a fraction of blade width and length. */
export const STICKER_LAYOUT = {
  widthFrac: 0.74,   // of blade width
  topV: 0.985,       // just under the shoulder
};

/** Where the sticker's lower edge falls, in v — the brand sits just below it. */
export function stickerBottomV(bc, image) {
  if (!image) return 0.70;
  const aspect = image.width / image.height;
  const h = (bc.rect.w * STICKER_LAYOUT.widthFrac) / aspect;
  return STICKER_LAYOUT.topV - h / bc.rect.h;
}

export function drawSticker(bc, image) {
  bc.clear();
  if (!image) return bc.commit();

  const aspect = image.width / image.height;
  const w = bc.rect.w * STICKER_LAYOUT.widthFrac;
  const h = w / aspect;
  const cx = bc.rect.x + bc.rect.w / 2;

  const left = bc.px(cx - w / 2);
  const top = bc.py(STICKER_LAYOUT.topV);

  const ctx = bc.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // A printed sticker sits on the wood, it does not float above it. A short,
  // tight shadow under the die-cut edge sells the lamination.
  ctx.save();
  ctx.shadowColor = 'rgba(24,16,6,0.42)';
  ctx.shadowBlur = bc.u(0.006);
  ctx.shadowOffsetY = bc.u(0.0035);
  ctx.drawImage(image, left, top, bc.u(w), bc.u(h));
  ctx.restore();

  bc.commit();
}

/* ------------------------------------------------------------------ *
 * Laser engraving
 *
 * The canvas is a burn map, not a picture: red channel is how hard the laser
 * hit that spot. The material turns that into colour, roughness and relief.
 * ------------------------------------------------------------------ */

/**
 * @param brand  {name, v} — the bat's own name, burnt below the sticker. It is
 *   part of the bat rather than part of the personalisation, so it is drawn
 *   whatever the customer does with their own engraving, and it is not included
 *   in the draggable extent.
 */
export function drawEngraving(bc, engrave, face = 'front', brand = null) {
  bc.clear('#000000');
  bc.extent = null;
  const ctx = bc.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (brand?.name && face === 'front') drawBrand(bc, ctx, brand);

  if (!engrave?.on) return bc.commit();

  const wantsBack = engrave.face === 'back';
  if ((face === 'back') !== wantsBack) return bc.commit();

  const font = ENGRAVE_FONTS.find((f) => f.id === engrave.font) ?? ENGRAVE_FONTS[0];
  const text = String(engrave.text ?? '').trim().toUpperCase();
  const number = String(engrave.number ?? '').trim();
  if (!text && !number && !engrave.logo) return bc.commit();

  // The mark sits wherever the customer dragged it, not on the centre line.
  // u is measured across the face; on the spine the view is mirrored, so the
  // canvas coordinate has to mirror with it or the mark jumps sides.
  const pos = engrave.pos ?? { u: 0.5, v: 0.115 };
  const u = wantsBack ? 1 - pos.u : pos.u;
  const cx = u * bc.canvas.width;
  let y = bc.py(pos.v);

  const sizePx = bc.u((engrave.size ?? 0.28) * bc.rect.w);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = [];
  if (text) lines.push({ s: text, size: sizePx, track: font.track });
  if (number) lines.push({ s: number, size: sizePx * 1.28, track: 0.02 });

  // A blade is 108 mm wide and a name can be fourteen characters. Fit the type
  // to the wood rather than letting "XEESHAN" run off both edges — which is
  // what a real engraver does, and what the print file will have to do too.
  const maxWidth = bc.u(bc.rect.w * ENGRAVE_FIT);
  for (const line of lines) {
    ctx.font = font.css.replace('1em', `${line.size}px`);
    const natural = measureTracked(ctx, line);
    if (natural > maxWidth) line.size *= maxWidth / natural;
  }

  // Lay name, number and mark out as one stack centred on the placement anchor.
  // Treating the mark as another block — rather than dropping it below whatever
  // the text happened to leave behind — is what stops a name *and* a number
  // *and* a crest walking off the end of the toe.
  const gap = sizePx * 0.34;
  const blocks = lines.map((line) => ({ kind: 'text', line, h: line.size }));

  if (engrave.logo?.width) {
    const w = bc.u((engrave.size ?? ENGRAVE_SIZE_DEFAULT) * bc.rect.w * 1.9);
    blocks.push({
      kind: 'logo',
      w,
      h: w * (engrave.logo.height / engrave.logo.width),
    });
  }

  let totalH = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);

  // A name, a number and a crest together are taller than the room below the
  // anchor. Shrink to fit the blade if we must, then slide the stack back inside
  // its edges — engraving that runs onto the curve of the toe cannot be cut.
  const margin = bc.u(bc.rect.h * 0.035);
  const available = bc.canvas.height - margin * 2;
  if (totalH > available) {
    const k = available / totalH;
    for (const b of blocks) {
      b.h *= k;
      b.w *= k;
      if (b.line) b.line.size *= k;
    }
    totalH = available;
  }

  y -= totalH / 2;
  y = Math.min(Math.max(y, margin), bc.canvas.height - margin - totalH);

  const widest = Math.max(
    ...blocks.map((bl) => (bl.kind === 'logo' ? bl.w : measuredWidth(ctx, bl.line, font))),
    1,
  );
  const halfW = Math.min(widest / 2, bc.canvas.width / 2 - margin);
  const cxClamped = Math.min(
    Math.max(cx, halfW + margin), bc.canvas.width - halfW - margin,
  );

  // Report what we actually laid out, so the close-up camera can frame the real
  // engraving and the drag handle knows what it is grabbing.
  bc.extent = {
    top: 1 - y / bc.canvas.height,
    bottom: 1 - (y + totalH) / bc.canvas.height,
    height: totalH / bc.canvas.height,
    left: (cxClamped - halfW) / bc.canvas.width,
    right: (cxClamped + halfW) / bc.canvas.width,
  };

  for (const block of blocks) {
    const centre = y + block.h / 2;
    const cx = cxClamped;
    if (block.kind === 'text') {
      // Pass 1: the scorch halo. Real burns bloom into the surrounding grain.
      ctx.save();
      ctx.filter = `blur(${Math.max(1, block.line.size * 0.055)}px)`;
      ctx.globalAlpha = 0.42;
      paintText(ctx, block.line, cx, centre, font, '#ffffff');
      ctx.restore();

      // Pass 2: the cut itself, hard-edged.
      ctx.save();
      ctx.globalAlpha = 1;
      paintText(ctx, block.line, cx, centre, font, '#ffffff');
      ctx.restore();
    } else {
      drawLogo(ctx, engrave.logo, cx, centre, block.w, block.h);
    }
    y += block.h + gap;
  }

  bc.commit();
}

/** Cap height used when a configuration does not carry one. */
const ENGRAVE_SIZE_DEFAULT = 0.28;

/** Widest the engraving may run, as a fraction of blade width. */
const ENGRAVE_FIT = 0.70;

/** Width of a laid-out line, setting the font first. */
function measuredWidth(ctx, line, font) {
  ctx.font = font.css.replace('1em', `${line.size}px`);
  return measureTracked(ctx, line);
}

/** Width of a line including its letter-spacing. Assumes ctx.font is set. */
function measureTracked(ctx, line) {
  const track = line.size * (line.track ?? 0);
  let w = 0;
  for (const ch of line.s) w += ctx.measureText(ch).width;
  return w + track * Math.max(0, line.s.length - 1);
}

/**
 * The bat's model name, burnt into the willow just under the sticker — where
 * KIS's own bats carry it. Wider tracking and a lighter cut than a customer's
 * name, so it reads as branding rather than personalisation.
 */
function drawBrand(bc, ctx, brand) {
  const font = ENGRAVE_FONTS[0];
  const line = {
    s: String(brand.name).toUpperCase(),
    size: bc.u(0.155 * bc.rect.w),
    track: 0.14,
  };

  const maxWidth = bc.u(bc.rect.w * 0.62);
  ctx.font = font.css.replace('1em', `${line.size}px`);
  const natural = measureTracked(ctx, line);
  if (natural > maxWidth) line.size *= maxWidth / natural;

  const cx = bc.canvas.width / 2;
  const y = bc.py(brand.v);

  ctx.save();
  ctx.filter = `blur(${Math.max(1, line.size * 0.05)}px)`;
  ctx.globalAlpha = 0.34;
  paintText(ctx, line, cx, y, font, '#ffffff');
  ctx.restore();

  ctx.save();
  // Shallower than a personal engraving: this is a maker's mark, not a name.
  ctx.globalAlpha = 0.8;
  paintText(ctx, line, cx, y, font, '#ffffff');
  ctx.restore();
}

function paintText(ctx, line, cx, y, font, colour) {
  ctx.fillStyle = colour;
  ctx.font = font.css.replace('1em', `${line.size}px`);
  if (!line.track) {
    ctx.fillText(line.s, cx, y);
    return;
  }
  // Letter-spacing by hand — `ctx.letterSpacing` is not universal yet.
  const track = line.size * line.track;
  const widths = [...line.s].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, w) => a + w, 0) + track * (line.s.length - 1);
  let x = cx - total / 2;
  for (let i = 0; i < line.s.length; i++) {
    ctx.textAlign = 'left';
    ctx.fillText(line.s[i], x, y);
    x += widths[i] + track;
  }
  ctx.textAlign = 'center';
}

function drawLogo(ctx, img, cx, cy, w, h) {
  if (!img?.width) return;

  // An engraved mark is a silhouette — the laser has no colours. Threshold the
  // uploaded artwork to luminance so the preview tells the truth about what the
  // machine can actually cut.
  const tmp = document.createElement('canvas');
  tmp.width = Math.max(2, Math.round(w));
  tmp.height = Math.max(2, Math.round(h));
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0, tmp.width, tmp.height);
  const data = tc.getImageData(0, 0, tmp.width, tmp.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    const burn = (1 - lum) * (d[i + 3] / 255);
    d[i] = d[i + 1] = d[i + 2] = 255;
    d[i + 3] = Math.round(Math.min(1, burn * 1.25) * 255);
  }
  tc.putImageData(data, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(tmp, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

/* ------------------------------------------------------------------ */

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}
