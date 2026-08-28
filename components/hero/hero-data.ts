// components/hero/hero-data.ts
//
// Static description of the cinematic hero: where things sit, when they appear,
// and how far they travel. Separated from the component because none of it is
// behaviour — it is the storyboard, and keeping it out of the JSX is what makes
// the sequence readable as a sequence.
//
// Timings and positions are taken from the reference sequence in
// design/hero/sequence/ (300 frames), so the percentages below are measurements
// rather than taste. Frame N maps to progress (N - 1) / 299.

/* ── Phase boundaries ──────────────────────────────────────────────────────────
   Scroll progress 0 → 1 across the whole pinned stage. Named so the transforms
   below read as a shot list; the numbers are where the reference cuts.

     reveal    f1–48     void, bat drifts closer, nothing else
     annotate  f48–150   headline in from the left, glass slab, spec cards land
     hold      f150–165  everything present, camera still
     push      f165–195  dolly in, cards disperse, headline falls away
     macro     f195–228  blade and sticker fill the frame
     settle    f228–300  pull back to the shop composition, nav and CTAs arrive */

export const PHASE = {
  revealEnd: 0.16,
  headlineIn: [0.16, 0.3] as const,
  specsIn: [0.3, 0.5] as const,
  pushIn: [0.5, 0.64] as const,
  macro: [0.64, 0.76] as const,
  settleIn: [0.76, 0.94] as const,
} as const;

/** Where the connector lines converge, as a percentage of the stage. Sits on the
    blade just below the sticker, where the bat rests through the annotate phase. */
export const HUB = { x: 55.4, y: 52 } as const;

export interface SpecCard {
  id: string;
  /** Small label above the value. Omitted on the blank depth panels. */
  eyebrow?: string;
  title?: string;
  /** Resting top-left corner, as a percentage of the stage. */
  x: number;
  y: number;
  /** Panel width. A CSS length so it can scale with the viewport. */
  w: string;
  /** Progress at which this panel starts fading in. */
  at: number;
  /**
   * Which way the panel travels when the camera pushes past it. Cards on the
   * left of the bat exit left, cards on the right exit right — the product
   * appears to come through the middle of them rather than the group sliding.
   */
  dir: -1 | 1;
  /**
   * Parallax weight, roughly "how near the camera". Drives dispersal distance
   * during the push and cursor-tilt strength. Blank panels sit further back.
   */
  depth: number;
  /** Three dim status dots, as the reference's annotation panels carry. */
  dots?: boolean;
  /**
   * Where this panel's connector line leaves it, in stage percentages — the edge
   * facing the bat. Authored rather than measured: the panel's width is a
   * clamp(), so its right edge has no fixed percentage, and a ResizeObserver to
   * recover one would run layout on every viewport change to place a hairline.
   * Omit to draw no connector.
   */
  anchor?: { x: number; y: number };
  /** Rendered behind the bat instead of in front of it. */
  behind?: boolean;
  /** Survives the push as an out-of-focus label at the edge of the macro shot. */
  peripheral?: boolean;
  /** Hidden below this breakpoint. Tailwind classes, so it costs no JS. */
  showAt?: string;
}

/* ── Spec panels ──────────────────────────────────────────────────────────────
   Five carry copy, two are blank glass sitting behind the product for depth.

   The reference clusters annotations on both sides of the bat, which is what
   makes the shot read as an exploded engineering diagram rather than a caption
   list. That costs horizontal room, so the two left-hand panels sit low — below
   the headline block, which occupies x 6–38 / y 34–62 — and both drop out under
   the `lg` breakpoint where there is no room for them beside the type.

   "LIQUID GLASS" is in the brief and appears twice in the reference. On its own
   it names a design language rather than anything about a bat, so it is framed
   here as what it can honestly describe: the lacquer finish. */

