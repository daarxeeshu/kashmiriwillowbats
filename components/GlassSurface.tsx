"use client";

import {
  type CSSProperties,
  type ReactNode,
  useId,
  useMemo,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";

export interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  displace?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  brightness?: number;
  opacity?: number;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  interactive?: boolean;
  as?: "div" | "section" | "nav" | "header" | "aside";
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function GlassSurface({
  children,
  className,
  width,
  height,
  borderRadius = 16,
  displace = 0.35,
  distortionScale = -120,
  redOffset = 0,
  greenOffset = 8,
  blueOffset = 16,
  brightness = 55,
  opacity = 0.88,
  mixBlendMode = "normal",
  interactive = false,
  as: Component = "div",
}: GlassSurfaceProps) {
  const filterId = useId().replace(/:/g, "");
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const style = useMemo(
    () =>
      ({
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius:
          typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
        "--glass-opacity": opacity,
        "--glass-brightness": `${brightness}%`,
        mixBlendMode,
      }) as CSSProperties,
    [width, height, borderRadius, opacity, brightness, mixBlendMode],
  );

  const useDistortion = !reducedMotion && displace > 0;

  return (
    <>
      {useDistortion && (
        <svg
          className="glass-displacement-filter"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency={0.008 * displace}
                numOctaves={2}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={distortionScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feColorMatrix
                type="matrix"
                values={`1 0 0 0 ${redOffset / 255}
                         0 1 0 0 ${greenOffset / 255}
                         0 0 1 0 ${blueOffset / 255}
                         0 0 0 1 0`}
              />
            </filter>
          </defs>
        </svg>
      )}

      <Component
        className={cn(
          "relative overflow-hidden border border-[var(--glass-border)]",
          "bg-[rgba(20,18,16,calc(var(--glass-opacity)*0.65))]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.24)]",
          "backdrop-blur-xl backdrop-saturate-150",
          "transition-[box-shadow,background-color,border-color] duration-300",
          interactive &&
            "hover:border-[rgba(255,255,255,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_40px_rgba(0,0,0,0.32)]",
          className,
        )}
        style={{
          ...style,
          filter: useDistortion ? `url(#${filterId}) brightness(var(--glass-brightness))` : undefined,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-black/[0.08]"
        />
        <div className="relative z-[1]">{children}</div>
      </Component>
    </>
  );
}
