"use client";

/* ── LightRays ──────────────────────────────────────────────────────────────────
 *
 * Volumetric light shafts, drawn as a single full-bleed fragment shader.
 * Adapted from the React Bits `LightRays` (reactbits.dev).
 *
 * The shader itself is carried over verbatim — it is the artwork, and the ray
 * strength function is what the effect *is*. What changed is the lifecycle around
 * it, for four reasons:
 *
 *  1. The GL context is created once, not per visibility change. The original
 *     tears the whole renderer down and rebuilds it every time the section scrolls
 *     out of view and back — calling `WEBGL_lose_context` and constructing a fresh
 *     `Renderer` each pass. Context creation is expensive and browsers cap how many
 *     a page may hold, so scrolling up and down a homepage was the worst case for
 *     it. Visibility now only pauses the frame loop, which is the thing that costs
 *     anything to run.
 *
 *  2. It honours `prefers-reduced-motion`. A full-bleed light sweep behind text is
 *     exactly the kind of large-area ambient movement that setting exists for.
 *     Reduced motion renders one frame and stops, so the shafts are still there and
 *     the section still looks lit; they simply stop moving.
 *
 *  3. The mouse listener is bound only while the rays are on screen. The original
 *     holds a `window` mousemove handler for the lifetime of the component,
 *     wherever the visitor has scrolled to.
 *
 *  4. It resizes with the element, not just the window. `window.resize` misses the
 *     section growing because the copy beside it re-wrapped, which left the rays
 *     anchored to a stale height — and a zero height makes `maxDistance` zero in
 *     the shader and divides by it.
 */

import { useEffect, useRef } from "react";
import { Renderer, Program, Triangle, Mesh } from "ogl";
import "./LightRays.css";

export type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "right"
  | "left"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

export interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  /** Six-digit hex. */
  raysColor?: string;
  raysSpeed?: number;
  /** Lower is a tighter beam, higher is a wider fan. */
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
}

const DEFAULT_COLOR = "#ffffff";

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [
        parseInt(m[1], 16) / 255,
        parseInt(m[2], 16) / 255,
        parseInt(m[3], 16) / 255,
      ]
    : [1, 1, 1];
}

/** Where the rays come from, and which way they point. The anchor sits a little
 *  outside the box so the shafts enter the frame already spread rather than all
 *  converging on a visible point on the edge. */
function getAnchorAndDir(
  origin: RaysOrigin,
  w: number,
  h: number,
): { anchor: [number, number]; dir: [number, number] } {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case "top-right":
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case "left":
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case "right":
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case "bottom-center":
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case "bottom-right":
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default:
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
}