export const SPEC_CARDS: SpecCard[] = [
  {
    id: "willow",
    eyebrow: "100%",
    title: "Kashmiri Willow",
    x: 33,
    y: 17,
    w: "clamp(132px, 12vw, 170px)",
    at: 0.315,
    dir: -1,
    depth: 1,
    dots: true,
    anchor: { x: 44, y: 21 },
    showAt: "hidden lg:flex",
  },
  {
    id: "grade",
    eyebrow: "Grade 1+",
    title: "Hand Cleft",
    x: 70,
    y: 13,
    w: "clamp(132px, 12vw, 170px)",
    at: 0.335,
    dir: 1,
    depth: 1.15,
    dots: true,
    anchor: { x: 70, y: 17 },
  },
  {
    id: "grains",
    eyebrow: "Hand Selected",
    title: "Premium Grains",
    x: 72.5,
    y: 37,
    w: "clamp(140px, 13vw, 182px)",
    at: 0.36,
    dir: 1,
    depth: 0.95,
    anchor: { x: 72.5, y: 41 },
  },
  {
    id: "balance",
    eyebrow: "Pro Balance",
    title: "Power + Control",
    x: 69,
    y: 62,
    w: "clamp(140px, 13vw, 180px)",
    at: 0.385,
    dir: 1,
    depth: 1.3,
    anchor: { x: 69, y: 66 },
    peripheral: true,
  },
  {
    id: "finish",
    eyebrow: "Finish",
    title: "Liquid Glass",
    x: 31,
    y: 66,
    w: "clamp(132px, 12vw, 168px)",
    at: 0.41,
    dir: -1,
    depth: 1.1,
    anchor: { x: 42, y: 70 },
    peripheral: true,
    showAt: "hidden lg:flex",
  },
  // Blank panels. No copy — they exist so the bat has glass in front of and
  // behind it, which is most of what makes the stage feel like it has depth.
  {
    id: "depth-a",
    x: 44,
    y: 25,
    w: "clamp(70px, 7vw, 96px)",
    at: 0.325,
    dir: -1,
    depth: 0.5,
    behind: true,
    showAt: "hidden md:flex",
  },
  {
    id: "depth-b",
    x: 62,
    y: 55,
    w: "clamp(62px, 6vw, 84px)",
    at: 0.355,
    dir: 1,
    depth: 0.42,
    behind: true,
    showAt: "hidden md:flex",
  },
];

/* ── Atmosphere ───────────────────────────────────────────────────────────────
   Positions are generated from a fixed seed rather than Math.random(): the field
   is rendered on the server and rehydrated on the client, and a random layout
   would differ between the two and throw a hydration mismatch. A seeded PRNG at
   module scope runs once per process and produces the same field in both. */

export type ParticleKind = "dust" | "star";

export interface Particle {
  x: number;
  y: number;
  /** Pixels. */
  size: number;
  opacity: number;
  /** Parallax weight against the camera. */
  depth: number;
  /** Seconds, so the ambient loops never resynchronise. */
  delay: number;
  duration: number;
  kind: ParticleKind;
  /** Thinned out on small screens — fewer composited layers on weaker GPUs. */
  showAt?: string;
}

/** mulberry32. Small, fast, and good enough for scattering dust. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParticles(count: number): Particle[] {
  const random = mulberry32(0x5157_1b07);
  const out: Particle[] = [];

  for (let i = 0; i < count; i += 1) {
    // Every fifth mote is a sparkle. The reference keeps these rare and mostly
    // low in frame — a field of them reads as snow rather than as stray glints.
    const star = i % 5 === 2;
    out.push({
      x: random() * 100,
      y: random() * 100,
      size: star ? 5 + random() * 5 : 1 + random() * 1.8,
      opacity: star ? 0.3 + random() * 0.4 : 0.1 + random() * 0.3,
      depth: 0.25 + random() * 1.1,
      delay: random() * -9,
      duration: 5 + random() * 6,
      kind: star ? "star" : "dust",
      // Keep the first twelve everywhere; the rest are desktop dressing.
      showAt: i < 12 ? undefined : "hidden md:block",
    });
  }

  return out;
}

export const PARTICLES = buildParticles(30);
