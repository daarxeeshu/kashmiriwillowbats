'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Aurora, { type AuroraColorStops } from '@/components/ui/Aurora';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Deep willow green at both edges with a warm gold sweep through the centre.
 * The ramp is deliberately symmetric — the same trick the reference uses — so the
 * curtain reads as one coherent ribbon instead of three colours fighting. The
 * stops are also brighter than the brand's flat tokens because the shader
 * multiplies colour by an intensity that peaks near 0.7; picking the flat tokens
 * lands everything in mud. Hoisted to module scope so the identity stays stable
 * and Aurora's uniform-sync effect doesn't re-run on every render.
 */
const AURORA_STOPS: AuroraColorStops = ['#37945d', '#f5cf82', '#37945d'];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const TRUST = [
  'Multi-brand store',
  'Expert bat selection',
  'Custom engraving',
  'Nationwide shipping',
];

export function Hero() {
  const reduced = useReducedMotion();

  // With variants omitted the tree renders in its final state — no motion at all.
  const motionProps = reduced
    ? {}
    : { variants: container, initial: 'hidden' as const, animate: 'visible' as const };
  const itemProps = reduced ? {} : { variants: item };

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border bg-background"
      aria-labelledby="hero-heading"
    >
      {/* ── Animated background ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {/* Depth under the curtain — and the entire visual if WebGL is unavailable.
            Kept faint: anything heavier reads as brown haze once the curtain
            paints over it. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 70% at 50% -15%, rgba(154,123,79,0.16) 0%, rgba(79,157,92,0.06) 40%, transparent 70%)',
          }}
        />

        <Aurora
          className="absolute inset-0"
          colorStops={AURORA_STOPS}
          amplitude={1.1}
          blend={0.5}
          speed={0.55}
        />

        {/* Scrim: bottom-weighted rather than a blob over the middle, which would
            smother the curtain exactly where it is brightest. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(14,13,11,0.30) 45%, rgba(14,13,11,0.80) 100%)',
          }}
        />

        {/* Dissolve into the section below. */}
        <div
          className="absolute inset-x-0 bottom-0 h-44"
          style={{
            background:
              'linear-gradient(to top, #0e0d0b 0%, rgba(14,13,11,0.62) 45%, transparent 100%)',
          }}
        />

        <div className="willow-grain absolute inset-0 opacity-60" />
      </div>

      {/* ── Content ── */}
      <motion.div
        className="container-main relative flex min-h-[min(88svh,48rem)] flex-col items-center justify-center py-20 text-center sm:py-24"
        {...motionProps}
      >
        <motion.div {...itemProps}>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Handcrafted in Kashmir
          </span>
        </motion.div>

        <motion.h1
          id="hero-heading"
          className="heading-xl mt-7 max-w-4xl text-balance text-foreground"
          {...itemProps}
        >
          The home of
          <span
            className="mt-1 block"
            style={{
              backgroundImage:
                'linear-gradient(100deg, #e8c877 0%, #f7ecd2 45%, #9a7b4f 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Kashmiri Willow
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          {...itemProps}
        >
          Authentic Kashmir Willow bats and professional cricket equipment from
          established brands — KIS, JK, Valleywoods, SLS and more.
        </motion.p>

        <motion.div
          className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          {...itemProps}
        >
          <ButtonLink
            href="/categories/kashmir-willow-bats"
            variant="primary"
            size="lg"
            className="border-accent bg-accent text-[#12100c] shadow-[0_14px_40px_-14px_rgba(154,123,79,0.85)] hover:border-accent-hover hover:bg-accent-hover"
          >
            Shop Kashmir Willow
          </ButtonLink>
          <ButtonLink
            href="/brands/kis"
            variant="outline"
            size="lg"
            className="backdrop-blur-sm"
          >
            Explore KIS
          </ButtonLink>
        </motion.div>

        <motion.ul
          className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-muted"
          {...itemProps}
        >
          {TRUST.map((entry, i) => (
            <li key={entry} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden="true" className="text-border-strong">
                  ·
                </span>
              )}
              {entry}
            </li>
          ))}
        </motion.ul>

        <motion.div className="mt-14" {...itemProps}>
          <span
            aria-hidden="true"
            className="mx-auto flex h-9 w-5 items-start justify-center rounded-full border border-white/15 p-1"
          >
            <span className="animate-scroll-cue h-1.5 w-1 rounded-full bg-accent" />
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
