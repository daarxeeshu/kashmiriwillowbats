/* ── The geometry behind ElectricBorder ─────────────────────────────────────────
 *
 * Pure functions, no React and no canvas. Split out from the component for one
 * practical reason: `requestAnimationFrame` cannot be driven in every environment,
 * so the only way to prove the border actually *animates* — that advancing time
 * moves the path — is to sample it directly at two different times. Which needs the
 * math reachable without mounting a component.
 *
 * Component inspired by @BalintFerenczy on X
 * https://codepen.io/BalintFerenczy/pen/KwdoyEN
 * Adapted from the React Bits `ElectricBorder` (reactbits.dev).
 */

export interface Point {
  x: number;
  y: number;
}

/** Deterministic, seeded by position, so the border is the same shape on every
 *  machine and across a resize. Not cryptographic and not meant to be. */
export function random(x: number): number {
  return (Math.sin(x * 12.9898) * 43758.5453) % 1;
}

export function noise2D(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  const a = random(i + j * 57);
  const b = random(i + 1 + j * 57);
  const c = random(i + (j + 1) * 57);
  const d = random(i + 1 + (j + 1) * 57);

  // Smoothstep, so neighbouring cells meet without a visible crease.
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  return (
    a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
  );
}

/** Fractal noise: ten octaves at 1.6 lacunarity is what gives the edge both its
 *  long slow waver and its fine crackle. `time` is the only moving input. */
export function octavedNoise(
  x: number,
  octaves: number,
  lacunarity: number,
  gain: number,
  baseAmplitude: number,
  baseFrequency: number,
  time: number,
  seed: number,
  baseFlatness: number,
): number {
  let y = 0;
  let amplitude = baseAmplitude;
  let frequency = baseFrequency;

  for (let i = 0; i < octaves; i++) {
    let octaveAmplitude = amplitude;
    if (i === 0) octaveAmplitude *= baseFlatness;
    y +=
      octaveAmplitude *
      noise2D(frequency * x + seed * 100, time * frequency * 0.3);
    frequency *= lacunarity;
    amplitude *= gain;
  }

  return y;
}

function cornerPoint(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  arcLength: number,
  progress: number,
): Point {
  const angle = startAngle + progress * arcLength;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

/**
 * `t` walks 0→1 once around a rounded rectangle, by arc length, so samples are
 * evenly spaced along the edge rather than bunching in the corners.
 */
export function roundedRectPoint(
  t: number,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
): Point {
  const straightWidth = width - 2 * radius;
  const straightHeight = height - 2 * radius;
  const cornerArc = (Math.PI * radius) / 2;
  const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
  const distance = t * totalPerimeter;

  let accumulated = 0;

  // Top edge
  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth;
    return { x: left + radius + progress * straightWidth, y: top };
  }
  accumulated += straightWidth;

  // Top-right corner
  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return cornerPoint(
      left + width - radius,
      top + radius,
      radius,
      -Math.PI / 2,
      Math.PI / 2,
      progress,
    );
  }
  accumulated += cornerArc;

  // Right edge
  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight;
    return { x: left + width, y: top + radius + progress * straightHeight };
  }
  accumulated += straightHeight;

  // Bottom-right corner
  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return cornerPoint(
      left + width - radius,
      top + height - radius,
      radius,
      0,
      Math.PI / 2,
      progress,
    );
  }
  accumulated += cornerArc;

  // Bottom edge
  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth;
    return {
      x: left + width - radius - progress * straightWidth,
      y: top + height,
    };
  }
  accumulated += straightWidth;

  // Bottom-left corner
  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return cornerPoint(
      left + radius,
      top + height - radius,
      radius,
      Math.PI / 2,
      Math.PI / 2,
      progress,
    );
  }
  accumulated += cornerArc;

  // Left edge
  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight;
    return { x: left, y: top + height - radius - progress * straightHeight };
  }
  accumulated += straightHeight;

  // Top-left corner
  const progress = (distance - accumulated) / cornerArc;
  return cornerPoint(
    left + radius,
    top + radius,
    radius,
    Math.PI,
    Math.PI / 2,
    progress,
  );
}

/** Fractal noise settings. Exported so the component and any test agree by
 *  construction rather than by two copies of the same numbers. */
export const NOISE = {
  octaves: 10,
  lacunarity: 1.6,
  gain: 0.7,
  frequency: 10,
  baseFlatness: 0,
  /** How far a noise value of 1 pushes a sample off the path, in px. */
  displacement: 60,
} as const;

export interface PathOptions {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
  chaos: number;
  time: number;
}

/** How much of the noise domain one lap around the border covers. */
const NOISE_SPAN = 8;

/**
 * Noise that agrees with itself at t=0 and t=1.
 *
 * ── Why this is not a straight `octavedNoise(t * 8, …)` ──
 * That is what the original did, and it leaves the path open. `t=0` and `t=1` are
 * the same point on the rounded rectangle, but `noise(0)` and `noise(8)` are
 * unrelated values — so the first and last samples were displaced to different
 * places and `closePath()` joined them with a straight chord. Measured at 14.7px
 * on a 330×463 card: a visibly ruler-straight segment across the middle of the top
 * edge, in a border whose whole point is that it crackles.
 *
 * The fix is the standard tiling blend: sample the domain twice, once shifted back
 * a whole span, and cross-fade by `t`. At `t=0` the result is `noise(0)`; at `t=1`
 * it is `noise(8 - 8)` — the same value. Periodic by construction, so the seam
 * closes at every chaos level and every instant rather than being nudged shut.
 */
function tileableNoise(
  t: number,
  chaos: number,
  time: number,
  seed: number,
): number {
  const head = octavedNoise(
    t * NOISE_SPAN,
    NOISE.octaves,
    NOISE.lacunarity,
    NOISE.gain,
    chaos,
    NOISE.frequency,
    time,
    seed,
    NOISE.baseFlatness,
  );
  const wrapped = octavedNoise(
    t * NOISE_SPAN - NOISE_SPAN,
    NOISE.octaves,
    NOISE.lacunarity,
    NOISE.gain,
    chaos,
    NOISE.frequency,
    time,
    seed,
    NOISE.baseFlatness,
  );
  return (1 - t) * head + t * wrapped;
}

/**
 * One sample of the electric path: the point on the rounded rectangle at `t`,
 * displaced by two independent noise fields so the edge wanders in both axes
 * rather than breathing in and out along one diagonal.
 */
export function electricPoint(t: number, options: PathOptions): Point {
  const { left, top, width, height, radius, chaos, time } = options;
  const point = roundedRectPoint(t, left, top, width, height, radius);

  // Seeds 0 and 1 are two unrelated fields, which is what stops the border
  // pulsing along a single axis.
  const xNoise = tileableNoise(t, chaos, time, 0);
  const yNoise = tileableNoise(t, chaos, time, 1);

  return {
    x: point.x + xNoise * NOISE.displacement,
    y: point.y + yNoise * NOISE.displacement,
  };
}

/** How many samples to take around a path of this size. One every ~2px. */
export function sampleCountFor(
  width: number,
  height: number,
  radius: number,
): number {
  const perimeter = 2 * (width + height) + 2 * Math.PI * radius;
  return Math.max(8, Math.floor(perimeter / 2));
}
