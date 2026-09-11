"use client";

/* ── ElectricBorder ─────────────────────────────────────────────────────────────
 *
 * A glowing, animated border wrapper: a rounded-rectangle path walked at ~2px
 * intervals, each sample pushed off the path by fractal noise, redrawn every frame.
 * The geometry lives in `electric-border-path.ts`; this file is the canvas, the
 * loop and the lifecycle.
 *
 * Component inspired by @BalintFerenczy on X
 * https://codepen.io/BalintFerenczy/pen/KwdoyEN
 * Adapted from the React Bits `ElectricBorder` (reactbits.dev).
 *
 * ── What was changed from the source, and why ──
 *
 *  1. It stops when nobody is looking. The original runs `requestAnimationFrame`
 *     for the lifetime of the component. This card sits in the middle of the
 *     homepage, so that is a permanent ten-octave noise loop over ~600 samples a
 *     frame running while the visitor reads the footer. An IntersectionObserver
 *     gates the loop on actually being on screen — the same reason the 3D studio's
 *     viewer renders on demand.
 *
 *  2. It honours `prefers-reduced-motion`. A crawling electric edge is exactly the
 *     kind of continuous peripheral movement that setting exists for. Reduced
 *     motion draws one static frame and stops, so the border is still there and
 *     still electric; it just holds still.
 *
 *  3. `thickness` is implemented. The source's usage example passes it and the
 *     component ignores it — `ctx.lineWidth` was hard-coded to 1 — so the prop
 *     silently did nothing.
 *
 *  4. The geometry is a separate pure module rather than a pile of `useCallback`s
 *     over functions that close over nothing. That also makes the animation
 *     testable without a browser, which matters because `requestAnimationFrame` is
 *     throttled in some environments and a static-looking canvas is otherwise
 *     indistinguishable from a broken one.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  electricPoint,
  sampleCountFor,
  type PathOptions,
} from "./electric-border-path";
import "./ElectricBorder.css";

export interface ElectricBorderProps {
  children?: ReactNode;
  /** Stroke and glow colour. Any CSS colour. */
  color?: string;
  /** Animation speed multiplier. Higher is faster. */
  speed?: number;
  /** Distortion intensity. 0 is a clean rounded rectangle. */
  chaos?: number;
  /** Stroke width of the animated line, in px. */
  thickness?: number;
  /** Radius of the electric path, in px. Match the content's own radius. */
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
}

/** How far outside the content the canvas extends, so a spike at full chaos is not
 *  clipped at the edge of its own canvas. */
const BORDER_OFFSET = 60;

export function ElectricBorder({
  children,
  color = "#5227FF",
  speed = 1,
  chaos = 0.12,
  thickness = 2,
  borderRadius = 24,
  className,
  style,
}: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let lastDpr = 0;
    let time = 0;
    let lastFrameTime = 0;
    let frame: number | null = null;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width + BORDER_OFFSET * 2;
      height = rect.height + BORDER_OFFSET * 2;

      // Capped at 2: a 3x phone screen would triple the fill cost for a glow
      // nobody can resolve at that density.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      lastDpr = dpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (dpr !== lastDpr) updateSize();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const pathWidth = width - 2 * BORDER_OFFSET;
      const pathHeight = height - 2 * BORDER_OFFSET;
      if (pathWidth <= 0 || pathHeight <= 0) return;

      const maxRadius = Math.min(pathWidth, pathHeight) / 2;
      const options: PathOptions = {
        left: BORDER_OFFSET,
        top: BORDER_OFFSET,
        width: pathWidth,
        height: pathHeight,
        radius: Math.min(borderRadius, maxRadius),
        chaos,
        time,
      };

      const samples = sampleCountFor(pathWidth, pathHeight, options.radius);

      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const { x, y } = electricPoint(i / samples, options);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const tick = (now: number) => {
      // First frame after a pause: no elapsed time, or the border would jump
      // forward by however long it was off screen.
      if (lastFrameTime === 0) lastFrameTime = now;
      time += ((now - lastFrameTime) / 1000) * speed;
      lastFrameTime = now;
      draw();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastFrameTime = 0;
    };

    const start = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(tick);
    };

    updateSize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* One static frame and nothing else for a viewer who asked for less motion.
       The two blurred CSS borders underneath are unaffected, so the frame still
       reads as an electric edge — it simply holds still. */
    const apply = () => {
      if (reduceMotion.matches) {
        stop();
        draw();
        return;
      }
      start();
    };

    /* Only animate while on screen. Without this the loop runs for as long as the
       page is open, wherever the visitor has scrolled to. The first paint happens
       here too, so the border is present before it is ever in view. */
    draw();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) apply();
        else stop();
      },
      { rootMargin: "100px" },
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      // Repaint immediately, so a resize while paused or reduced does not leave a
      // stale border at the old size.
      if (frame === null) draw();
    });
    resizeObserver.observe(container);

    reduceMotion.addEventListener("change", apply);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", apply);
    };
  }, [color, speed, chaos, thickness, borderRadius]);

  const vars = {
    "--electric-border-color": color,
    "--electric-border-thickness": `${thickness}px`,
    borderRadius,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`electric-border ${className ?? ""}`}
      style={{ ...vars, ...style }}
    >
      {/* Decoration only. A screen reader has no use for a glowing edge, and the
          canvas would otherwise be announced as an unlabelled image. */}
      <div className="eb-canvas-container" aria-hidden="true">
        <canvas ref={canvasRef} className="eb-canvas" />
      </div>
      <div className="eb-layers" aria-hidden="true">
        <div className="eb-glow-1" />
        <div className="eb-glow-2" />
        <div className="eb-background-glow" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
}

export default ElectricBorder;
