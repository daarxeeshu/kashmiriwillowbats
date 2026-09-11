/**
 * The three faces the laser can cut.
 *
 * `track` is letter-spacing as a fraction of cap height, applied by hand in
 * `paintText` because `ctx.letterSpacing` is not universal yet. `css` is a font
 * shorthand with `1em` standing in for the size, which the layout substitutes per
 * line — so one string carries style, weight and family and the caller only decides
 * how big.
 *
 * ── Why the family is injectable ──
 * The standalone build linked Barlow Condensed from Google Fonts in its own
 * `index.html`. The storefront loads its fonts through `next/font`, which self-hosts
 * each face under a *generated* family name — there is no global "Barlow Condensed"
 * to name in a canvas font string, and naming it anyway would silently fall through
 * to Arial Narrow. Engraving is type: a face that falls back changes the shape of a
 * customer's name between the preview and the bat, and does it without reporting
 * anything.
 *
 * So the studio passes down the family that `next/font` actually generated, and the
 * declared stack below is what it falls back to if it ever does not.
 */

/** Family injected by the page, per font id. */
const injected = {};

/**
 * @param id      one of the font ids below
 * @param family  the `style.fontFamily` a `next/font` loader produced
 */
export function setEngraveFontFamily(id, family) {
  if (family) injected[id] = family;
}

/** Has the face actually arrived? Canvas draws with whatever is resolved at the
 *  moment of the call, so this is the only honest way to know the preview is showing
 *  the right letterforms. */
export function engraveFontReady(id, sizePx = 40) {
  const font = ENGRAVE_FONTS.find((f) => f.id === id);
  if (!font || !document.fonts?.check) return true;
  try {
    return document.fonts.check(font.css.replace("1em", `${sizePx}px`));
  } catch {
    return true;
  }
}

const SPEC = [
  {
    id: "block",
    label: "Block",
    style: "",
    weight: "700",
    // A condensed face, because a fourteen-character name has to fit across 108 mm
    // of blade without shrinking to nothing.
    stack: ["'Barlow Condensed'", "'Arial Narrow'", "Impact", "sans-serif"],
    track: 0.06,
  },
  {
    id: "serif",
    label: "Classic",
    style: "",
    weight: "700",
    stack: ["Georgia", "'Times New Roman'", "serif"],
    track: 0.04,
  },
  {
    id: "script",
    label: "Script",
    style: "italic",
    weight: "700",
    stack: ["Georgia", "'Times New Roman'", "serif"],
    track: 0.02,
  },
];

export const ENGRAVE_FONTS = SPEC.map((spec) => ({
  id: spec.id,
  label: spec.label,
  track: spec.track,
  /* A getter rather than a string, so a family injected after this module was first
     imported still applies — the page mounts and the engine loads in either order. */
  get css() {
    const stack = injected[spec.id]
      ? [injected[spec.id], ...spec.stack]
      : spec.stack;
    return `${spec.style} ${spec.weight} 1em ${stack.join(", ")}`.trim();
  },
}));
