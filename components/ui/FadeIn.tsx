"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/* Scroll-reveal wrappers used across the home page sections.
 *
 * ── Why this is CSS + IntersectionObserver, not framer-motion ──
 * The previous version rendered `initial={{opacity:0}}` inline and relied on
 * framer's requestAnimationFrame loop to animate it away on `whileInView`. That is
 * the exact failure mode the hero's own comments warn about: iOS Safari pauses rAF
 * during momentum scrolling, backgrounded tabs and bfcache restores, so an element
 * scrolled past while rAF is not ticking stays at opacity 0 with nothing left to
 * move it. On a real iPhone that was most of the home page: every FadeIn-wrapped
 * section rendered as a blank band. The hero was already converted to CSS
 * animations for precisely this reason; these wrappers now follow it.
 *
 * The mechanics that make this version un-strandable:
 *
 *   1. The server markup is VISIBLE. No inline opacity:0 ever reaches the HTML, so
 *      with JavaScript off, before hydration, or under any animation failure, the
 *      content simply shows. (This also preserves the fix this file already
 *      carried: server and reduced-motion client render the same tree, so there is
 *      no hydration mismatch to leave stuck styles behind.)
 *   2. A layout effect hides an element ONLY if it is still below the viewport at
 *      hydration time — hiding happens before paint, so nothing flashes, and
 *      above-the-fold content is never hidden at all.
 *   3. IntersectionObserver — which iOS fires reliably, including mid-momentum —
 *      removes the hidden class, and the transition runs entirely on the
 *      compositor. No JS frame loop is involved at any point.
 *
 * Reduced motion is handled in globals.css by zeroing the transition, which is the
 * same "arrive instantly at the visible state" this component always promised. */

const HIDDEN_CLASS = "reveal-hidden";

/** Matches the old framer `viewport={{margin:"-60px"}}`: reveal starts once the
 *  element is 60px inside the bottom edge, so it is moving as the reader meets it. */
const ROOT_MARGIN = "0px 0px -60px 0px";

function useReveal(delaySeconds: number) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;

    /* Hide only what the reader has not reached: anything whose top is already
       inside the viewport stays visible, so the first screen never blinks and a
       mid-page hydration (bfcache, back-navigation) cannot hide what is being
       read. Runs before paint, so below-fold hiding is invisible by definition. */
    if (node.getBoundingClientRect().top > window.innerHeight - 60) {
      node.classList.add(HIDDEN_CLASS);
    } else {
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.remove(HIDDEN_CLASS);
          io.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    io.observe(node);

    return () => {
      io.disconnect();
      // Effect cleanup re-runs in StrictMode: never leave content hidden behind.
      node.classList.remove(HIDDEN_CLASS);
    };
  }, []);

  return {
    ref,
    style:
      delaySeconds > 0
        ? ({ "--reveal-delay": `${delaySeconds}s` } as CSSProperties)
        : undefined,
  };
}

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "none";
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const { ref, style } = useReveal(delay);

  return (
    <div
      ref={ref}
      style={style}
      className={cn("reveal", direction === "none" && "reveal-flat", className)}
    >
      {children}
    </div>
  );
}

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

/** The stagger is nothing but a delay ladder: each child gets its index times 80ms
 *  as `--reveal-delay`, and every item then reveals through the same observer as a
 *  FadeIn. When a row scrolls in, its items intersect together and the delays fan
 *  them out — same choreography the framer variants produced. */
export function StaggerGrid({ children, className }: StaggerGridProps) {
  return (
    <div className={cn(className)}>
      {Children.map(children, (child, index) =>
        isValidElement<{ style?: CSSProperties }>(child)
          ? cloneElement(child, {
              style: {
                ...child.props.style,
                ["--reveal-delay" as string]: `${index * 0.08}s`,
              },
            })
          : child,
      )}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Injected by StaggerGrid (the delay ladder); merged, not required. */
  style?: CSSProperties;
}) {
  const { ref } = useReveal(0);

  return (
    <div ref={ref} style={style} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
