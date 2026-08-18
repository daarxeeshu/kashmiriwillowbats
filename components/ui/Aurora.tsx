'use client';

import { useEffect, useRef } from 'react';
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl';
import './Aurora.css';

export type AuroraColorStops = [string, string, string];

export interface AuroraProps {
  /** Three hex colours defining the aurora gradient, left to right. */
  colorStops?: AuroraColorStops;
  /** Animation rate. 1 is the reference speed. */
  speed?: number;
  /** How softly the curtain dissolves into the background. */
  blend?: number;
  /** Height intensity of the curtain. */
  amplitude?: number;
  className?: string;
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

const DEFAULT_STOPS: AuroraColorStops = ['#5227FF', '#7cff67', '#5227FF'];

/** The shader expects an array of vec3s; ogl's Color is already an [r, g, b] array. */
const toRgb = (stops: AuroraColorStops): number[][] =>
  stops.map((hex) => {
    const c = new Color(hex);
    return [c.r, c.g, c.b];
  });

interface AuroraContext {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
}

/**
 * Keyed by container element so the uniform-sync effect can reach the GL objects
 * without the mount effect having to depend on any prop.
 */
const ctxMap = new WeakMap<HTMLDivElement, AuroraContext>();

/**
 * Animated aurora curtain rendered on a full-screen triangle.
 *
 * The GL context is built once on mount; prop changes only write uniforms, so
 * retuning colours or speed never costs a context rebuild. The render loop is
 * suspended whenever the element leaves the viewport or the tab is hidden, and
 * skipped entirely under `prefers-reduced-motion` (a single static frame is
 * drawn instead).
 */
export default function Aurora({
  colorStops = DEFAULT_STOPS,
  speed = 1.0,
  blend = 0.5,
  amplitude = 1.0,
  className = '',
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A `const` from an IIFE keeps the null check narrowed inside the closures below.
    const renderer = ((): Renderer | null => {
      try {
        return new Renderer({
          alpha: true,
          premultipliedAlpha: true,
          antialias: true,
          // The curtain is a soft gradient, so 1.5x is indistinguishable from
          // 2x while costing far less fill rate on integrated GPUs.
          dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        });
      } catch (e) {
        console.error('Aurora: could not create a WebGL context.', e);
        return null;
      }
    })();
    if (!renderer) return;

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const canvas = gl.canvas;
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    // The vertex shader only declares `position`.
    delete geometry.attributes.uv;

    const program = ((): Program | null => {
      try {
        return new Program(gl, {
          vertex: VERT,
          fragment: FRAG,
          uniforms: {
            uTime: { value: 0 },
            uAmplitude: { value: 1.0 },
            uColorStops: { value: toRgb(DEFAULT_STOPS) },
            uResolution: { value: [1, 1] },
            uBlend: { value: 0.5 },
          },
        });
      } catch (e) {
        console.error('Aurora: could not compile the shader program.', e);
        return null;
      }
    })();
    if (!program) {
      container.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }

    const mesh = new Mesh(gl, { geometry, program });
    ctxMap.set(container, { renderer, program, mesh });

    const setSize = () => {
      const width = Math.max(1, container.offsetWidth);
      const height = Math.max(1, container.offsetHeight);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const draw = () => {
      program.uniforms.uTime.value = elapsed;
      renderer.render({ scene: mesh });
    };

    const loop = (t: number) => {
      if (last === 0) last = t;
      // Clamped so a long stall (tab switch, GC pause) can't jump the curtain.
      const dt = Math.min(t - last, 64);
      last = t;
      elapsed += dt * 0.001 * speedRef.current;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      // The box may have changed while we were paused: a hidden document skips
      // the "update the rendering" step, which starves ResizeObserver callbacks
      // until it becomes visible again. Re-measure before the first resumed
      // frame so we never composite one frame at a stale size.
      setSize();
      if (reducedMotion.matches) {
        draw();
        return;
      }
      if (isVisible && isPageVisible && raf === 0) {
        raf = requestAnimationFrame(loop);
      }
    };

    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      // Resuming restarts the delta from the next frame rather than jumping.
      last = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) tryStart();
        else tryStop();
      },
      { threshold: 0 },
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onReducedMotionChange = () => {
      if (reducedMotion.matches) {
        tryStop();
        draw();
      } else {
        tryStart();
      }
    };
    reducedMotion.addEventListener('change', onReducedMotionChange);

    tryStart();

    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onReducedMotionChange);
      ctxMap.delete(container);
      try {
        container.removeChild(canvas);
      } catch {
        // The node may already be gone if React unmounted the tree first.
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;

    const u = ctx.program.uniforms;
    u.uAmplitude.value = amplitude;
    u.uBlend.value = blend;
    u.uColorStops.value = toRgb(colorStops);
    speedRef.current = speed;
  }, [amplitude, blend, speed, colorStops]);

  return <div ref={containerRef} className={`aurora-container ${className}`.trim()} />;
}