const VERTEX = /* glsl */ `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = /* glsl */ `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;

  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);

  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);

  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}`;

export function LightRays({
  raysOrigin = "top-center",
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
  className = "",
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /* The uniform objects, so a prop change can be written straight into the running
     program instead of tearing the GL context down and building another. */
  const uniformsRef = useRef<Record<string, { value: unknown }> | null>(null);
  const rendererRef = useRef<Renderer | null>(null);

  /* Live prop values for the frame loop, which is created once and must not close
     over the first render's props. */
  const propsRef = useRef({
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
  });
  /* Written in an effect, not during render. `react-hooks/refs` is right to flag
     the direct assignment: a ref mutated during render is read by whatever renders
     next, which under concurrent rendering is not necessarily this pass. The frame
     loop only reads this after mount, so an effect is both correct and sufficient. */
  useEffect(() => {
    propsRef.current = {
      raysOrigin,
      raysColor,
      raysSpeed,
      lightSpread,
      rayLength,
      pulsating,
      fadeDistance,
      saturation,
      followMouse,
      mouseInfluence,
      noiseAmount,
      distortion,
    };
  }, [
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let mesh: Mesh | null = null;
    let frame: number | null = null;
    let disposed = false;
    let sized = false;

    const mouse = { x: 0.5, y: 0.5 };
    const smoothMouse = { x: 0.5, y: 0.5 };

    /* WebGL is not universal — a locked-down browser, a blocklisted driver, or a
       page that already holds too many contexts will all fail here. The rays are
       decoration, so the section simply goes without them. */
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: true,
      });
    } catch (error) {
      console.warn("[light-rays] WebGL unavailable, skipping", error);
      return;
    }

    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      rayPos: { value: [0, 0] },
      rayDir: { value: [0, 1] },
      raysColor: { value: hexToRgb(raysColor) },
      raysSpeed: { value: raysSpeed },
      lightSpread: { value: lightSpread },
      rayLength: { value: rayLength },
      pulsating: { value: pulsating ? 1.0 : 0.0 },
      fadeDistance: { value: fadeDistance },
      saturation: { value: saturation },
      mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: mouseInfluence },
      noiseAmount: { value: noiseAmount },
      distortion: { value: distortion },
    };

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms,
    });
    mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    uniformsRef.current = uniforms;
    rendererRef.current = renderer;

    const updatePlacement = () => {
      if (!renderer || disposed) return;
      const wCSS = container.clientWidth;
      const hCSS = container.clientHeight;
      /* A zero-height container makes `maxDistance` zero in the shader and the
         ray falloff divides by it. Wait for a real box instead. */
      if (wCSS <= 0 || hCSS <= 0) {
        sized = false;
        return;
      }
      sized = true;

      renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(wCSS, hCSS);

      const w = wCSS * renderer.dpr;
      const h = hCSS * renderer.dpr;
      uniforms.iResolution.value = [w, h];

      const { anchor, dir } = getAnchorAndDir(propsRef.current.raysOrigin, w, h);
      uniforms.rayPos.value = anchor;
      uniforms.rayDir.value = dir;
    };

    const render = (timeMs: number) => {
      if (!renderer || !mesh || disposed || !sized) return;
      uniforms.iTime.value = timeMs * 0.001;

      const { followMouse: follow, mouseInfluence: influence } = propsRef.current;
      if (follow && influence > 0) {
        // Heavy smoothing, so the shafts drift toward the cursor rather than
        // snapping to it.
        const smoothing = 0.92;
        smoothMouse.x = smoothMouse.x * smoothing + mouse.x * (1 - smoothing);
        smoothMouse.y = smoothMouse.y * smoothing + mouse.y * (1 - smoothing);
        uniforms.mousePos.value = [smoothMouse.x, smoothMouse.y];
      }

      try {
        renderer.render({ scene: mesh });
      } catch (error) {
        // A lost context mid-scroll would otherwise throw once per frame forever.
        console.warn("[light-rays] render failed, stopping", error);
        stop();
      }
    };

    const loop = (timeMs: number) => {
      render(timeMs);
      if (!disposed) frame = requestAnimationFrame(loop);
    };

    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    const start = () => {
      if (frame !== null || disposed) return;
      frame = requestAnimationFrame(loop);
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      mouse.x = (event.clientX - rect.left) / rect.width;
      mouse.y = (event.clientY - rect.top) / rect.height;
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* One frame and stop for a viewer who asked for less motion. The shafts are
       still drawn, so the section is still lit — they hold still. */
    const apply = (visible: boolean) => {
      if (!visible) {
        stop();
        window.removeEventListener("mousemove", onMouseMove);
        return;
      }
      if (reduceMotion.matches) {
        stop();
        render(performance.now());
        return;
      }
      if (propsRef.current.followMouse) {
        window.addEventListener("mousemove", onMouseMove, { passive: true });
      }
      start();
    };

    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        apply(visible);
      },
      { threshold: 0 },
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver(() => {
      updatePlacement();
      // Repaint at the new size even while paused, or a resize leaves a stretched
      // frame behind.
      if (frame === null && visible) render(performance.now());
    });
    resizeObserver.observe(container);

    const onReduceMotionChange = () => apply(visible);
    reduceMotion.addEventListener("change", onReduceMotionChange);

    updatePlacement();

    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", onReduceMotionChange);
      window.removeEventListener("mousemove", onMouseMove);

      /* Hand the context back. A browser keeps only a handful alive, and this page
         also has the 3D studio one route away. */
      try {
        const lose = gl.getExtension("WEBGL_lose_context");
        lose?.loseContext();
        gl.canvas.parentNode?.removeChild(gl.canvas);
      } catch (error) {
        console.warn("[light-rays] cleanup failed", error);
      }
      uniformsRef.current = null;
      rendererRef.current = null;
    };
    // Mount once. Prop changes are pushed through `propsRef` and the effect below,
    // so a colour tweak does not rebuild the GL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Prop changes are written into the live program. This is the effect the comment
     above refers to: without it, changing `raysColor` would either do nothing or —
     if the props were in the mount effect's dependency list, as they are in the
     original — throw away a working WebGL context and build a replacement to
     change three floats. */
  useEffect(() => {
    const uniforms = uniformsRef.current;
    const renderer = rendererRef.current;
    const container = containerRef.current;
    if (!uniforms || !renderer || !container) return;

    uniforms.raysColor.value = hexToRgb(raysColor);
    uniforms.raysSpeed.value = raysSpeed;
    uniforms.lightSpread.value = lightSpread;
    uniforms.rayLength.value = rayLength;
    uniforms.pulsating.value = pulsating ? 1.0 : 0.0;
    uniforms.fadeDistance.value = fadeDistance;
    uniforms.saturation.value = saturation;
    uniforms.mouseInfluence.value = mouseInfluence;
    uniforms.noiseAmount.value = noiseAmount;
    uniforms.distortion.value = distortion;

    // The origin is in pixels, so it has to be recomputed rather than copied.
    const w = container.clientWidth * renderer.dpr;
    const h = container.clientHeight * renderer.dpr;
    if (w > 0 && h > 0) {
      const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
      uniforms.rayPos.value = anchor;
      uniforms.rayDir.value = dir;
    }
  }, [
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  return (
    <div
      ref={containerRef}
      className={`light-rays-container ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export default LightRays;
